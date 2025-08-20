const mongoose = require('mongoose');


const noteSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Note content is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true  
  }
}, {
  timestamps: true
});

noteSchema.index({ jobId: 1, tenantId: 1 });

module.exports = mongoose.model('Note', noteSchema);