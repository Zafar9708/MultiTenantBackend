const Job = require('../models/Job');
const JobForm = require('../models/JobForm');
const StatusHistory = require('../models/StatusHistory');

// Define valid status transitions
const validStatusTransitions = {
  'Active': ['On Hold', 'Closed Own', 'Closed Lost', 'Archived'],
  'On Hold': ['Active', 'Closed Own', 'Closed Lost', 'Archived'],
  'Closed Own': ['Active', 'Archived'],
  'Closed Lost': ['Active', 'Archived'],
  'Archived': ['Active']
};

// Update job status
const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus, reason } = req.body;
    const { tenantId, _id: userId } = req.user;

    // Validate required fields
    if (!newStatus) {
      return res.status(400).json({ error: 'New status is required' });
    }

    // Check if new status is valid
    if (!['Active', 'On Hold', 'Closed Own', 'Closed Lost', 'Archived'].includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Check if reason is required for certain status changes
    if (['Closed Own', 'On Hold', 'Archived'].includes(newStatus) && !reason) {
      return res.status(400).json({ 
        error: `Reason is required for status ${newStatus}` 
      });
    }

    // Find the job with tenant check
    const job = await Job.findOne({ 
      _id: id, 
      tenantId 
    }).populate('jobFormId');

    if (!job) {
      return res.status(404).json({ error: 'Job not found or not accessible' });
    }

    const previousStatus = job.status;
    const jobFormId = job.jobFormId._id;

    // Validate status transition
    const allowedTransitions = validStatusTransitions[previousStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return res.status(400).json({ 
        error: `Invalid status transition from ${previousStatus} to ${newStatus}` 
      });
    }

    // Update job status
    job.status = newStatus;
    await job.save();

    // Update job form status
    await JobForm.findByIdAndUpdate(jobFormId, { 
      status: newStatus,
      statusReason: reason || ''
    });

    // Save status change history
    const statusHistory = new StatusHistory({
      jobId: id,
      jobFormId,
      previousStatus,
      newStatus,
      reason: reason || '',
      changedBy: userId,
      tenantId
    });

    await statusHistory.save();

    // Populate the updated job with related data
    const updatedJob = await Job.findById(id)
      .populate({
        path: 'jobFormId',
        populate: [
          { path: 'locations', select: 'name' },
          { path: 'salesPerson', select: 'name email' },
          { path: 'Client', select: 'name' }
        ]
      });

    res.status(200).json({
      message: 'Job status updated successfully',
      job: updatedJob
    });

  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
};

// Get status history for a job
const getStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    // Verify job exists and belongs to tenant
    const job = await Job.findOne({ 
      _id: id, 
      tenantId 
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or not accessible' });
    }

    // Get status history
    const history = await StatusHistory.find({ 
      jobId: id, 
      tenantId 
    })
    .populate('changedBy', 'username email')
    .sort({ changedAt: -1 });

    res.status(200).json({
      message: 'Status history fetched successfully',
      history
    });

  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({ error: 'Failed to fetch status history' });
  }
};

// Archive a job
const archiveJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { tenantId, _id: userId } = req.user;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required for archiving' });
    }

    // Find the job with tenant check
    const job = await Job.findOne({ 
      _id: id, 
      tenantId 
    }).populate('jobFormId');

    if (!job) {
      return res.status(404).json({ error: 'Job not found or not accessible' });
    }

    const previousStatus = job.status;
    const jobFormId = job.jobFormId._id;

    // Update job status to Archived
    job.status = 'Archived';
    await job.save();

    // Update job form status
    await JobForm.findByIdAndUpdate(jobFormId, { 
      status: 'Archived',
      statusReason: reason
    });

    // Save status change history
    const statusHistory = new StatusHistory({
      jobId: id,
      jobFormId,
      previousStatus,
      newStatus: 'Archived',
      reason,
      changedBy: userId,
      tenantId
    });

    await statusHistory.save();

    res.status(200).json({
      message: 'Job archived successfully'
    });

  } catch (error) {
    console.error('Error archiving job:', error);
    res.status(500).json({ error: 'Failed to archive job' });
  }
};

// Get jobs by status with filters
const getJobsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { showArchived, showPriority, search, department, recruiter, location, businessUnit } = req.query;
    const { tenantId, _id: userId, role } = req.user;

    // Build filter
    let filter = { tenantId };

    // Handle status filter
    if (status === 'archived') {
      filter.status = 'Archived';
    } else if (status && status !== 'all') {
      filter.status = status;
    } else if (!showArchived || showArchived === 'false') {
      filter.status = { $ne: 'Archived' };
    }

    // Role-based filtering
    if (role === 'recruiter') {
      filter.userId = userId;
    }

    // Additional filters
    if (showPriority === 'true') {
      filter['jobFormId.markPriority'] = true;
    }

    if (department) {
      filter.department = department;
    }

    if (businessUnit) {
      filter['jobFormId.BusinessUnit'] = businessUnit.toLowerCase();
    }

    if (recruiter) {
      filter.assignedRecruiters = recruiter;
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { jobTitle: searchRegex },
        { jobName: searchRegex },
        { department: searchRegex }
      ];
    }

    const jobs = await Job.find(filter)
      .populate({
        path: 'jobFormId',
        populate: [
          { path: 'locations', select: 'name' },
          { path: 'salesPerson', select: 'name email' },
          { path: 'Client', select: 'name' }
        ],
        match: location ? { 'locations.name': location } : {}
      })
      .sort({ createdAt: -1 });

    // Filter out jobs that don't match location criteria
    const filteredJobs = jobs.filter(job => job.jobFormId !== null);

    res.status(200).json({
      message: 'Jobs fetched successfully',
      jobs: filteredJobs
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

module.exports = {
  updateJobStatus,
  getStatusHistory,
  archiveJob,
  getJobsByStatus
};