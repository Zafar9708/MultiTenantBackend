const express = require('express');
const router = express.Router();
const {
    getJobTemplates,
    postJob,
    getAllJobs,
    getJobDetailById,
    changeJobStatusById,
    getAllJobsByStatus,
    updateJob,
    deleteJob,
    deleteJobById,
    getLocation,
    addLocation
} = require('../controllers/job/jobController');
const { protect, authorize, tenantRestriction } = require('../middleware/auth');

router.use(protect, tenantRestriction);


router.post('/',authorize('admin', 'recruiter'),postJob);
router.put('/:id',authorize('admin', 'recruiter'),updateJob);
router.delete('/',authorize('admin', 'recruiter'),deleteJob);
router.delete('/:id',authorize('admin', 'recruiter'),deleteJobById),
router.patch('/:id/status',authorize('admin', 'recruiter'), changeJobStatusById);
router.get('/', authorize('admin', 'recruiter'), getAllJobs);
router.get('/byStatus/:status', authorize('admin', 'recruiter'),getAllJobsByStatus);

router.get('/:id',authorize('admin', 'recruiter'), getJobDetailById); 

router.get('/jobTemplates',authorize('admin', 'recruiter'),getJobTemplates)

module.exports = router;