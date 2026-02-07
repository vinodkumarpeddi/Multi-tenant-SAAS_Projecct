const db = require('../config/database');
const response = require('../utils/responseHelper');
const { logAudit, getClientIp } = require('../utils/auditLogger');
const { validateProject } = require('../utils/validators');

/**
 * Create project
 * POST /api/projects
 */
const createProject = async (req, res) => {
    try {
        const { name, description, status = 'active' } = req.body;
        const { userId, tenantId } = req.user;

        // Validate input
        const errors = validateProject(req.body);
        if (errors.length > 0) {
            return response.error(res, errors.join(', '), 400);
        }

        // Get tenant limits
        const tenantResult = await db.query(
            'SELECT max_projects FROM tenants WHERE id = $1',
            [tenantId]
        );

        if (tenantResult.rows.length === 0) {
            return response.error(res, 'Tenant not found', 400);
        }

        const maxProjects = tenantResult.rows[0].max_projects;

        // Check project limit
        const projectCountResult = await db.query(
            'SELECT COUNT(*) FROM projects WHERE tenant_id = $1',
            [tenantId]
        );
        const currentProjectCount = parseInt(projectCountResult.rows[0].count);

        if (currentProjectCount >= maxProjects) {
            return response.forbidden(res, `Project limit reached. Maximum ${maxProjects} projects allowed for your subscription plan.`);
        }

        // Create project
        const result = await db.query(
            `INSERT INTO projects (tenant_id, name, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tenant_id, name, description, status, created_by, created_at`,
            [tenantId, name.trim(), description?.trim() || null, status, userId]
        );

        const project = result.rows[0];

        // Log audit
        await logAudit({
            tenantId,
            userId,
            action: 'CREATE_PROJECT',
            entityType: 'project',
            entityId: project.id,
            ipAddress: getClientIp(req)
        });

        return response.created(res, {
            id: project.id,
            tenantId: project.tenant_id,
            name: project.name,
            description: project.description,
            status: project.status,
            createdBy: project.created_by,
            createdAt: project.created_at
        });

    } catch (error) {
        console.error('Create project error:', error);
        return response.error(res, 'Failed to create project', 500);
    }
};

/**
 * List projects
 * GET /api/projects
 */
const listProjects = async (req, res) => {
    try {
        const { tenantId, role } = req.user;
        const { status, search, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = Math.min(parseInt(limit), 100);

        // Build query with filters
        let whereClause = role === 'super_admin' ? 'WHERE 1=1' : 'WHERE p.tenant_id = $1';
        const params = role === 'super_admin' ? [] : [tenantId];
        let paramIndex = role === 'super_admin' ? 1 : 2;

        if (status) {
            whereClause += ` AND p.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (search) {
            whereClause += ` AND LOWER(p.name) LIKE LOWER($${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Get total count
        const countResult = await db.query(
            `SELECT COUNT(*) FROM projects p ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get projects with task counts and creator info
        const projectsResult = await db.query(
            `SELECT p.id, p.name, p.description, p.status, p.created_at,
              u.id as creator_id, u.full_name as creator_name,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_task_count
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limitNum, offset]
        );

        const projects = projectsResult.rows.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status,
            createdBy: {
                id: p.creator_id,
                fullName: p.creator_name
            },
            taskCount: parseInt(p.task_count),
            completedTaskCount: parseInt(p.completed_task_count),
            createdAt: p.created_at
        }));

        return response.success(res, {
            projects,
            total,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limitNum),
                limit: limitNum
            }
        });

    } catch (error) {
        console.error('List projects error:', error);
        return response.error(res, 'Failed to list projects', 500);
    }
};

/**
 * Get project details
 * GET /api/projects/:projectId
 */
const getProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { tenantId, role } = req.user;

        // Get project
        const result = await db.query(
            `SELECT p.id, p.tenant_id, p.name, p.description, p.status, p.created_at, p.updated_at,
              u.id as creator_id, u.full_name as creator_name,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_task_count
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
            [projectId]
        );

        if (result.rows.length === 0) {
            return response.notFound(res, 'Project not found');
        }

        const project = result.rows[0];

        // Check tenant access
        if (role !== 'super_admin' && project.tenant_id !== tenantId) {
            return response.forbidden(res, 'Access denied');
        }

        return response.success(res, {
            id: project.id,
            tenantId: project.tenant_id,
            name: project.name,
            description: project.description,
            status: project.status,
            createdBy: {
                id: project.creator_id,
                fullName: project.creator_name
            },
            taskCount: parseInt(project.task_count),
            completedTaskCount: parseInt(project.completed_task_count),
            createdAt: project.created_at,
            updatedAt: project.updated_at
        });

    } catch (error) {
        console.error('Get project error:', error);
        return response.error(res, 'Failed to get project', 500);
    }
};

/**
 * Update project
 * PUT /api/projects/:projectId
 */
const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, description, status } = req.body;
        const { userId, tenantId, role } = req.user;

        // Get project
        const projectResult = await db.query(
            'SELECT id, tenant_id, created_by FROM projects WHERE id = $1',
            [projectId]
        );

        if (projectResult.rows.length === 0) {
            return response.notFound(res, 'Project not found');
        }

        const project = projectResult.rows[0];

        // Check tenant access
        if (role !== 'super_admin' && project.tenant_id !== tenantId) {
            return response.notFound(res, 'Project not found');
        }

        // Check authorization - must be tenant_admin or project creator
        const isCreator = project.created_by === userId;
        const isTenantAdmin = role === 'tenant_admin';
        const isSuperAdmin = role === 'super_admin';

        if (!isSuperAdmin && !isTenantAdmin && !isCreator) {
            return response.forbidden(res, 'Not authorized to update this project');
        }

        // Validate status if provided
        if (status && !['active', 'archived', 'completed'].includes(status)) {
            return response.error(res, 'Invalid status value', 400);
        }

        // Build update query
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramIndex}`);
            params.push(name.trim());
            paramIndex++;
        }

        if (description !== undefined) {
            updates.push(`description = $${paramIndex}`);
            params.push(description?.trim() || null);
            paramIndex++;
        }

        if (status !== undefined) {
            updates.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (updates.length === 0) {
            return response.error(res, 'No valid fields to update', 400);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(projectId);

        const result = await db.query(
            `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, name, description, status, updated_at`,
            params
        );

        // Log audit
        await logAudit({
            tenantId: project.tenant_id,
            userId,
            action: 'UPDATE_PROJECT',
            entityType: 'project',
            entityId: projectId,
            ipAddress: getClientIp(req)
        });

        return response.success(res, {
            id: result.rows[0].id,
            name: result.rows[0].name,
            description: result.rows[0].description,
            status: result.rows[0].status,
            updatedAt: result.rows[0].updated_at
        }, 'Project updated successfully');

    } catch (error) {
        console.error('Update project error:', error);
        return response.error(res, 'Failed to update project', 500);
    }
};

/**
 * Delete project
 * DELETE /api/projects/:projectId
 */
const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId, tenantId, role } = req.user;

        // Get project
        const projectResult = await db.query(
            'SELECT id, tenant_id, created_by FROM projects WHERE id = $1',
            [projectId]
        );

        if (projectResult.rows.length === 0) {
            return response.notFound(res, 'Project not found');
        }

        const project = projectResult.rows[0];

        // Check tenant access
        if (role !== 'super_admin' && project.tenant_id !== tenantId) {
            return response.notFound(res, 'Project not found');
        }

        // Check authorization - must be tenant_admin or project creator
        const isCreator = project.created_by === userId;
        const isTenantAdmin = role === 'tenant_admin';
        const isSuperAdmin = role === 'super_admin';

        if (!isSuperAdmin && !isTenantAdmin && !isCreator) {
            return response.forbidden(res, 'Not authorized to delete this project');
        }

        // Delete project (tasks will be cascade deleted)
        await db.query('DELETE FROM projects WHERE id = $1', [projectId]);

        // Log audit
        await logAudit({
            tenantId: project.tenant_id,
            userId,
            action: 'DELETE_PROJECT',
            entityType: 'project',
            entityId: projectId,
            ipAddress: getClientIp(req)
        });

        return response.success(res, null, 'Project deleted successfully');

    } catch (error) {
        console.error('Delete project error:', error);
        return response.error(res, 'Failed to delete project', 500);
    }
};

module.exports = {
    createProject,
    listProjects,
    getProject,
    updateProject,
    deleteProject
};
