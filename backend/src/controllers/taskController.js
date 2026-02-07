const db = require('../config/database');
const response = require('../utils/responseHelper');
const { logAudit, getClientIp } = require('../utils/auditLogger');
const { validateTask } = require('../utils/validators');

/**
 * Create task in project
 * POST /api/projects/:projectId/tasks
 */
const createTask = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, description, assignedTo, priority = 'medium', dueDate } = req.body;
        const { userId, tenantId, role } = req.user;

        // Validate input
        const errors = validateTask(req.body);
        if (errors.length > 0) {
            return response.error(res, errors.join(', '), 400);
        }

        // Get project to verify it exists and get tenant_id
        const projectResult = await db.query(
            'SELECT id, tenant_id FROM projects WHERE id = $1',
            [projectId]
        );

        if (projectResult.rows.length === 0) {
            return response.notFound(res, 'Project not found');
        }

        const project = projectResult.rows[0];

        // Check tenant access
        if (role !== 'super_admin' && project.tenant_id !== tenantId) {
            return response.forbidden(res, 'Access denied');
        }

        // If assignedTo is provided, verify user belongs to same tenant
        if (assignedTo) {
            const userResult = await db.query(
                'SELECT id, tenant_id FROM users WHERE id = $1',
                [assignedTo]
            );

            if (userResult.rows.length === 0) {
                return response.error(res, 'Assigned user not found', 400);
            }

            if (userResult.rows[0].tenant_id !== project.tenant_id) {
                return response.error(res, 'Assigned user must belong to the same tenant', 400);
            }
        }

        // Create task (use project's tenant_id, not user's)
        const result = await db.query(
            `INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
       VALUES ($1, $2, $3, $4, 'todo', $5, $6, $7)
       RETURNING id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at`,
            [projectId, project.tenant_id, title.trim(), description?.trim() || null, priority, assignedTo || null, dueDate || null]
        );

        const task = result.rows[0];

        // Log audit
        await logAudit({
            tenantId: project.tenant_id,
            userId,
            action: 'CREATE_TASK',
            entityType: 'task',
            entityId: task.id,
            ipAddress: getClientIp(req)
        });

        return response.created(res, {
            id: task.id,
            projectId: task.project_id,
            tenantId: task.tenant_id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            assignedTo: task.assigned_to,
            dueDate: task.due_date,
            createdAt: task.created_at
        });

    } catch (error) {
        console.error('Create task error:', error);
        return response.error(res, 'Failed to create task', 500);
    }
};

/**
 * List project tasks
 * GET /api/projects/:projectId/tasks
 */
const listTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;
        const { tenantId, role } = req.user;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = Math.min(parseInt(limit), 100);

        // Verify project exists and user has access
        const projectResult = await db.query(
            'SELECT id, tenant_id FROM projects WHERE id = $1',
            [projectId]
        );

        if (projectResult.rows.length === 0) {
            return response.notFound(res, 'Project not found');
        }

        const project = projectResult.rows[0];

        // Check tenant access
        if (role !== 'super_admin' && project.tenant_id !== tenantId) {
            return response.forbidden(res, 'Access denied');
        }

        // Build query with filters
        let whereClause = 'WHERE t.project_id = $1';
        const params = [projectId];
        let paramIndex = 2;

        if (status) {
            whereClause += ` AND t.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (assignedTo) {
            whereClause += ` AND t.assigned_to = $${paramIndex}`;
            params.push(assignedTo);
            paramIndex++;
        }

        if (priority) {
            whereClause += ` AND t.priority = $${paramIndex}`;
            params.push(priority);
            paramIndex++;
        }

        if (search) {
            whereClause += ` AND LOWER(t.title) LIKE LOWER($${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Get total count
        const countResult = await db.query(
            `SELECT COUNT(*) FROM tasks t ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get tasks with assignee info
        const tasksResult = await db.query(
            `SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.created_at,
              u.id as assignee_id, u.full_name as assignee_name, u.email as assignee_email
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       ${whereClause}
       ORDER BY 
         CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
         t.due_date ASC NULLS LAST,
         t.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limitNum, offset]
        );

        const tasks = tasksResult.rows.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            assignedTo: t.assignee_id ? {
                id: t.assignee_id,
                fullName: t.assignee_name,
                email: t.assignee_email
            } : null,
            dueDate: t.due_date,
            createdAt: t.created_at
        }));

        return response.success(res, {
            tasks,
            total,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limitNum),
                limit: limitNum
            }
        });

    } catch (error) {
        console.error('List tasks error:', error);
        return response.error(res, 'Failed to list tasks', 500);
    }
};

/**
 * Update task status
 * PATCH /api/tasks/:taskId/status
 */
const updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;
        const { tenantId, role, userId } = req.user;

        if (!status || !['todo', 'in_progress', 'completed'].includes(status)) {
            return response.error(res, 'Status must be "todo", "in_progress", or "completed"', 400);
        }

        // Get task
        const taskResult = await db.query(
            'SELECT id, tenant_id FROM tasks WHERE id = $1',
            [taskId]
        );

        if (taskResult.rows.length === 0) {
            return response.notFound(res, 'Task not found');
        }

        const task = taskResult.rows[0];

        // Check tenant access
        if (role !== 'super_admin' && task.tenant_id !== tenantId) {
            return response.notFound(res, 'Task not found');
        }

        // Update task status
        const result = await db.query(
            `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
       RETURNING id, status, updated_at`,
            [status, taskId]
        );

        // Log audit
        await logAudit({
            tenantId: task.tenant_id,
            userId,
            action: 'UPDATE_TASK_STATUS',
            entityType: 'task',
            entityId: taskId,
            ipAddress: getClientIp(req)
        });

        return response.success(res, {
            id: result.rows[0].id,
            status: result.rows[0].status,
            updatedAt: result.rows[0].updated_at
        });

    } catch (error) {
        console.error('Update task status error:', error);
        return response.error(res, 'Failed to update task status', 500);
    }
};

/**
 * Update task (full update)
 * PUT /api/tasks/:taskId
 */
const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, status, priority, assignedTo, dueDate } = req.body;
        const { tenantId, role, userId } = req.user;

        // Get task
        const taskResult = await db.query(
            'SELECT id, tenant_id, project_id FROM tasks WHERE id = $1',
            [taskId]
        );

        if (taskResult.rows.length === 0) {
            return response.notFound(res, 'Task not found');
        }

        const task = taskResult.rows[0];

        // Check tenant access
        if (role !== 'super_admin' && task.tenant_id !== tenantId) {
            return response.notFound(res, 'Task not found');
        }

        // If assignedTo is provided and not null, verify user belongs to same tenant
        if (assignedTo !== undefined && assignedTo !== null) {
            const userResult = await db.query(
                'SELECT id, tenant_id FROM users WHERE id = $1',
                [assignedTo]
            );

            if (userResult.rows.length === 0) {
                return response.error(res, 'Assigned user not found', 400);
            }

            if (userResult.rows[0].tenant_id !== task.tenant_id) {
                return response.error(res, 'Assigned user must belong to the same tenant', 400);
            }
        }

        // Validate status and priority if provided
        if (status && !['todo', 'in_progress', 'completed'].includes(status)) {
            return response.error(res, 'Invalid status value', 400);
        }

        if (priority && !['low', 'medium', 'high'].includes(priority)) {
            return response.error(res, 'Invalid priority value', 400);
        }

        // Build update query
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramIndex}`);
            params.push(title.trim());
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

        if (priority !== undefined) {
            updates.push(`priority = $${paramIndex}`);
            params.push(priority);
            paramIndex++;
        }

        if (assignedTo !== undefined) {
            updates.push(`assigned_to = $${paramIndex}`);
            params.push(assignedTo);
            paramIndex++;
        }

        if (dueDate !== undefined) {
            updates.push(`due_date = $${paramIndex}`);
            params.push(dueDate);
            paramIndex++;
        }

        if (updates.length === 0) {
            return response.error(res, 'No valid fields to update', 400);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(taskId);

        const result = await db.query(
            `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, title, description, status, priority, assigned_to, due_date, updated_at`,
            params
        );

        const updatedTask = result.rows[0];

        // Get assignee info if assigned
        let assigneeInfo = null;
        if (updatedTask.assigned_to) {
            const assigneeResult = await db.query(
                'SELECT id, full_name, email FROM users WHERE id = $1',
                [updatedTask.assigned_to]
            );
            if (assigneeResult.rows.length > 0) {
                const a = assigneeResult.rows[0];
                assigneeInfo = { id: a.id, fullName: a.full_name, email: a.email };
            }
        }

        // Log audit
        await logAudit({
            tenantId: task.tenant_id,
            userId,
            action: 'UPDATE_TASK',
            entityType: 'task',
            entityId: taskId,
            ipAddress: getClientIp(req)
        });

        return response.success(res, {
            id: updatedTask.id,
            title: updatedTask.title,
            description: updatedTask.description,
            status: updatedTask.status,
            priority: updatedTask.priority,
            assignedTo: assigneeInfo,
            dueDate: updatedTask.due_date,
            updatedAt: updatedTask.updated_at
        }, 'Task updated successfully');

    } catch (error) {
        console.error('Update task error:', error);
        return response.error(res, 'Failed to update task', 500);
    }
};

module.exports = {
    createTask,
    listTasks,
    updateTaskStatus,
    updateTask
};
