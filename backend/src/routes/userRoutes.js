const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize, verifyTenantAccess } = require('../middleware/auth');

// User routes under /api/users
router.put('/:userId', authenticate, userController.updateUser);
router.delete('/:userId', authenticate, authorize('tenant_admin', 'super_admin'), userController.deleteUser);

module.exports = router;
