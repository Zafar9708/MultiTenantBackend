

const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { protect } = require('../middleware/auth');


router.use(protect)


router.get('/', locationController.getAllLocations);

router.post('/', locationController.createLocation);

module.exports = router;