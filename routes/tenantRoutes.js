const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant/tenantController');
const { protect, authorize, tenantRestriction } = require('../middleware/auth');

router.post('/', protect, authorize('superadmin'), tenantController.createTenant);
router.get('/', protect, authorize('superadmin'), tenantController.getAllTenants);
router
  .route('/:id')
  .patch(protect, authorize('superadmin'), tenantController.updateTenant)
  .delete(protect, authorize('superadmin'), tenantController.deleteTenant);



module.exports = router;