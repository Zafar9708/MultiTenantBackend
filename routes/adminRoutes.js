
// const express = require('express');
// const router = express.Router();
// const adminController=require('../controllers/adminController')
// const { protect, authorize, tenantRestriction } = require('../middleware/auth');



// router.post(
//   '/recruiters',
//   protect,
//   authorize('admin'),
//   tenantRestriction,
//   adminController.addRecruiter
// );

// router.get(
//     '/recruiters',
//     protect,
//     authorize('admin'),
//     adminController.getAllRecruiter)

// router.put(
//     '/recruiters/:id',
//     protect,
//     authorize('admin'),
//     adminController.updateRecruiter
// )

// router.delete(
//     '/recruiters/:id',
//     protect,
//     authorize('admin'),
//     adminController.deleteRecruiter
// )



// module.exports=router


const express = require('express');
const router = express.Router();
const adminController=require('../controllers/adminController')
const { protect, authorize, tenantRestriction } = require('../middleware/auth');
const upload=require('../middleware/profileUpload')

router.post(
  '/recruiters',
  protect,
  authorize('admin'),
  upload.single('profilePicture'),
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

// Add route for resending welcome email

router.post(
  '/recruiters/:id/resend-welcome',
  protect,
  authorize('admin'),
  adminController.resendWelcomeEmail
);



module.exports=router