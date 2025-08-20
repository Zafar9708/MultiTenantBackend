const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Apply auth middleware to all routes
router.use(protect);

// Candidate routes
router.route('/')
  .post(
    authorize('admin', 'recruiter'),
    upload.single('resume'),
    candidateController.createCandidate
  )
  .get(candidateController.getAllCandidates);

router.route('/:id')
  .get(candidateController.getCandidateById)
  .put(
    authorize('admin', 'recruiter'),
    upload.single('resume'),
    candidateController.updateCandidate
  )
  .delete(
    authorize('admin', 'recruiter'),
    candidateController.deleteCandidate
  );

router.route('/job/:jobId')
  .get(candidateController.getCandidatesForJob);

router.route('/:id/stage-history')
  .get(candidateController.getCandidateStageHistory);


router.route('/resumes/analyze')
  .post(
    authorize('admin', 'recruiter'),
    upload.single('resume'),
    candidateController.analyzeResume
  );  

router.route('/:id/resume-analysis')
  .get(candidateController.getCandidateResumeAnalysis);

router.route('/preview-resume/:id')
      .get( authorize('admin','recruiter'),
          candidateController.previewResume)

router.route('/download-resume/:id')
       .get(authorize('admin','recruiter'),
         candidateController.downloadResume)

module.exports = router;