
const express = require('express');
const router = express.Router();
const adminController=require('../controllers/adminController')
const { protect, authorize, tenantRestriction } = require('../middleware/auth');



router.post(
  '/recruiters',
  protect,
  authorize('admin'),
  tenantRestriction,
  adminController.addRecruiter
);

router.get(
    '/recruiters',
    protect,
    authorize('admin'),
    adminController.getAllRecruiter)

router.put(
    '/recruiters/:id',
    protect,
    authorize('admin'),
    adminController.updateRecruiter
)

router.delete(
    '/recruiters/:id',
    protect,
    authorize('admin'),
    adminController.deleteRecruiter
)



module.exports=router