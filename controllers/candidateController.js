const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const Resume = require('../models/Resume');
const Source = require('../models/Source');
const Location = require('../models/Location');
const { analyzeResumeWithPerplexity } = require('../services/perplexityMatchingService');
const cloudinary = require('../config/cloudinary');
const mongoosePaginate = require('mongoose-paginate-v2');

// Create a new candidate
const createCandidate = async (req, res) => {
  try {
    const { tenantId, _id: userId, role } = req.user;
    const data = req.body;
    const uploadedFile = req.file;

    // Check permissions - only admin and recruiter can add candidates
    if (!['admin', 'recruiter'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Only admins and recruiters can add candidates'
      });
    }

    // Validate required fields
    if (!data.source) {
      return res.status(400).json({
        success: false,
        error: 'Source is required'
      });
    }

    // Validate references belong to the same tenant
    const [source, currentLoc, preferredLoc, job] = await Promise.all([
      Source.findOne({ _id: data.source, tenantId }),
      data.currentLocation ? Location.findOne({ _id: data.currentLocation, tenantId }) : null,
      data.preferredLocation ? Location.findOne({ _id: data.preferredLocation, tenantId }) : null,
      data.jobId ? mongoose.model('Job').findOne({ _id: data.jobId, tenantId }) : null
    ]);

    if (!source) {
      return res.status(400).json({
        success: false,
        error: 'Invalid source selected'
      });
    }

    if (data.currentLocation && !currentLoc) {
      return res.status(400).json({
        success: false,
        error: 'Invalid current location'
      });
    }

    if (data.preferredLocation && !preferredLoc) {
      return res.status(400).json({
        success: false,
        error: 'Invalid preferred location'
      });
    }

    if (data.jobId && !job) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job selected'
      });
    }

    // Process resume if uploaded
    let resumeData = null;
if (uploadedFile) {
  try {
    // Upload to Cloudinary
    const cloudinaryResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: `tenants/${tenantId}/resumes`,
          public_id: `resume_${Date.now()}`,
          tags: ['resume']
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(uploadedFile.buffer);
    });

    // Get job description for analysis
    const jobDescription = data.jobId 
      ? (await mongoose.model('Job').findById(data.jobId))?.jobDesc || ''
      : '';

    // Create basic resume data structure
    const resumePayload = {
      url: cloudinaryResult.secure_url,
      cloudinaryId: cloudinaryResult.public_id,
      fileType: uploadedFile.mimetype,
      originalName: uploadedFile.originalname,
      fileSize: uploadedFile.size,
      tenantId,
      userId,
      jobId: data.jobId,
      status: 'New'
    };

    // Only attempt analysis if we have a job description
    if (jobDescription) {
      try {
        const analysis = await analyzeResumeWithPerplexity(
          uploadedFile.buffer, 
          jobDescription
        );
        
        // Add analysis data to payload
        resumePayload.aiAnalysis = analysis.aiAnalysis || {
          matchPercentage: 0,
          matchingSkills: [],
          missingSkills: [],
          recommendation: 'Analysis Completed',
          analysis: 'Resume analysis completed'
        };
        resumePayload.matchingScore = analysis.aiAnalysis?.matchPercentage || 0;
        resumePayload.status = determineStatus(analysis);
        
        // Add extracted data if available
        if (analysis.extractedData) {
          resumePayload.skills = analysis.extractedData.skills || [];
          resumePayload.experience = analysis.extractedData.experience || '';
          resumePayload.education = analysis.extractedData.education || '';
        }
      } catch (analysisError) {
        console.error('Analysis error:', analysisError);
        // Continue with basic resume data
        resumePayload.aiAnalysis = {
          matchPercentage: 0,
          matchingSkills: [],
          missingSkills: [],
          recommendation: 'Analysis Failed',
          analysis: 'Could not analyze resume'
        };
      }
    }

    // Create resume record
    resumeData = await Resume.create(resumePayload);
    data.resume = resumeData._id;

  } catch (resumeError) {
    console.error('Resume processing error:', resumeError);
    return res.status(500).json({
      success: false,
      error: 'Failed to process resume',
      details: process.env.NODE_ENV === 'development' ? resumeError.message : undefined
    });
  }
}

    // Create candidate
    const candidate = new Candidate({
      ...data,
      tenantId,
      userId,
      createdBy: userId,
      owner: userId
    });

    const savedCandidate = await candidate.save();

    // Update resume with candidate reference if created
    if (resumeData) {
      await Resume.findByIdAndUpdate(resumeData._id, {
        candidateId: savedCandidate._id
      });
    }

    // Populate and return the created candidate
    const result = await Candidate.findById(savedCandidate._id)
      .populate({
        path: 'resume',
        populate: {
          path: 'jobId',
          select: 'jobTitle jobDesc'
        }
      })
      .populate('jobId')
      .populate('stage')
      .populate('currentLocation preferredLocation', 'name')
      .populate('source', 'name')
      .populate('owner', 'name email')
      .lean();

    // Add AI analysis to the response if available
    if (result.resume?.aiAnalysis) {
      result.aiAnalysis = result.resume.aiAnalysis;
    }

    res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      candidate: result
    });

  } catch (error) {
    console.error('Error creating candidate:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Candidate with this ${field} already exists`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({ 
      success: false,
      error: error.message || 'Error creating candidate' 
    });
  }
};

