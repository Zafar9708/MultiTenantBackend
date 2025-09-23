const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  phone: String,
  designation: {
    type: String,
    enum: ["Owner", "Manager", "Recruiter"]
  },
  companyName: String,
  companyEmail: String,
  companyPhone: String,
  companyAddress: String,
  industry: {
    type: String,
    enum: [
      'Information Technology', 'Healthcare', 'Finance', 'Education',
      'Retail', 'Manufacturing', 'Construction', 'Telecommunications',
      'Transportation and Logistics', 'Marketing and Advertising',
      'Legal Services', 'Human Resources / Staffing', 'Real Estate',
      'Media and Entertainment', 'Government', 'Non-Profit',
      'Energy and Utilities', 'Hospitality', 'Agriculture',
      'Aerospace and Defense', 'E-commerce', 'Pharmaceuticals',
      'Automotive', 'Insurance', 'Consulting', 'Other'
    ],
    default: 'Other'
  },
  password: String,
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  requiresApproval: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });


vendorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

vendorSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Vendor', vendorSchema);
