// const crypto = require('crypto');
// const bcrypt = require('bcryptjs');
// const Vendor = require('../models/Vendor');
// const VendorInvite = require('../models/VendorInvite');
// const sendEmail = require('../utils/email');
// const AppError = require('../utils/appError');
// const jwt = require('jsonwebtoken');


// exports.sendVendorInvite = async (req, res, next) => {
//   try {
//     const { email } = req.body;

//     const token = crypto.randomBytes(32).toString('hex');

//     const invite = await VendorInvite.create({
//       email,
//       tenantId: req.user.tenantId, 
//       token,
//       expiresAt: Date.now() + 24 * 60 * 60 * 1000 
//     });

//     const inviteLink = `${process.env.FRONTEND_URL}/vendor/register?token=${token}`;

//     await sendEmail({
//       email,
//       subject: 'Vendor Registration Invitation',
//       html: `<p>You have been invited to register as a vendor. Click below:</p><a href="${inviteLink}">${inviteLink}</a>`
//     });

//     res.status(200).json({
//       message: 'Vendor invite sent',
//       inviteLink
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// exports.registerVendor = async (req, res, next) => {
//   try {
//     const { token } = req.query;
//     const {
//       firstName, lastName, email, phone, designation,
//       companyName, companyEmail, companyPhone, companyAddress,
//       industry, password
//     } = req.body;

//     const invite = await VendorInvite.findOne({ token, used: false });

//     if (!invite || invite.expiresAt < Date.now()) {
//       return res.status(400).json({ error: 'Invalid or expired invite token' });
//     }

//     if (invite.email.toLowerCase() !== email.toLowerCase()) {
//       return res.status(400).json({ error: 'Email does not match the invitation' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 12);

//     const vendor = await Vendor.create({
//       firstName,
//       lastName,
//       email,
//       phone,
//       designation,
//       companyName,
//       companyEmail,
//       companyPhone,
//       companyAddress,
//       industry,
//       password: hashedPassword,
//       tenantId: invite.tenantId,
//       isActive: true,
//       verified: true,
//       requiresApproval: false
//     });

//     invite.used = true;
//     await invite.save();

//     res.status(201).json({
//       message: 'Vendor registered successfully',
//       vendorId: vendor._id
//     });
//   } catch (err) {
//     next(err);
//   }
// };




// exports.vendorLogin = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     // 1. Validate input
//     if (!email || !password) {
//       return next(new AppError("Please provide a valid email and password", 400));
//     }

//     // 2. Find vendor by email
//     const vendor = await Vendor.findOne({ email }).select('+password');
//     if (!vendor) {
//       return next(new AppError("Vendor not found", 404));
//     }

//     // 3. Check password
//     const isMatch = await bcrypt.compare(password, vendor.password);
//     if (!isMatch) {
//       return next(new AppError("Incorrect password", 401));
//     }

//     // 4. Generate JWT token
//     const token = jwt.sign({ id: vendor._id, tenantId: vendor.tenantId }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN || '7d',
//     });

//     // 5. Send response
//     res.status(200).json({
//       success: true,
//       message: 'Vendor logged in successfully',
//       token,
//       data: {
//         vendor: {
//           id: vendor._id,
//           email: vendor.email,
//           fullName: `${vendor.firstName} ${vendor.lastName}`,
//           tenantId: vendor.tenantId,
//         }
//       }
//     });

//   } catch (err) {
//     next(err);
//   }
// };

const mongoose=require('mongoose')
const Location = require('../models/Location');
const Source = require('../models/Source');
const Stage = require('../models/Stages');
const axios=require('axios')
const Job=require('../models/Job')
const { analyzeResume } = require('./candidateController');
const { analyzeResumeWithPerplexity } = require('../services/perplexityMatchingService');
const cloudinary = require('../config/cloudinary');
const Candidate=require('../models/Candidate')


// Get locations accessible to vendors
exports.getVendorLocations = async (req, res) => {
  try {
    const locations = await Location.find({ tenantId: req.vendor.tenantId });
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error fetching locations'
    });
  }
};

// Get sources accessible to vendors
exports.getVendorSources = async (req, res) => {
  try {
    const sources = await Source.find({ tenantId: req.vendor.tenantId });
    res.status(200).json(sources);
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error fetching sources'
    });
  }
};

// Get stages accessible to vendors
// exports.getVendorStages = async (req, res) => {
//   try {
//     const stages = await Stage.find({ tenantId: req.vendor.tenantId });
//     res.status(200).json(stages);
//   } catch (error) {
//     res.status(500).json({
//       status: 'fail',
//       message: 'Error fetching stages'
//     });
//   }
// };

