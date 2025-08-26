
const router = require('express').Router();
const interviewerController = require('../controllers/interviewerController');


router.post('/', interviewerController.createInterviewer);
router.get('/', interviewerController.getAllInterviewers);


module.exports = router;