// Get all candidates with role-based filtering
const getAllCandidates = async (req, res) => {
  try {
    const { tenantId, _id: userId, role } = req.user;
    const { page = 1, limit = 10, search, stage, source, jobId } = req.query;
    
    const query = { tenantId };
    
    // Recruiters can only see their own candidates
    if (role === 'recruiter') {
      query.owner = userId;
    }
    // Admins see all candidates (no additional filter)
    
    // Apply search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Apply other filters
    if (stage) {
      query.stage = stage;
    }
    
    if (source) {
      query.source = source;
    }
    
    if (jobId) {
      query.jobId = jobId;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'stage', select: 'name' },
        { path: 'jobId', select: 'jobTitle' },
        { path: 'source', select: 'name' },
        { path: 'currentLocation preferredLocation', select: 'name' },
        { path: 'owner', select: 'name email' }
      ]
    };

    const candidates = await Candidate.paginate(query, options);

    res.status(200).json({
      success: true,
      count: candidates.totalDocs,
      page: candidates.page,
      pages: candidates.totalPages,
      candidates: candidates.docs
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching candidates'
    });
  }
};

// Get candidate by ID with tenant and role check
const getCandidateById = async (req, res) => {
  try {
    const { tenantId, _id: userId, role } = req.user;
    const { id } = req.params;

    const query = { _id: id, tenantId };
    
    // Recruiters can only access their own candidates
    if (role === 'recruiter') {
      query.owner = userId;
    }

    const candidate = await Candidate.findOne(query)
      .populate('stage', 'name')
      .populate('jobId', 'jobTitle')
      .populate('source', 'name')
      .populate('currentLocation preferredLocation', 'name')
      .populate('owner', 'name email')
      .populate('resume')
      .populate({
        path: 'comments.changedBy',
        select: 'name email'
      });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found or not accessible'
      });
    }

    res.status(200).json({
      success: true,
      candidate
    });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching candidate'
    });
  }
};

