const mongoose = require('mongoose');
const { analyzeResumeWithPerplexity } = require('../services/perplexityMatchingService');

const resumeSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return v === null || v === undefined || v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  phone: {
    type: String,
    trim: true
  },

  // Professional Information
  skills: {
    type: [String],
    default: []
  },
  experience: {
    type: String,
    trim: true
  },
  education: {
    type: String,
    trim: true
  },

  // File Information
  url: {
    type: String,
    required: [true, 'File URL is required']
  },
  cloudinaryId: {
    type: String,
    required: [true, 'Cloudinary ID is required']
  },
  fileType: {
    type: String,
    required: [true, 'File type is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },

  // AI Analysis
 aiAnalysis: {
  matchPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  matchingSkills: [{
    skill: String,
    confidence: {
      type: Number,
      min: 0,
      max: 10 // Changed from 1 to 10 to match API output
    }
  }],
    missingSkills: [String],
    recommendation: String,
    analysis: String,
    experienceMatch: String,
    educationMatch: String,
    parsedAt: {
      type: Date,
      default: Date.now
    }
  },
  matchingScore: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Selected', 'Pending Review', 'Rejected', 'New', 'Shortlisted', 'Under Review'],
    default: 'New'
  },

  // References
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate'
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required']
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
resumeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.middleName || ''} ${this.lastName}`.trim();
});

// Indexes
resumeSchema.index({ email: 1, tenantId: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { 
    email: { $type: "string", $ne: "" } 
  }
});
resumeSchema.index({ candidateId: 1 });
resumeSchema.index({ jobId: 1 });
resumeSchema.index({ tenantId: 1 });
resumeSchema.index({ userId: 1 });

// Pre-save hook to analyze resume with Perplexity if jobId is provided
resumeSchema.pre('save', async function(next) {
  // Only run if this is a new resume AND it doesn't already have analysis data
  if (this.isNew && !this.aiAnalysis && this.jobId) {
    try {
      const job = await mongoose.model('Job').findById(this.jobId);
      if (job) {
        const analysis = await analyzeResumeWithPerplexity(this, job.jobDesc);
        
        // Set analysis data
        this.aiAnalysis = analysis.aiAnalysis || {
          matchPercentage: 0,
          matchingSkills: [],
          missingSkills: [],
          recommendation: 'Analysis Failed',
          analysis: 'Automatic analysis not completed'
        };
        
        this.matchingScore = analysis.aiAnalysis?.matchPercentage || 0;
        this.status = determineStatus(analysis);
      }
    } catch (error) {
      console.error('Background analysis error:', error);
      // Set default values if analysis fails
      this.aiAnalysis = {
        matchPercentage: 0,
        matchingSkills: [],
        missingSkills: [],
        recommendation: 'Analysis Failed',
        analysis: 'Automatic analysis failed'
      };
      this.matchingScore = 0;
      this.status = 'Pending Review';
    }
  }
  next();
});

function determineStatus(analysis) {
  if (!analysis) return 'New';
  
  switch (analysis.recommendation) {
    case 'Strong Match':
      return 'Shortlisted';
    case 'Moderate Match':
      return 'Under Review';
    case 'Weak Match':
      return 'Rejected';
    default:
      return 'New';
  }
}

module.exports = mongoose.model('Resume', resumeSchema);