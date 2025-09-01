const mongoose = require('mongoose');
const Location = require('./Location');

const jobFormSchema = new mongoose.Schema({
    jobType: { type: String, required: true },
    locations: { 
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location'
        }], 
        required: true,
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'At least one location must be selected'
        }
    },
    openings: { type: Number, required: true },
    targetHireDate: { type: Date, required: true },
    currency: { type: String, required: true },
    amount: { type: Number, required: true },
    allowReapply: { type: Boolean, default: false },
    reapplyDate: { type: Number, default: null },
    markPriority: { type: Boolean, default: false },
    hiringFlow: { type: [String], default: [] },
    salesPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    },
    recruitingPerson: {
        type: [String],
        default: []
    },
    BusinessUnit: {
        type: String,
        
        enum: ['internal', 'external'],
        required: true
    },
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Client",
        required: function() {
            return this.BusinessUnit === 'external';
        }
    },
    status: {
        type: String,
        enum: ['Active', 'On Hold', 'Closed Own', 'Closed Lost', 'Archived'],
        default: 'Active'
    },
    statusReason: {
        type: String,
        default: ''
    },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true }
}, { timestamps: true, versionKey: false });

// Indexes for better query performance
jobFormSchema.index({ tenantId: 1, BusinessUnit: 1 });
jobFormSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('JobForm', jobFormSchema);