// Update candidate with role-based access control
const updateCandidate = async (req, res) => {
  try {
    const { tenantId, _id: userId, role } = req.user;
    const { id } = req.params;
    const updates = req.body;
    const uploadedFile = req.file;

    // Base query with tenant check
    const query = { _id: id, tenantId };
    
    // Recruiters can only update their own candidates
    if (role === 'recruiter') {
      query.owner = userId;
    }

    // Check if candidate exists and is accessible
    const candidate = await Candidate.findOne(query);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found or not accessible'
      });
    }

    // Validate references if provided
    if (updates.source) {
      const source = await Source.findOne({ _id: updates.source, tenantId });
      if (!source) {
        return res.status(400).json({
          success: false,
          error: 'Invalid source selected'
        });
      }
    }

    if (updates.currentLocation) {
      const location = await Location.findOne({ _id: updates.currentLocation, tenantId });
      if (!location) {
        return res.status(400).json({
          success: false,
          error: 'Invalid current location'
        });
      }
    }

    if (updates.preferredLocation) {
      const location = await Location.findOne({ _id: updates.preferredLocation, tenantId });
      if (!location) {
        return res.status(400).json({
          success: false,
          error: 'Invalid preferred location'
        });
      }
    }

    if (updates.jobId) {
      const job = await mongoose.model('Job').findOne({ _id: updates.jobId, tenantId });
      if (!job) {
        return res.status(400).json({
          success: false,
          error: 'Invalid job selected'
        });
      }
    }

    // Process resume if uploaded
    if (uploadedFile) {
      try {
        // Delete old resume if exists
        if (candidate.resume) {
          const oldResume = await Resume.findById(candidate.resume);
          if (oldResume) {
            await cloudinary.uploader.destroy(oldResume.cloudinaryId);
            await Resume.findByIdAndDelete(oldResume._id);
          }
        }

        // Upload new resume
        const cloudinaryResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: `tenants/${tenantId}/resumes`,
              public_id: `resume_${Date.now()}`,
              tags: ['resume']
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(uploadedFile.buffer);
        });

        // Get job description for analysis if job is specified
        const job = updates.jobId 
          ? await mongoose.model('Job').findOne({ _id: updates.jobId, tenantId })
          : candidate.jobId 
            ? await mongoose.model('Job').findById(candidate.jobId)
            : null;

        // Analyze with Perplexity
        const perplexityResult = await analyzeResumeWithPerplexity(
          uploadedFile.buffer,
          job?.jobDesc || ''
        );

        // Create new resume record
        const resumeData = await Resume.create({
          ...perplexityResult.extractedData,
          url: cloudinaryResult.secure_url,
          cloudinaryId: cloudinaryResult.public_id,
          fileType: uploadedFile.mimetype,
          originalName: uploadedFile.originalname,
          fileSize: uploadedFile.size,
          aiAnalysis: perplexityResult.aiAnalysis,
          matchingScore: perplexityResult.aiAnalysis.matchPercentage,
          status: perplexityResult.success ? 'Under Review' : 'Pending Review',
          tenantId,
          userId,
          jobId: updates.jobId || candidate.jobId
        });

        updates.resume = resumeData._id;
      } catch (resumeError) {
        console.error('Resume processing error:', resumeError);
        return res.status(500).json({
          success: false,
          error: 'Failed to process resume',
          details: process.env.NODE_ENV === 'development' ? resumeError.message : undefined
        });
      }
    }

    // Update candidate
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('resume')
      .populate('jobId')
      .populate('stage')
      .populate('currentLocation preferredLocation', 'name')
      .populate('source', 'name')
      .populate('owner', 'name email');

    res.status(200).json({
      success: true,
      message: "Candidate updated successfully",
      candidate: updatedCandidate
    });
  } catch (error) {
    console.error('Error updating candidate:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Candidate with this ${field} already exists`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Error updating candidate'
    });
  }
};

// Delete candidate with role-based access control
const deleteCandidate = async (req, res) => {
  try {
    const { tenantId, _id: userId, role } = req.user;
    const { id } = req.params;

    // Base query with tenant check
    const query = { _id: id, tenantId };
    
    // Recruiters can only delete their own candidates
    if (role === 'recruiter') {
      query.owner = userId;
    }

    // Check if candidate exists and is accessible
    const candidate = await Candidate.findOne(query);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found or not accessible'
      });
    }

    // Delete associated resume if exists
    if (candidate.resume) {
      const resume = await Resume.findById(candidate.resume);
      if (resume) {
        await cloudinary.uploader.destroy(resume.cloudinaryId);
        await Resume.findByIdAndDelete(resume._id);
      }
    }

    // Delete candidate
    await Candidate.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Candidate deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error deleting candidate'
    });
  }
};

