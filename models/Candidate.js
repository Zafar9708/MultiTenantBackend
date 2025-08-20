const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const candidateSchema = new mongoose.Schema({
  // Basic Information
  firstName: { type: String, required: [true, 'First name is required'] },
  middleName: String,
  lastName: { type: String, required: [true, 'Last name is required'] },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  mobile: { 
    type: String, 
    required: [true, 'Mobile number is required'],
    validate: {
      validator: function(v) {
        return /^[0-9]{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },

  // Location References
  currentLocation: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    validate: {
      validator: async function(v) {
        if (!v) return true;
        const doc = await mongoose.model('Location').findOne({ _id: v, tenantId: this.tenantId });
        return !!doc;
      },
      message: 'Invalid current location or location not found for this tenant'
    }
  },
  preferredLocation: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    validate: {
      validator: async function(v) {
        if (!v) return true;
        const doc = await mongoose.model('Location').findOne({ _id: v, tenantId: this.tenantId });
        return !!doc;
      },
      message: 'Invalid preferred location or location not found for this tenant'
    }
  },

  // Source Reference
  source: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Source',
    required: [true, 'Source is required'],
    validate: {
      validator: async function(v) {
        const doc = await mongoose.model('Source').findOne({ _id: v, tenantId: this.tenantId });
        return !!doc;
      },
      message: 'Invalid source or source not found for this tenant'
    }
  },

  // Owner/Recruiter Reference
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required'],
    validate: {
      validator: async function(v) {
        const doc = await mongoose.model('User').findOne({ 
          _id: v, 
          tenantId: this.tenantId,
          role: { $in: ['admin', 'recruiter'] }
        });
        return !!doc;
      },
      message: 'Invalid owner or owner not found for this tenant'
    }
  },

  // Professional Details
  stage: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Stage',
  required: [true, 'Stage is required'],
  validate: {
    validator: async function(v) {
      const doc = await mongoose.model('Stage').findOne({ _id: v });
      return !!doc;
    },
    message: 'Invalid stage'
  }
},
  skills: {
    type: [String],
    default: []
  },
  experience: String,
  education: String,
  availableToJoin: Number,
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'] 
  },
  dob: Date,

  // Documents
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  additionalDocuments: [{
    path: String,
    originalName: String,
    documentType: String
  }],

  // Comments/History
  comments: [{
    text: String,
    stageChangedFrom: String,
    stageChangedTo: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      validate: {
        validator: async function(v) {
          const doc = await mongoose.model('User').findOne({ _id: v, tenantId: this.tenantId });
          return !!doc;
        },
        message: 'Invalid user or user not found for this tenant'
      }
    }
  }],

  // Rejection Info
  rejectionType: String,
  rejectionReason: String,

  // Tenant and tracking fields
  tenantId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required']
  },
  jobId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    validate: {
      validator: async function(v) {
        if (!v) return true;
        const doc = await mongoose.model('Job').findOne({ _id: v, tenantId: this.tenantId });
        return !!doc;
      },
      message: 'Invalid job or job not found for this tenant'
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
candidateSchema.plugin(mongoosePaginate);

// Virtual for full name
candidateSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.middleName || ''} ${this.lastName}`.trim();
});

// Indexes
candidateSchema.index({ email: 1, tenantId: 1 }, { unique: true });
candidateSchema.index({ mobile: 1, tenantId: 1 }, { unique: true });
candidateSchema.index({ jobId: 1 });
candidateSchema.index({ stage: 1 });
candidateSchema.index({ tenantId: 1 });
candidateSchema.index({ owner: 1 });
candidateSchema.index({ source: 1 });

// Middleware to validate references before saving
candidateSchema.pre('save', async function(next) {
  try {
    // Validate tenant exists
    const tenantExists = await mongoose.model('Tenant').exists({ _id: this.tenantId });
    if (!tenantExists) {
      throw new Error('Invalid tenant ID');
    }

    // Validate createdBy user exists and belongs to tenant
    const creator = await mongoose.model('User').findOne({ 
      _id: this.createdBy, 
      tenantId: this.tenantId 
    });
    if (!creator) {
      throw new Error('Creator not found or does not belong to tenant');
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Candidate', candidateSchema);