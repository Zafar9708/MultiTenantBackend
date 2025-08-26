

const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { protect, authorize } = require('../middleware/auth');


router.use(protect)


router.get('/',authorize('admin','recruiter') ,locationController.getAllLocations);

router.post('/', authorize('admin','recruiter') ,locationController.createLocation);

module.exports = router;