// Get candidates for a specific job with role-based access
const getCandidatesForJob = async (req, res) => {
  try {
    const { tenantId, _id: userId, role } = req.user;
    const { jobId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const query = { jobId, tenantId };
    
    if (role === 'recruiter') {
      query.owner = userId;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'stage', select: 'name' },
        { path: 'source', select: 'name' },
        { path: 'resume', select: 'status matchingScore' }
      ]
    };

    // Use the paginate method
    const result = await Candidate.paginate(query, options);

    res.status(200).json({
      success: true,
      count: result.totalDocs,
      page: result.page,
      pages: result.totalPages,
      candidates: result.docs
    });
  } catch (error) {
    console.error('Error fetching candidates for job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching candidates for job'
    });
  }
};

// Get candidate stage history with role-based access
const getCandidateStageHistory = async (req, res) => {
  try {
    const { tenantId, _id: userId, role } = req.user;
    const { id } = req.params;

    const query = { _id: id, tenantId };
    
    // Recruiters can only access their own candidates
    if (role === 'recruiter') {
      query.owner = userId;
    }

    const candidate = await Candidate.findOne(query)
      .populate('stage', 'name')
      .populate('jobId', 'jobTitle')
      .populate({
        path: 'comments.changedBy',
        select: 'name email'
      });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found or not accessible'
      });
    }

    // Sort comments by date
    const sortedComments = [...candidate.comments].sort(
      (a, b) => new Date(a.changedAt) - new Date(b.changedAt)
    );

    // Find current stage entry date
    let currentStageDate = candidate.createdAt; // Default to candidate creation date
    
    const history = [];

    // Check if we have any stage change comments
    sortedComments.forEach((comment) => {
      if (comment.stageChangedTo) {
        history.push({
          from: comment.stageChangedFrom || 'Unknown',
          to: comment.stageChangedTo,
          changedAt: comment.changedAt,
          changedBy: comment.changedBy
        });

        // If this comment shows a change to the current stage, use this date
        if (comment.stageChangedTo === candidate.stage?.name) {
          if (!currentStageDate || new Date(comment.changedAt) > new Date(currentStageDate)) {
            currentStageDate = comment.changedAt;
          }
        }
      }
    });

    // If we have no stage change history but the candidate has a stage,
    // use the candidate creation date as when they entered the current stage
    if (history.length === 0 && candidate.stage?.name) {
      currentStageDate = candidate.createdAt;
    }

    res.status(200).json({
      success: true,
      candidateId: candidate._id,
      name: `${candidate.firstName} ${candidate.middleName || ''} ${candidate.lastName}`.trim(),
      jobTitle: candidate.jobId?.jobTitle || 'N/A',
      currentStage: candidate.stage?.name || 'Not Assigned',
      currentStageSince: currentStageDate,
      history
    });
  } catch (error) {
    console.error('Error getting candidate stage history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error getting candidate stage history'
    });
  }
};

