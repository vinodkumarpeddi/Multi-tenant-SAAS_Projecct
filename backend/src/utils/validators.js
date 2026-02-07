/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 * - Minimum 8 characters
 * - At least one uppercase, one lowercase, one number
 */
const isValidPassword = (password) => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
};

/**
 * Validate subdomain format
 * - 3-63 characters
 * - Alphanumeric and hyphens only
 * - Cannot start or end with hyphen
 */
const isValidSubdomain = (subdomain) => {
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    return subdomain.length >= 3 &&
        subdomain.length <= 63 &&
        subdomainRegex.test(subdomain.toLowerCase());
};

/**
 * Validate UUID format
 */
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

/**
 * Validate tenant registration input
 */
const validateTenantRegistration = (data) => {
    const errors = [];

    if (!data.tenantName || data.tenantName.trim().length < 2) {
        errors.push('Tenant name must be at least 2 characters');
    }

    if (!data.subdomain || !isValidSubdomain(data.subdomain)) {
        errors.push('Subdomain must be 3-63 characters, alphanumeric and hyphens only');
    }

    if (!data.adminEmail || !isValidEmail(data.adminEmail)) {
        errors.push('Valid email is required');
    }

    if (!data.adminPassword || !isValidPassword(data.adminPassword)) {
        errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
    }

    if (!data.adminFullName || data.adminFullName.trim().length < 2) {
        errors.push('Admin full name must be at least 2 characters');
    }

    return errors;
};

/**
 * Validate login input
 */
const validateLogin = (data) => {
    const errors = [];

    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Valid email is required');
    }

    if (!data.password) {
        errors.push('Password is required');
    }

    if (!data.tenantSubdomain && !data.tenantId) {
        errors.push('Tenant subdomain or ID is required');
    }

    return errors;
};

/**
 * Validate user creation input
 */
const validateUserCreation = (data) => {
    const errors = [];

    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Valid email is required');
    }

    if (!data.password || !isValidPassword(data.password)) {
        errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
    }

    if (!data.fullName || data.fullName.trim().length < 2) {
        errors.push('Full name must be at least 2 characters');
    }

    if (data.role && !['user', 'tenant_admin'].includes(data.role)) {
        errors.push('Role must be "user" or "tenant_admin"');
    }

    return errors;
};

/**
 * Validate project input
 */
const validateProject = (data) => {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
        errors.push('Project name must be at least 2 characters');
    }

    if (data.status && !['active', 'archived', 'completed'].includes(data.status)) {
        errors.push('Status must be "active", "archived", or "completed"');
    }

    return errors;
};

/**
 * Validate task input
 */
const validateTask = (data) => {
    const errors = [];

    if (!data.title || data.title.trim().length < 2) {
        errors.push('Task title must be at least 2 characters');
    }

    if (data.status && !['todo', 'in_progress', 'completed'].includes(data.status)) {
        errors.push('Status must be "todo", "in_progress", or "completed"');
    }

    if (data.priority && !['low', 'medium', 'high'].includes(data.priority)) {
        errors.push('Priority must be "low", "medium", or "high"');
    }

    if (data.assignedTo && !isValidUUID(data.assignedTo)) {
        errors.push('Assigned user must be a valid UUID');
    }

    return errors;
};

module.exports = {
    isValidEmail,
    isValidPassword,
    isValidSubdomain,
    isValidUUID,
    validateTenantRegistration,
    validateLogin,
    validateUserCreation,
    validateProject,
    validateTask
};