exports.getVendorStages=async(req,res)=>{
    const stageDocs=await Stage.find().sort({order:1})
    res.json(stageDocs)
}

// Analyze resume for vendors
// exports.analyzeVendorResume = async (req, res) => {
//   try {
//     // ✅ use req.vendor (not req.user)
//     const { tenantId, jobId: tokenJobId, email } = req.user || {};
    

//     const uploadedFile = req.file;
//     const { jobId } = req.body; // jobId might also come from body

//     console.log("Vendor Token Data:", req.vendor);
//     console.log("Uploaded file details:", {
//       originalname: uploadedFile?.originalname,
//       mimetype: uploadedFile?.mimetype,
//       size: uploadedFile?.size,
//     });

//     if (!uploadedFile) {
//       return res.status(400).json({
//         success: false,
//         error: "No resume file uploaded",
//       });
//     }

//     // Use jobId from body if present, else from token
//     const finalJobId = jobId || tokenJobId;

//     let jobDescription = "";
//     if (finalJobId && tenantId) {
//       const job = await mongoose.model("Job").findOne({
//         _id: finalJobId,
//         tenantId,
//       });
//       if (job) jobDescription = job.jobDesc || "";
//     }

//     const analysis = await analyzeResumeWithPerplexity(
//       uploadedFile.buffer,
//       uploadedFile.mimetype,
//       jobDescription
//     );

//     res.status(200).json({
//       success: true,
//       data: {
//         extractedData: analysis.extractedData,
//         aiAnalysis: analysis.aiAnalysis,
//         rawText: analysis.rawText,
//       },
//     });
//   } catch (error) {
//     console.error("Error analyzing resume:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message || "Error analyzing resume",
//     });
//   }
// };


exports.analyzeVendorResume = async (req, res) => {
  try {
    // ✅ Get jobDesc from the token (req.vendor)
    const { tenantId, jobId, jobDesc: tokenJobDesc } = req.vendor || {};
    
    const uploadedFile = req.file;
    const { jobId: bodyJobId } = req.body;

    if (!uploadedFile) {
      return res.status(400).json({ success: false, error: "No resume file uploaded" });
    }

    const finalJobId = jobId || bodyJobId;

    let jobDescription = tokenJobDesc || ""; // ✅ Use jobDesc from token first

    // If not in token, fetch from database
    if (!jobDescription && finalJobId && tenantId) {
      const job = await mongoose.model("Job").findOne({ _id: finalJobId, tenantId });
      if (job) {
        jobDescription = job.jobDesc || "";
      }
    }

    console.log("Using job description for analysis:", jobDescription.substring(0, 100) + "...");

    const analysis = await analyzeResumeWithPerplexity(
      uploadedFile.buffer,
      uploadedFile.mimetype,
      jobDescription // ✅ Pass job description to analysis
    );

    res.status(200).json({
      success: true,
      data: {
        extractedData: analysis.extractedData,
        aiAnalysis: analysis.aiAnalysis,
        rawText: analysis.rawText,
      },
    });
  } catch (error) {
    console.error("Error analyzing resume:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error analyzing resume",
    });
  }
};