// Get candidate resume analysis with role-based access
const getCandidateResumeAnalysis = async (req, res) => {
  try {
    const { tenantId, _id: userId, role } = req.user;
    const { id } = req.params;

    const query = { _id: id, tenantId };
    
    // Recruiters can only access their own candidates
    if (role === 'recruiter') {
      query.owner = userId;
    }

    const candidate = await Candidate.findOne(query)
      .populate('jobId', 'jobTitle jobDesc')
      .populate('stage', 'name')
      .populate('resume');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found or not accessible'
      });
    }

    if (!candidate.resume) {
      return res.status(404).json({
        success: false,
        error: 'No resume found for this candidate'
      });
    }

    res.status(200).json({
      success: true,
      candidate: {
        _id: candidate._id,
        name: `${candidate.firstName} ${candidate.middleName || ''} ${candidate.lastName}`.trim(),
        currentStage: candidate.stage?.name || 'Not assigned',
        jobTitle: candidate.jobId?.jobTitle || 'N/A',
        jobDescription: candidate.jobId?.jobDesc || 'No description available'
      },
      resumeAnalysis: {
        _id: candidate.resume._id,
        matchPercentage: candidate.resume.matchingScore || 0,
        matchingScore: candidate.resume.matchingScore || 0,
        status: candidate.resume.status || 'Not analyzed',
        recommendation: candidate.resume.aiAnalysis?.recommendation || 'Not available',
        skills: {
          matching: candidate.resume.aiAnalysis?.matchingSkills || [],
          missing: candidate.resume.aiAnalysis?.missingSkills || []
        },
        analysis: {
          overall: candidate.resume.aiAnalysis?.analysis || '',
          experience: candidate.resume.aiAnalysis?.experienceMatch || '',
          education: candidate.resume.aiAnalysis?.educationMatch || ''
        },
        resumeUrl: candidate.resume.url,
        parsedAt: candidate.resume.aiAnalysis?.parsedAt || candidate.resume.createdAt,
        lastUpdated: candidate.resume.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching candidate resume analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching candidate resume analysis'
    });
  }
};


// Update candidate stage with role-based access control
const updateCandidateStage = async (req, res) => {
  try {
    const { tenantId, _id: userId, role } = req.user;
    const { id } = req.params;
    const { stageId, comment } = req.body;

    console.log('Request details:', { tenantId, candidateId: id, stageId, comment });

    // Validate required fields
    if (!stageId) {
      return res.status(400).json({
        success: false,
        error: 'Stage ID is required'
      });
    }

    // Base query with tenant check
    const query = { _id: id, tenantId };
    
    // Recruiters can only update their own candidates
    if (role === 'recruiter') {
      query.owner = userId;
    }

    // Check if candidate exists and is accessible
    const candidate = await Candidate.findOne(query);
    console.log('Candidate found:', candidate ? candidate._id : 'Not found');
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found or not accessible'
      });
    }

    // Check if stage exists
    const stage = await mongoose.model('Stage').findById(stageId);
    
    console.log('Stage found:', stage ? stage._id : 'Not found');
    
    if (!stage) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stage selected'
      });
    }

    // NEW: Validate that the user exists and belongs to the same tenant
    const user = await mongoose.model('User').findOne({
      _id: userId,
      tenantId: tenantId
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found or not authorized for this tenant'
      });
    }

    // Get the current stage name before update
    const currentStage = await mongoose.model('Stage').findById(candidate.stage);
    const currentStageName = currentStage ? currentStage.name : 'Not assigned';

    // Get the new stage name
    const newStageName = stage.name;

    // Update candidate stage - use the user ObjectId directly
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      id,
      { 
        stage: stageId,
        $push: {
          comments: {
            stageChangedFrom: currentStageName,
            stageChangedTo: newStageName,
            changedBy: userId, // This should be a valid ObjectId
            comment: comment || `Stage changed from ${currentStageName} to ${newStageName}`,
            changedAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    )
      .populate('stage', 'name')
      .populate('jobId', 'jobTitle')
      .populate({
        path: 'comments.changedBy',
        select: 'name email'
      });

    res.status(200).json({
      success: true,
      message: "Candidate stage updated successfully",
      candidate: {
        _id: updatedCandidate._id,
        name: `${updatedCandidate.firstName} ${updatedCandidate.middleName || ''} ${updatedCandidate.lastName}`.trim(),
        currentStage: updatedCandidate.stage?.name,
        previousStage: currentStageName,
        updatedAt: updatedCandidate.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating candidate stage:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Error updating candidate stage'
    });
  }
};


function determineStatus(analysis) {
  if (!analysis || !analysis.aiAnalysis) return 'New';
  
  const score = analysis.aiAnalysis.matchPercentage || 0;
  const recommendation = analysis.aiAnalysis.recommendation || '';

  if (score >= 75 || recommendation.includes('Strong')) return 'Shortlisted';
  if (score >= 50 || recommendation.includes('Moderate')) return 'Under Review';
  if (score < 50 || recommendation.includes('Weak')) return 'Pending Review';
  
  return 'New';
}


const analyzeResume = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const uploadedFile = req.file;
    const { jobId } = req.body;

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: 'No resume file uploaded'
      });
    }

    // Get job description if jobId is provided
    let jobDescription = '';
    if (jobId) {
      const job = await mongoose.model('Job').findOne({ _id: jobId, tenantId });
      if (job) {
        jobDescription = job.jobDesc || '';
      }
    }

    // Analyze with Perplexity
    const analysis = await analyzeResumeWithPerplexity(uploadedFile.buffer, jobDescription);

    res.status(200).json({
      success: true,
      data: {
        extractedData: analysis.extractedData,
        aiAnalysis: analysis.aiAnalysis
      }
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error analyzing resume'
    });
  }
};

