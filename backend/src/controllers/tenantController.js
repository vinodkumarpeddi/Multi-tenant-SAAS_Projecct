const db = require('../config/database');
const response = require('../utils/responseHelper');
const { logAudit, getClientIp } = require('../utils/auditLogger');

/**
 * Get all tenants (super_admin only)
 * GET /api/tenants
 */
const listTenants = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, subscriptionPlan } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = Math.min(parseInt(limit), 100);

        // Build query with filters
        let whereClause = '';
        const params = [];
        let paramIndex = 1;

        if (status) {
            whereClause += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (subscriptionPlan) {
            whereClause += ` AND subscription_plan = $${paramIndex}`;
            params.push(subscriptionPlan);
            paramIndex++;
        }

        // Get total count
        const countResult = await db.query(
            `SELECT COUNT(*) FROM tenants WHERE 1=1 ${whereClause}`,
            params
        );
        const totalTenants = parseInt(countResult.rows[0].count);

        // Get tenants with user and project counts
        const tenantsResult = await db.query(
            `SELECT t.id, t.name, t.subdomain, t.status, t.subscription_plan, 
              t.max_users, t.max_projects, t.created_at,
              (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as total_users,
              (SELECT COUNT(*) FROM projects WHERE tenant_id = t.id) as total_projects
       FROM tenants t
       WHERE 1=1 ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limitNum, offset]
        );

        const tenants = tenantsResult.rows.map(t => ({
            id: t.id,
            name: t.name,
            subdomain: t.subdomain,
            status: t.status,
            subscriptionPlan: t.subscription_plan,
            totalUsers: parseInt(t.total_users),
            totalProjects: parseInt(t.total_projects),
            createdAt: t.created_at
        }));

        return response.success(res, {
            tenants,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalTenants / limitNum),
                totalTenants,
                limit: limitNum
            }
        });

    } catch (error) {
        console.error('List tenants error:', error);
        return response.error(res, 'Failed to list tenants', 500);
    }
};

/**
 * Get tenant details
 * GET /api/tenants/:id
 */
const getTenant = async (req, res) => {
    try {
        const { id } = req.params;

        // Get tenant with stats
        const result = await db.query(
            `SELECT t.id, t.name, t.subdomain, t.status, t.subscription_plan, 
              t.max_users, t.max_projects, t.created_at, t.updated_at,
              (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as total_users,
              (SELECT COUNT(*) FROM projects WHERE tenant_id = t.id) as total_projects,
              (SELECT COUNT(*) FROM tasks WHERE tenant_id = t.id) as total_tasks
       FROM tenants t
       WHERE t.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return response.notFound(res, 'Tenant not found');
        }

        const tenant = result.rows[0];

        return response.success(res, {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.status,
            subscriptionPlan: tenant.subscription_plan,
            maxUsers: tenant.max_users,
            maxProjects: tenant.max_projects,
            createdAt: tenant.created_at,
            stats: {
                totalUsers: parseInt(tenant.total_users),
                totalProjects: parseInt(tenant.total_projects),
                totalTasks: parseInt(tenant.total_tasks)
            }
        });

    } catch (error) {
        console.error('Get tenant error:', error);
        return response.error(res, 'Failed to get tenant', 500);
    }
};

/**
 * Update tenant
 * PUT /api/tenants/:id
 */
const updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;
        const { role } = req.user;

        // Check tenant exists
        const checkResult = await db.query(
            'SELECT id FROM tenants WHERE id = $1',
            [id]
        );
        if (checkResult.rows.length === 0) {
            return response.notFound(res, 'Tenant not found');
        }

        // Build update query based on role
        const updates = [];
        const params = [];
        let paramIndex = 1;

        // All authorized users can update name
        if (name !== undefined) {
            updates.push(`name = $${paramIndex}`);
            params.push(name.trim());
            paramIndex++;
        }

        // Only super_admin can update these fields
        if (role === 'super_admin') {
            if (status !== undefined) {
                if (!['active', 'suspended', 'trial'].includes(status)) {
                    return response.error(res, 'Invalid status value', 400);
                }
                updates.push(`status = $${paramIndex}`);
                params.push(status);
                paramIndex++;
            }

            if (subscriptionPlan !== undefined) {
                if (!['free', 'pro', 'enterprise'].includes(subscriptionPlan)) {
                    return response.error(res, 'Invalid subscription plan', 400);
                }
                updates.push(`subscription_plan = $${paramIndex}`);
                params.push(subscriptionPlan);
                paramIndex++;

                // Update limits based on plan if not explicitly provided
                if (maxUsers === undefined && maxProjects === undefined) {
                    const limits = {
                        free: { users: 5, projects: 3 },
                        pro: { users: 25, projects: 15 },
                        enterprise: { users: 100, projects: 50 }
                    };
                    updates.push(`max_users = $${paramIndex}`);
                    params.push(limits[subscriptionPlan].users);
                    paramIndex++;
                    updates.push(`max_projects = $${paramIndex}`);
                    params.push(limits[subscriptionPlan].projects);
                    paramIndex++;
                }
            }

            if (maxUsers !== undefined) {
                updates.push(`max_users = $${paramIndex}`);
                params.push(maxUsers);
                paramIndex++;
            }

            if (maxProjects !== undefined) {
                updates.push(`max_projects = $${paramIndex}`);
                params.push(maxProjects);
                paramIndex++;
            }
        } else {
            // Non-super_admin trying to update restricted fields
            if (status !== undefined || subscriptionPlan !== undefined ||
                maxUsers !== undefined || maxProjects !== undefined) {
                return response.forbidden(res, 'Only super admin can update these fields');
            }
        }

        if (updates.length === 0) {
            return response.error(res, 'No valid fields to update', 400);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const result = await db.query(
            `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, updated_at`,
            params
        );

        // Log audit
        await logAudit({
            tenantId: id,
            userId: req.user.userId,
            action: 'UPDATE_TENANT',
            entityType: 'tenant',
            entityId: id,
            ipAddress: getClientIp(req)
        });

        return response.success(res, {
            id: result.rows[0].id,
            name: result.rows[0].name,
            updatedAt: result.rows[0].updated_at
        }, 'Tenant updated successfully');

    } catch (error) {
        console.error('Update tenant error:', error);
        return response.error(res, 'Failed to update tenant', 500);
    }
};

module.exports = {
    listTenants,
    getTenant,
    updateTenant
};
