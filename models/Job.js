const mongoose = require('mongoose');
const { departments } = require('../utils/departments');

const jobSchema = new mongoose.Schema({
    jobName: { type: String, required: true, unique: true },
    jobTitle: { type: String, required: true },
    department: {
        type: String,
        enum: departments,
        required: true
    },
    experience: { type: String, required: true },
    jobDesc: { type: String, required: true },
    status: { 
        type: String, 
        default: 'Active', 
        enum: ['Active', 'On Hold', 'Closed Won', 'Closed Lost', 'Archived'] 
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobFormId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobForm' },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    assignedRecruiters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

// Index for better query performance
jobSchema.index({ tenantId: 1, status: 1 });
jobSchema.index({ tenantId: 1, jobName: 1 }, { unique: true });
jobSchema.index({ assignedRecruiters: 1 }); 


module.exports = mongoose.model('Job', jobSchema);