const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  jobFormId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobForm',
    required: true
  },
  previousStatus: {
    type: String,
    required: true,
    enum: ['Active', 'On Hold', 'Closed Own', 'Closed Lost', 'Archived']
  },
  newStatus: {
    type: String,
    required: true,
    enum: ['Active', 'On Hold', 'Closed Own', 'Closed Lost', 'Archived']
  },
  reason: {
    type: String,
    required: function() {
      return ['Closed Own', 'On Hold', 'Archived'].includes(this.newStatus);
    }
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StatusHistory', statusHistorySchema);