const previewResume = async (req, res) => {
  try {
    const { tenantId, _id: userId, role } = req.user;
    const { id } = req.params;

    // Find candidate with access control
    const query = { _id: id, tenantId };
    if (role === 'recruiter') {
      query.owner = userId;
    }

    const candidate = await Candidate.findOne(query).populate('resume');
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found or not accessible'
      });
    }

    if (!candidate.resume) {
      return res.status(404).json({
        success: false,
        error: 'No resume found for this candidate'
      });
    }

    // Get the file extension
    const fileExt = candidate.resume.originalName.split('.').pop().toLowerCase();
    const contentType = getContentType(fileExt);

    if (!contentType) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported file type for preview'
      });
    }

    // Fetch the file from Cloudinary
    const response = await fetch(candidate.resume.url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch resume from Cloudinary: ${response.statusText}`);
    }

    // Get the file as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set headers and send the file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(candidate.resume.originalName)}"`);
    res.send(buffer);

  } catch (error) {
    console.error('Error previewing resume:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error previewing resume'
    });
  }
};

// Download candidate's resume
const downloadResume = async (req, res) => {
  try {
    const { tenantId, _id: userId, role } = req.user;
    const { id } = req.params;

    // Find candidate with access control
    const query = { _id: id, tenantId };
    if (role === 'recruiter') {
      query.owner = userId;
    }

    const candidate = await Candidate.findOne(query).populate('resume');
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found or not accessible'
      });
    }

    if (!candidate.resume) {
      return res.status(404).json({
        success: false,
        error: 'No resume found for this candidate'
      });
    }

    // Get the file extension and proper content type
    const fileExt = candidate.resume.originalName.split('.').pop().toLowerCase();
    const contentType = getContentType(fileExt) || 'application/octet-stream';

    // Fetch the file from Cloudinary
    const response = await fetch(candidate.resume.url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch resume from Cloudinary: ${response.statusText}`);
    }

    // Get the file as ArrayBuffer and convert to Buffer
    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Set proper headers for download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(candidate.resume.originalName)}"`);
    
    // Send the file buffer
    res.end(fileBuffer);

  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error downloading resume'
    });
  }
};

// Helper function to determine content type
function getContentType(fileExt) {
  const contentTypes = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    rtf: 'application/rtf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png'
  };
  return contentTypes[fileExt] || null;
}

module.exports = {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  getCandidatesForJob,
  getCandidateStageHistory,
  getCandidateResumeAnalysis,
  analyzeResume,
  previewResume,
  downloadResume,
  updateCandidateStage
};
