const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ["HR/Recruiter", "SalesPerson"],
    default: 'recruiter'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for better query performance
employeeSchema.index({ email: 1, tenantId: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, role: 1 });

module.exports = mongoose.model('Employee', employeeSchema);