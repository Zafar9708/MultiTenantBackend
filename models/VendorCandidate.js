// models/VendorCandidate.js
const mongoose = require('mongoose');

const vendorCandidateSchema = new mongoose.Schema({
  // Basic Information (same as regular candidate)
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  
  // Compensation
  currentCTC:{type:String},
  expectedCTC:{type:String},
  currency: { type: String, default: 'INR' },
  
  // Professional Details
  skills: [String],
  experience: String,
  education: String,
  availableToJoin: Number,
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  
  // References (as strings for vendors)
  currentLocation: String,
  preferredLocation: String,
  source: String,
  stage: String,
  
  // Vendor info
  vendorEmail: { type: String, required: true },
  vendorStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'duplicate'],
    default: 'pending'
  },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  
  // Documents
  resume: {
    originalName: String,
    buffer: Buffer,
    mimetype: String
  },
  additionalDocuments: [{
    originalName: String,
    buffer: Buffer,
    mimetype: String
  }],
  
  // Timestamps
  vendorSubmissionDate: { type: Date, default: Date.now },
  vendorReviewDate: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String
}, { timestamps: true });

module.exports = mongoose.model('VendorCandidate', vendorCandidateSchema);