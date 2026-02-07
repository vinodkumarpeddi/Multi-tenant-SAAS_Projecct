const bcrypt = require('bcrypt');
const db = require('../config/database');
const response = require('../utils/responseHelper');
const { logAudit, getClientIp } = require('../utils/auditLogger');
const { validateUserCreation } = require('../utils/validators');

/**
 * Add user to tenant
 * POST /api/tenants/:tenantId/users
 */
const createUser = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { email, password, fullName, role = 'user' } = req.body;

        // Validate input
        const errors = validateUserCreation(req.body);
        if (errors.length > 0) {
            return response.error(res, errors.join(', '), 400);
        }

        // Verify tenant exists
        const tenantResult = await db.query(
            'SELECT id, max_users FROM tenants WHERE id = $1',
            [tenantId]
        );
        if (tenantResult.rows.length === 0) {
            return response.notFound(res, 'Tenant not found');
        }

        const tenant = tenantResult.rows[0];

        // Check user limit
        const userCountResult = await db.query(
            'SELECT COUNT(*) FROM users WHERE tenant_id = $1',
            [tenantId]
        );
        const currentUserCount = parseInt(userCountResult.rows[0].count);

        if (currentUserCount >= tenant.max_users) {
            return response.forbidden(res, `User limit reached. Maximum ${tenant.max_users} users allowed for your subscription plan.`);
        }

        // Check if email already exists in this tenant
        const emailCheck = await db.query(
            'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND tenant_id = $2',
            [email, tenantId]
        );
        if (emailCheck.rows.length > 0) {
            return response.conflict(res, 'Email already exists in this tenant');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await db.query(
            `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, full_name, role, is_active, created_at`,
            [tenantId, email.toLowerCase().trim(), passwordHash, fullName.trim(), role]
        );

        const user = result.rows[0];

        // Log audit
        await logAudit({
            tenantId,
            userId: req.user.userId,
            action: 'CREATE_USER',
            entityType: 'user',
            entityId: user.id,
            ipAddress: getClientIp(req)
        });

        return response.created(res, {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            tenantId,
            isActive: user.is_active,
            createdAt: user.created_at
        }, 'User created successfully');

    } catch (error) {
        console.error('Create user error:', error);
        if (error.code === '23505') {
            return response.conflict(res, 'Email already exists');
        }
        return response.error(res, 'Failed to create user', 500);
    }
};

/**
 * List tenant users
 * GET /api/tenants/:tenantId/users
 */
const listUsers = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { search, role, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = Math.min(parseInt(limit), 100);

        // Build query with filters
        let whereClause = 'WHERE tenant_id = $1';
        const params = [tenantId];
        let paramIndex = 2;

        if (search) {
            whereClause += ` AND (LOWER(full_name) LIKE LOWER($${paramIndex}) OR LOWER(email) LIKE LOWER($${paramIndex}))`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (role) {
            whereClause += ` AND role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        // Get total count
        const countResult = await db.query(
            `SELECT COUNT(*) FROM users ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get users
        const usersResult = await db.query(
            `SELECT id, email, full_name, role, is_active, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limitNum, offset]
        );

        const users = usersResult.rows.map(u => ({
            id: u.id,
            email: u.email,
            fullName: u.full_name,
            role: u.role,
            isActive: u.is_active,
            createdAt: u.created_at
        }));

        return response.success(res, {
            users,
            total,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limitNum),
                limit: limitNum
            }
        });

    } catch (error) {
        console.error('List users error:', error);
        return response.error(res, 'Failed to list users', 500);
    }
};

/**
 * Update user
 * PUT /api/users/:userId
 */
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { fullName, role, isActive } = req.body;
        const currentUser = req.user;

        // Get target user
        const userResult = await db.query(
            'SELECT id, tenant_id, role FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return response.notFound(res, 'User not found');
        }

        const targetUser = userResult.rows[0];

        // Check authorization
        const isSelf = currentUser.userId === userId;
        const isTenantAdmin = currentUser.role === 'tenant_admin';
        const isSuperAdmin = currentUser.role === 'super_admin';
        const sameTenant = currentUser.tenantId === targetUser.tenant_id;

        // Super admin can update any user, tenant_admin can update users in their tenant
        if (!isSuperAdmin && !isSelf && !(isTenantAdmin && sameTenant)) {
            return response.forbidden(res, 'Not authorized to update this user');
        }

        // Build update query
        const updates = [];
        const params = [];
        let paramIndex = 1;

        // Anyone can update their own fullName, tenant_admin can update others
        if (fullName !== undefined) {
            updates.push(`full_name = $${paramIndex}`);
            params.push(fullName.trim());
            paramIndex++;
        }

        // Only tenant_admin or super_admin can update role and isActive (not for themselves)
        if ((isTenantAdmin || isSuperAdmin) && !isSelf) {
            if (role !== undefined) {
                if (!['user', 'tenant_admin'].includes(role)) {
                    return response.error(res, 'Invalid role value', 400);
                }
                updates.push(`role = $${paramIndex}`);
                params.push(role);
                paramIndex++;
            }

            if (isActive !== undefined) {
                updates.push(`is_active = $${paramIndex}`);
                params.push(isActive);
                paramIndex++;
            }
        } else if (!isSelf && (role !== undefined || isActive !== undefined)) {
            return response.forbidden(res, 'Only admin can update role and status');
        }

        if (updates.length === 0) {
            return response.error(res, 'No valid fields to update', 400);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(userId);

        const result = await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, full_name, role, updated_at`,
            params
        );

        // Log audit
        await logAudit({
            tenantId: targetUser.tenant_id,
            userId: currentUser.userId,
            action: 'UPDATE_USER',
            entityType: 'user',
            entityId: userId,
            ipAddress: getClientIp(req)
        });

        return response.success(res, {
            id: result.rows[0].id,
            fullName: result.rows[0].full_name,
            role: result.rows[0].role,
            updatedAt: result.rows[0].updated_at
        }, 'User updated successfully');

    } catch (error) {
        console.error('Update user error:', error);
        return response.error(res, 'Failed to update user', 500);
    }
};

/**
 * Delete user
 * DELETE /api/users/:userId
 */
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.user;

        // Cannot delete self
        if (currentUser.userId === userId) {
            return response.forbidden(res, 'Cannot delete yourself');
        }

        // Get target user
        const userResult = await db.query(
            'SELECT id, tenant_id FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return response.notFound(res, 'User not found');
        }

        const targetUser = userResult.rows[0];

        // Check authorization - must be tenant_admin of same tenant or super_admin
        const isTenantAdmin = currentUser.role === 'tenant_admin';
        const isSuperAdmin = currentUser.role === 'super_admin';
        const sameTenant = currentUser.tenantId === targetUser.tenant_id;

        if (!isSuperAdmin && !(isTenantAdmin && sameTenant)) {
            return response.forbidden(res, 'Not authorized to delete this user');
        }

        // Set assigned_to to NULL for tasks assigned to this user
        await db.query(
            'UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1',
            [userId]
        );

        // Delete user
        await db.query('DELETE FROM users WHERE id = $1', [userId]);

        // Log audit
        await logAudit({
            tenantId: targetUser.tenant_id,
            userId: currentUser.userId,
            action: 'DELETE_USER',
            entityType: 'user',
            entityId: userId,
            ipAddress: getClientIp(req)
        });

        return response.success(res, null, 'User deleted successfully');

    } catch (error) {
        console.error('Delete user error:', error);
        return response.error(res, 'Failed to delete user', 500);
    }
};

module.exports = {
    createUser,
    listUsers,
    updateUser,
    deleteUser
};
