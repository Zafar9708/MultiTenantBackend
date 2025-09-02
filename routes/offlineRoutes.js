const express = require('express');
const router = express.Router();
// const offlineInterviewController = require('../controllers/offlineInterviewController');
const offlineInterviewController=require('../controllers/offlineController')

const { protect, authorize } = require('../middleware/auth');

router.use(protect)

router.post('/',  offlineInterviewController.scheduleInterview);
router.get('/',  offlineInterviewController.getScheduledInterviews);
router.get('/upcoming',offlineInterviewController.getUpcomingInterviews);
router.get('/:id',offlineInterviewController.getInterviewById);
router.patch('/:id/status',  offlineInterviewController.updateInterviewStatus);
router.get('/utils/locations',  offlineInterviewController.getLocations);
router.get('/utils/rounds',  offlineInterviewController.getRounds);

module.exports = router;