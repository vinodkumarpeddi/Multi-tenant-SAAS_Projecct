const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticate, authorize, verifyTenantAccess } = require('../middleware/auth');

// List all tenants - super_admin only
router.get('/', authenticate, authorize('super_admin'), tenantController.listTenants);

// Get tenant details - tenant member or super_admin
router.get('/:id', authenticate, verifyTenantAccess, tenantController.getTenant);

// Update tenant - tenant_admin or super_admin
router.put('/:id', authenticate, authorize('tenant_admin', 'super_admin'), verifyTenantAccess, tenantController.updateTenant);

module.exports = router;
