const express = require('express');
const router = express.Router();
const {
  updateJobStatus,
  getStatusHistory,
  archiveJob,
  getJobsByStatus
} = require('../controllers/jobStatusController');
const {protect}=require('../middleware/auth')
router.use(protect);

router.patch('/:id/status', updateJobStatus);

router.get('/:id/status-history', getStatusHistory);

router.post('/:id/archive', archiveJob);

router.get('/status/:status?', getJobsByStatus);

module.exports = router;