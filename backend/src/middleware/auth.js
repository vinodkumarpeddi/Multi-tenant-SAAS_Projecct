const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const db = require('../config/database');

/**
 * Authentication middleware - verifies JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, jwtConfig.secret);

            // Verify user still exists and is active
            const userResult = await db.query(
                'SELECT id, tenant_id, email, full_name, role, is_active FROM users WHERE id = $1',
                [decoded.userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found.'
                });
            }

            const user = userResult.rows[0];

            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    message: 'Account is deactivated.'
                });
            }

            // Attach user info to request
            req.user = {
                userId: user.id,
                tenantId: user.tenant_id,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            };

            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired.'
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
};

/**
 * Authorization middleware - checks user roles
 * @param {...string} allowedRoles - Roles that can access the route
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

/**
 * Tenant access middleware - verifies user can access the tenant
 */
const verifyTenantAccess = async (req, res, next) => {
    try {
        const tenantId = req.params.tenantId || req.params.id;

        if (!tenantId) {
            return next();
        }

        // Super admin can access any tenant
        if (req.user.role === 'super_admin') {
            return next();
        }

        // Regular users can only access their own tenant
        if (req.user.tenantId !== tenantId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your own tenant.'
            });
        }

        next();
    } catch (error) {
        console.error('Tenant access middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authorization error.'
        });
    }
};

module.exports = {
    authenticate,
    authorize,
    verifyTenantAccess
};
