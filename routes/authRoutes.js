const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/authController');
const {protect,authorize}=require('../middleware/auth')

router.post('/setup', authController.initializeSystem);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOTP);
router.patch('/reset-password/:token', authController.resetPassword);
router.post('/register', protect, authorize('superadmin'), authController.register); 
router.get('/user-details',protect,authController.getUserDetails)
// router.get('/test-email', authController.testMailtrapConfig);
router.post('/first-login', authController.firstLogin); // Add this route
router.post('/validate-first-login-token', authController.validateFirstLoginToken); // Add this





module.exports = router;