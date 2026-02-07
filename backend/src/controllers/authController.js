const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const jwtConfig = require('../config/jwt');
const response = require('../utils/responseHelper');
const { logAudit, getClientIp } = require('../utils/auditLogger');
const { validateTenantRegistration, validateLogin } = require('../utils/validators');

/**
 * Register a new tenant with admin user
 * POST /api/auth/register-tenant
 */
const registerTenant = async (req, res) => {
    const client = await db.getClient();

    try {
        const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

        // Validate input
        const errors = validateTenantRegistration(req.body);
        if (errors.length > 0) {
            return response.error(res, errors.join(', '), 400);
        }

        // Check if subdomain already exists
        const subdomainCheck = await client.query(
            'SELECT id FROM tenants WHERE LOWER(subdomain) = LOWER($1)',
            [subdomain]
        );
        if (subdomainCheck.rows.length > 0) {
            return response.conflict(res, 'Subdomain already exists');
        }

        // Check if email already exists (for any tenant)
        const emailCheck = await client.query(
            'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND tenant_id IS NOT NULL',
            [adminEmail]
        );
        // Note: We allow same email in different tenants, but check for super_admin email
        const superAdminCheck = await client.query(
            'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND tenant_id IS NULL',
            [adminEmail]
        );
        if (superAdminCheck.rows.length > 0) {
            return response.conflict(res, 'Email is reserved for system use');
        }

        // Begin transaction
        await client.query('BEGIN');

        // Create tenant with default free plan limits
        const tenantResult = await client.query(
            `INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES ($1, $2, 'active', 'free', 5, 3)
       RETURNING id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at`,
            [tenantName.trim(), subdomain.toLowerCase().trim()]
        );
        const tenant = tenantResult.rows[0];

        // Hash password
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        // Create admin user
        const userResult = await client.query(
            `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, 'tenant_admin', true)
       RETURNING id, email, full_name, role, created_at`,
            [tenant.id, adminEmail.toLowerCase().trim(), passwordHash, adminFullName.trim()]
        );
        const adminUser = userResult.rows[0];

        // Commit transaction
        await client.query('COMMIT');

        // Log audit
        await logAudit({
            tenantId: tenant.id,
            userId: adminUser.id,
            action: 'REGISTER_TENANT',
            entityType: 'tenant',
            entityId: tenant.id,
            ipAddress: getClientIp(req)
        });

        return response.created(res, {
            tenantId: tenant.id,
            subdomain: tenant.subdomain,
            adminUser: {
                id: adminUser.id,
                email: adminUser.email,
                fullName: adminUser.full_name,
                role: adminUser.role
            }
        }, 'Tenant registered successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Register tenant error:', error);

        if (error.code === '23505') {
            return response.conflict(res, 'Subdomain or email already exists');
        }

        return response.error(res, 'Failed to register tenant', 500);
    } finally {
        client.release();
    }
};

/**
 * User login
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password, tenantSubdomain, tenantId } = req.body;

        // Validate input
        const errors = validateLogin(req.body);
        if (errors.length > 0) {
            return response.error(res, errors.join(', '), 400);
        }

        let tenant = null;

        // Find tenant by subdomain or ID
        if (tenantSubdomain) {
            const tenantResult = await db.query(
                'SELECT id, name, subdomain, status FROM tenants WHERE LOWER(subdomain) = LOWER($1)',
                [tenantSubdomain]
            );
            if (tenantResult.rows.length === 0) {
                return response.notFound(res, 'Tenant not found');
            }
            tenant = tenantResult.rows[0];
        } else if (tenantId) {
            const tenantResult = await db.query(
                'SELECT id, name, subdomain, status FROM tenants WHERE id = $1',
                [tenantId]
            );
            if (tenantResult.rows.length === 0) {
                return response.notFound(res, 'Tenant not found');
            }
            tenant = tenantResult.rows[0];
        }

        // Check tenant status (allow login for super_admin without tenant)
        if (tenant && tenant.status === 'suspended') {
            return response.forbidden(res, 'Tenant account is suspended');
        }

        // Find user - check both tenant users and super_admin
        let userResult;
        if (tenant) {
            userResult = await db.query(
                `SELECT id, tenant_id, email, password_hash, full_name, role, is_active 
         FROM users 
         WHERE LOWER(email) = LOWER($1) AND tenant_id = $2`,
                [email, tenant.id]
            );
        } else {
            // Check for super_admin (tenant_id is NULL)
            userResult = await db.query(
                `SELECT id, tenant_id, email, password_hash, full_name, role, is_active 
         FROM users 
         WHERE LOWER(email) = LOWER($1) AND tenant_id IS NULL`,
                [email]
            );
        }

        if (userResult.rows.length === 0) {
            return response.unauthorized(res, 'Invalid credentials');
        }

        const user = userResult.rows[0];

        // Check if user is active
        if (!user.is_active) {
            return response.forbidden(res, 'Account is deactivated');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return response.unauthorized(res, 'Invalid credentials');
        }

        // Generate JWT token
        const tokenPayload = {
            userId: user.id,
            tenantId: user.tenant_id,
            role: user.role
        };
        const token = jwt.sign(tokenPayload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

        // Log audit
        await logAudit({
            tenantId: user.tenant_id,
            userId: user.id,
            action: 'LOGIN',
            entityType: 'user',
            entityId: user.id,
            ipAddress: getClientIp(req)
        });

        return response.success(res, {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                tenantId: user.tenant_id
            },
            token,
            expiresIn: 86400 // 24 hours in seconds
        });

    } catch (error) {
        console.error('Login error:', error);
        return response.error(res, 'Login failed', 500);
    }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
    try {
        const { userId } = req.user;

        // Get user with tenant info
        const result = await db.query(
            `SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at,
              t.id as tenant_id, t.name as tenant_name, t.subdomain, 
              t.subscription_plan, t.max_users, t.max_projects
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return response.notFound(res, 'User not found');
        }

        const user = result.rows[0];

        return response.success(res, {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            isActive: user.is_active,
            tenant: user.tenant_id ? {
                id: user.tenant_id,
                name: user.tenant_name,
                subdomain: user.subdomain,
                subscriptionPlan: user.subscription_plan,
                maxUsers: user.max_users,
                maxProjects: user.max_projects
            } : null
        });

    } catch (error) {
        console.error('Get current user error:', error);
        return response.error(res, 'Failed to get user profile', 500);
    }
};

/**
 * Logout
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        // Log audit
        await logAudit({
            tenantId: req.user.tenantId,
            userId: req.user.userId,
            action: 'LOGOUT',
            entityType: 'user',
            entityId: req.user.userId,
            ipAddress: getClientIp(req)
        });

        return response.success(res, null, 'Logged out successfully');

    } catch (error) {
        console.error('Logout error:', error);
        return response.success(res, null, 'Logged out successfully');
    }
};

module.exports = {
    registerTenant,
    login,
    getCurrentUser,
    logout
};
