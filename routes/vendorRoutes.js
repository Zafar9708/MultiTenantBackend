const express = require('express');
const mongoose=require('mongoose')
const router = express.Router();
const {protect,authorize}=require('../middleware/auth')
const { verifyVendorToken } = require('../utils/auth');
const { validateVendorToken } = require('../middleware/vendorAuth');
const {upload} = require('../middleware/upload');




const {
 getVendorLocations,
 getVendorSources,
 getVendorStages,
 analyzeVendorResume,
 submitVendorCandidate,
 getVendorCandidates,
 getVendorCandidateStats,
 getVendorCandidateById,
 rejectVendorCandidate,
 approveVendorCandidate
} = require('../controllers/vendorController');


router.post('/submit-candidate', 
  validateVendorToken,
  (req, res, next) => {
    console.log('Request body fields:', Object.keys(req.body));
    console.log('Request files received:', req.files);
    
    // Log all incoming fields
    console.log('All incoming fields:');
    for (let [key, value] of Object.entries(req.body)) {
      console.log(`${key}: ${value}`);
    }
    next();
  }, 
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'additionalDocuments', maxCount: 5 }
  ]), 
  submitVendorCandidate
);

// Get vendor candidates (for admin/recruiter review)
router.get('/candidates',validateVendorToken, getVendorCandidates);
router.get('/candidates/stats',validateVendorToken, getVendorCandidateStats);
router.get('/candidates/:id', getVendorCandidateById);
router.patch('/candidates/:id/approve', approveVendorCandidate);
router.patch('/candidates/:id/reject', rejectVendorCandidate);

router.get('/locations', validateVendorToken, getVendorLocations);
router.get('/sources', validateVendorToken, getVendorSources);
router.get('/stages/all', validateVendorToken, getVendorStages);
router.post('/resumes/analyze', validateVendorToken,   upload.single('resume'),
 validateVendorToken, analyzeVendorResume);

router.get('/validate-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    console.log('Received token for validation:', token);
    
    // Verify the token
    const decoded = verifyVendorToken(token);
    console.log('Token decoded successfully:', decoded);
    
    // Get job details from database
    const job = await mongoose.model('Job').findById(decoded.jobId);
    
    if (!job) {
      console.log('Job not found with ID:', decoded.jobId);
      return res.status(404).json({ 
        valid: false, 
        error: 'Job not found' 
      });
    }
    
    console.log('Job found:', job.jobTitle);
    
    res.json({
      valid: true,
      job: {
        jobTitle: job.jobTitle,
        department: job.department,
        experience: job.experience,
        jobDesc: job.jobDesc,
        compensation: job.jobFormId ? {
          currency: job.jobFormId.currency,
          amount: job.jobFormId.amount
        } : null
      },
      vendorEmail: decoded.vendorEmail // Include this for frontend
    });
  } catch (error) {
    console.error('Token validation error:', error.message);
    res.status(401).json({ 
      valid: false, 
      error: error.message 
    });
  }
});


module.exports = router;
