const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Import route modules
const authRoutes = require('./authRoutes');
const tenantRoutes = require('./tenantRoutes');
const userRoutes = require('./userRoutes');
const projectRoutes = require('./projectRoutes');
const taskRoutes = require('./taskRoutes');

// Import controllers for nested routes
const userController = require('../controllers/userController');
const taskController = require('../controllers/taskController');
const { authenticate, authorize, verifyTenantAccess } = require('../middleware/auth');

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        // Test database connection
        await db.query('SELECT 1');
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'error',
            database: 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);

// Nested routes for users under tenants
router.post('/tenants/:tenantId/users',
    authenticate,
    authorize('tenant_admin', 'super_admin'),
    verifyTenantAccess,
    userController.createUser
);

router.get('/tenants/:tenantId/users',
    authenticate,
    verifyTenantAccess,
    userController.listUsers
);

// Nested routes for tasks under projects
router.post('/projects/:projectId/tasks',
    authenticate,
    taskController.createTask
);

router.get('/projects/:projectId/tasks',
    authenticate,
    taskController.listTasks
);

module.exports = router;
