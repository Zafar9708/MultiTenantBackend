const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'job_created', 'job_updated', 'job_deleted', 'job_status_changed',
      'candidate_created', 'candidate_updated', 'candidate_deleted', 'candidate_bulk_upload',
      'interview_scheduled', 'interview_updated', 'interview_cancelled'
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate'
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  },
  candidateCount: {
    type: Number,
    default: 0
  },
  jobName: {
    type: String
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);