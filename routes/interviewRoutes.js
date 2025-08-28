const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const feedbackController = require('../controllers/feedBackController');
const { protect, authorize } = require('../middleware/auth');


router.post('/:interviewId/feedback/:interviewerId', feedbackController.submitFeedback);
router.get('/candidate/:candidateId/feedback', feedbackController.getFeedbackByCandidate);



// Apply protect middleware to all routes
router.use(protect);

// SPECIFIC ROUTES FIRST (before any parameterized routes)
router.post('/schedule', interviewController.scheduleInterview);
router.get('/timezones', interviewController.getTimezones);
router.get('/durations', interviewController.getDurations);
router.get('/upcoming', interviewController.getUpcomingInterviews);
router.get('/interviews/schedule',interviewController.getAllInterviews);

// PARAMETERIZED ROUTES (should come after specific routes)
router.get('/schedule', interviewController.getAllInterviews);
router.get('/:id', interviewController.getInterviewById);
router.patch('/:id/status', interviewController.updateInterviewStatus);
router.get('/:interviewId/feedback', interviewController.getInterviewFeedback);

module.exports = router;