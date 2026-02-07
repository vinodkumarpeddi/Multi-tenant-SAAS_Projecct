const db = require('../config/database');

/**
 * Log an audit event
 * @param {Object} params - Audit log parameters
 * @param {string} params.tenantId - Tenant ID (null for super_admin actions)
 * @param {string} params.userId - User ID performing the action
 * @param {string} params.action - Action type (e.g., 'CREATE_USER', 'DELETE_PROJECT')
 * @param {string} params.entityType - Entity type (e.g., 'user', 'project', 'task')
 * @param {string} params.entityId - ID of the affected entity
 * @param {string} params.ipAddress - Client IP address
 */
const logAudit = async ({ tenantId, userId, action, entityType, entityId, ipAddress }) => {
    try {
        await db.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [tenantId, userId, action, entityType, entityId, ipAddress]
        );
    } catch (error) {
        console.error('Audit log error:', error);
        // Don't throw - audit logging should not break the main flow
    }
};

/**
 * Get client IP address from request
 */
const getClientIp = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
        req.connection?.remoteAddress ||
        req.ip ||
        'unknown';
};

module.exports = {
    logAudit,
    getClientIp
};
