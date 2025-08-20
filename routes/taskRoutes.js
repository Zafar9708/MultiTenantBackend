const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task/taskController');
const { protect, authorize, tenantRestriction } = require('../middleware/auth');

router.use(protect, tenantRestriction);

router.post(
  '/',
  authorize('admin', 'recruiter'),
  taskController.createTask
);

router.get(
  '/',
  authorize('admin', 'recruiter'),
  taskController.getAllTasks
);

module.exports = router;