// Submit candidate from vendor
exports.submitVendorCandidate = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Vendor info:', req.vendor);

    const { jobId } = req.body;
    
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Job ID format'
      });
    }

    // ✅ Get job details to extract tenantId and owner
    const job = await mongoose.model('Job').findOne({ _id: jobId });
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // ✅ Check for duplicate candidate
    const existingCandidate = await mongoose.model('Candidate').findOne({
      email: req.body.email,
      tenantId: job.tenantId
    });

    if (existingCandidate) {
      return res.status(409).json({
        success: false,
        error: 'Candidate already exists in the system',
        duplicate: true,
        candidateId: existingCandidate._id
      });
    }

    // ✅ Validate that stage, source, and location IDs exist and belong to the tenant
    const [stage, source, currentLocation, preferredLocation] = await Promise.all([
      mongoose.model('Stage').findOne({ _id: req.body.stage }),
      mongoose.model('Source').findOne({ _id: req.body.source, tenantId: job.tenantId }),
      req.body.currentLocation ? mongoose.model('Location').findOne({ _id: req.body.currentLocation, tenantId: job.tenantId }) : null,
      req.body.preferredLocation ? mongoose.model('Location').findOne({ _id: req.body.preferredLocation, tenantId: job.tenantId }) : null
    ]);

    if (!stage) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stage selected'
      });
    }

    if (!source) {
      return res.status(400).json({
        success: false,
        error: 'Invalid source selected or source not found for this tenant'
      });
    }

    if (req.body.currentLocation && !currentLocation) {
      return res.status(400).json({
        success: false,
        error: 'Invalid current location or location not found for this tenant'
      });
    }

    if (req.body.preferredLocation && !preferredLocation) {
      return res.status(400).json({
        success: false,
        error: 'Invalid preferred location or location not found for this tenant'
      });
    }

    // ✅ Handle file uploads to Cloudinary
    let resumeId = null;
    if (req.files && req.files['resume']) {
      const resumeFile = req.files['resume'][0];
      
      try {
        // Upload to Cloudinary
        const cloudinaryResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: `tenants/${job.tenantId}/resumes`,
              public_id: `resume_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              tags: ['resume', 'vendor']
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(resumeFile.buffer);
        });

        // Create resume record with all required fields
        const resume = await mongoose.model('Resume').create({
          url: cloudinaryResult.secure_url,
          cloudinaryId: cloudinaryResult.public_id,
          fileType: resumeFile.mimetype,
          originalName: resumeFile.originalname,
          fileSize: resumeFile.size,
          tenantId: job.tenantId,
          userId: job.owner || new mongoose.Types.ObjectId(), // Use job owner as user
          vendorEmail: req.vendor.email,
          status: 'New',
          aiAnalysis: {
            matchPercentage: 0,
            matchingSkills: [],
            missingSkills: [],
            recommendation: 'Pending Analysis',
            analysis: 'Resume submitted by vendor - analysis pending'
          }
        });
        
        resumeId = resume._id;
      } catch (uploadError) {
        console.error('Resume upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload resume to cloud storage'
        });
      }
    }

    // ✅ Prepare candidate data with ALL required fields
    const candidateData = {
      // Basic Information (required)
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      mobile: req.body.mobile,
      
      // References (required)
      stage: req.body.stage,
      source: req.body.source,
      owner: job.owner || new mongoose.Types.ObjectId(), // Use job owner
      createdBy: job.owner || new mongoose.Types.ObjectId(), // Use job owner
      tenantId: job.tenantId,
      
      // Job reference
      jobId: job._id,
      
      // Compensation
      currentCTC: req.body.currentCTC || null,
      expectedCTC: req.body.expectedCTC || null,
      currency: req.body.currency || 'INR',
      
      // Professional Details
      skills: req.body.skills ? req.body.skills.split(',').map(skill => skill.trim()) : [],
      experience: req.body.experience,
      education: req.body.education,
      availableToJoin: req.body.availableToJoin,
      gender: req.body.gender,
      
      // Location References
      currentLocation: req.body.currentLocation || null,
      preferredLocation: req.body.preferredLocation || null,
      
      // Resume
      resume: resumeId,
      
      // Vendor-specific fields
      vendorEmail: req.vendor.email,
      vendorStatus: 'pending',
      vendorSubmissionDate: new Date()
    };

    // ✅ Create candidate (enable validation to catch any missing fields)
    const candidate = await mongoose.model('Candidate').create(candidateData);

    // ✅ Populate the response for better data
    const populatedCandidate = await mongoose.model('Candidate')
      .findById(candidate._id)
      .populate('stage', 'name')
      .populate('source', 'name')
      .populate('currentLocation preferredLocation', 'name')
      .populate('jobId', 'jobTitle')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Candidate submitted for approval',
      data: populatedCandidate
    });

  } catch (error) {
    console.error('Vendor submission error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Candidate with this email already exists in the system'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit candidate'
    });
  }
};


// Get vendor candidates for review
exports.getVendorCandidates = async (req, res) => {
  try {
    // Use vendor info instead of user info
    const tenantId = req.vendor?.tenantId; // make sure tenantId exists
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID not found for this vendor'
      });
    }

    const { status, page = 1, limit = 10, vendorEmail } = req.query;

    const query = { 
      tenantId, 
      vendorStatus: { $ne: null } // Only candidates with vendor status
    };
    
    if (status) query.vendorStatus = status;
    if (vendorEmail) query.vendorEmail = vendorEmail;

    const candidates = await Candidate.find(query)
      .populate('jobId', 'jobTitle jobDesc')
      .populate('stage', 'name')
      .populate('source', 'name')
      .populate('currentLocation preferredLocation', 'name')
      .populate('resume', 'url aiAnalysis matchingScore')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Candidate.countDocuments(query);

    res.json({
      success: true,
      candidates,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get vendor candidates error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching vendor candidates'
    });
  }
};


// Approve vendor candidate
exports.approveVendorCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, _id: userId } = req.user;

    const candidate = await Candidate.findOne({
      _id: id,
      tenantId,
      vendorStatus: 'pending'
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Vendor candidate not found or already processed'
      });
    }

    // Validate references belong to the same tenant
    const [source, currentLoc, preferredLoc, job] = await Promise.all([
      candidate.source ? mongoose.model('Source').findOne({ _id: candidate.source, tenantId }) : null,
      candidate.currentLocation ? mongoose.model('Location').findOne({ _id: candidate.currentLocation, tenantId }) : null,
      candidate.preferredLocation ? mongoose.model('Location').findOne({ _id: candidate.preferredLocation, tenantId }) : null,
      candidate.jobId ? mongoose.model('Job').findOne({ _id: candidate.jobId, tenantId }) : null
    ]);

    // Update candidate status and set proper ownership
    candidate.vendorStatus = 'approved';
    candidate.vendorReviewDate = new Date();
    candidate.reviewedBy = userId;
    candidate.owner = userId; // Set the approving user as owner
    candidate.createdBy = userId; // Set the approving user as creator

    await candidate.save();

    // Populate and return the updated candidate
    const result = await Candidate.findById(candidate._id)
      .populate('jobId', 'jobTitle jobDesc')
      .populate('stage', 'name')
      .populate('currentLocation preferredLocation', 'name')
      .populate('source', 'name')
      .populate('owner', 'name email')
      .populate('resume')
      .lean();

    res.json({
      success: true,
      message: 'Candidate approved successfully',
      candidate: result
    });

  } catch (error) {
    console.error('Approve vendor candidate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error approving candidate'
    });
  }
};

// Reject vendor candidate
exports.rejectVendorCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, _id: userId } = req.user;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const candidate = await Candidate.findOne({
      _id: id,
      tenantId,
      vendorStatus: 'pending'
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Vendor candidate not found or already processed'
      });
    }

    candidate.vendorStatus = 'rejected';
    candidate.rejectionReason = reason;
    candidate.vendorReviewDate = new Date();
    candidate.reviewedBy = userId;

    await candidate.save();

    res.json({
      success: true,
      message: 'Candidate rejected',
      candidate
    });

  } catch (error) {
    console.error('Reject vendor candidate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error rejecting candidate'
    });
  }
};

// Get single vendor candidate
exports.getVendorCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const candidate = await Candidate.findOne({
      _id: id,
      tenantId,
      vendorStatus: { $ne: null }
    })
    .populate('jobId', 'jobTitle jobDesc')
    .populate('stage', 'name')
    .populate('source', 'name')
    .populate('currentLocation preferredLocation', 'name')
    .populate('resume', 'url aiAnalysis matchingScore')
    .populate('reviewedBy', 'name email')
    .populate('owner', 'name email');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Vendor candidate not found'
      });
    }

    res.json({
      success: true,
      candidate
    });

  } catch (error) {
    console.error('Get vendor candidate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching vendor candidate'
    });
  }
};

// Get vendor candidate statistics
exports.getVendorCandidateStats = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const stats = await Candidate.aggregate([
      { 
        $match: { 
          tenantId: mongoose.Types.ObjectId(tenantId),
          vendorStatus: { $ne: null }
        } 
      },
      {
        $group: {
          _id: '$vendorStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Candidate.countDocuments({ 
      tenantId, 
      vendorStatus: { $ne: null } 
    });
    
    const statsObject = {
      pending: 0,
      approved: 0,
      rejected: 0,
      duplicate: 0,
      total
    };

    stats.forEach(stat => {
      statsObject[stat._id] = stat.count;
    });

    res.json({
      success: true,
      stats: statsObject
    });

  } catch (error) {
    console.error('Get vendor candidate stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching statistics'
    });
  }
};

// Helper function to determine resume status (you might already have this)
function determineStatus(analysis) {
  const matchPercentage = analysis.aiAnalysis?.matchPercentage || 0;
  if (matchPercentage >= 80) return 'Perfect Match';
  if (matchPercentage >= 60) return 'Good Match';
  if (matchPercentage >= 40) return 'Average Match';
  return 'Poor Match';
}


exports.createVendorCandidate=async(req,res)=>{

}