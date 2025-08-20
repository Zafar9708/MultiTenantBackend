const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/authController');
const {protect}=require('../middleware/auth')

router.post('/setup', authController.initializeSystem);
router.post('/login', authController.login);
router.get('/user-details',protect,authController.getUserDetails)



module.exports = router;