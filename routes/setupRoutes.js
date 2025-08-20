const express = require('express');
const router = express.Router();
const setupController = require('../controllers/auth/setupController');
const rateLimit = require('express-rate-limit');

const setupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3,
  message: 'Too many setup attempts, please try again later'
});

router.post('/', setupLimiter, setupController.initializeSystem);
router.post('/login',setupLimiter,setupController.loginSuperAdmin)

module.exports = router;