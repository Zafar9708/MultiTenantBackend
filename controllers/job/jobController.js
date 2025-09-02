
const mongoose = require('mongoose');
const { Types: { ObjectId } } = require('mongoose');

const Job = require('../../models/Job');
const JobForm = require('../../models/JobForm');
const Employee = require('../../models/Employee');
const User = require('../../models/User');
const Location = require('../../models/Location');
const Tenant = require('../../models/Tenant');
const { sendJobCreationEmail, sendSalesPersonNotification } = require('../../services/emailService');

// Helper function to generate job name with tenant prefix
const generateJobName = async (tenantId) => {
    const tenant = await Tenant.findById(tenantId);
    const prefix = tenant?.code || 'WR'; // Default prefix if no code
    const jobCount = await Job.countDocuments({ tenantId });
    return `${prefix}${String(jobCount + 1).padStart(3, '0')}`;
};



// Get job templates
const getJobTemplates = (req, res) => {
    try {
        const templates = require('../data/templates.json');
        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching job templates' });
    }
};


const postJob = async (req, res) => {
    try {
        const { tenantId, _id: userId, role } = req.user;
        const { 
            jobTitle, 
            department, 
            experience, 
            jobDesc,
            jobType, 
            locations, 
            openings, 
            targetHireDate, 
            currency,
            amount, 
            allowReapply, 
            reapplyDate, 
            markPriority, 
            hiringFlow,
            BusinessUnit, 
            Client, 
            salesPerson,
            recruitingPerson,
            assignedRecruiters 
        } = req.body;

        // Validate required fields
        if (!jobTitle || !department || !experience || !jobDesc) {
            return res.status(400).json({ error: 'Job title, department, experience, and description are required' });
        }

        if (!locations || locations.length === 0) {
            return res.status(400).json({ error: 'At least one location is required' });
        }

        if (BusinessUnit === 'external') {
            if (!Client) return res.status(400).json({ error: "Client is required for external business unit" });
            if (!salesPerson) return res.status(400).json({ error: "Sales Person is required for external business unit" });
        }

        // Verify locations belong to the tenant
        const existingLocations = await Location.find({ 
            _id: { $in: locations },
            tenantId 
        });
        if (existingLocations.length !== locations.length) {
            return res.status(400).json({ error: "Invalid locations or locations not belonging to your tenant" });
        }

        // Handle recruiter assignment based on user role
        let finalAssignedRecruiters = [];

        if (role === 'admin') {
            // Admin can assign to specific recruiters
            if (assignedRecruiters && assignedRecruiters.length > 0) {
                // Verify assigned recruiters belong to the tenant
                const existingRecruiters = await User.find({ 
                    _id: { $in: assignedRecruiters },
                    tenantId,
                    role: 'recruiter'
                });
                
                if (existingRecruiters.length !== assignedRecruiters.length) {
                    return res.status(400).json({ error: "Invalid recruiters or recruiters not belonging to your tenant" });
                }
                finalAssignedRecruiters = assignedRecruiters;
            }
        } else if (role === 'recruiter') {
            // Recruiters are automatically assigned to themselves
            finalAssignedRecruiters = [userId];
        }

        // Initialize salesPersonDetails
        let salesPersonDetails = null;

        // Get salesperson details if external
        if (BusinessUnit === 'external' && salesPerson) {
            if (!mongoose.Types.ObjectId.isValid(salesPerson)) {
                return res.status(400).json({ error: "Invalid salesperson ID format" });
            }

            salesPersonDetails = await Employee.findOne({
                _id: salesPerson,
                tenantId
            }).select('name email');
            
            if (!salesPersonDetails) {
                return res.status(400).json({ error: "Salesperson not found in your tenant" });
            }
        }

        // Create job with tenant
        const jobName = await generateJobName(tenantId);
        const job = new Job({
            jobName,
            jobTitle,
            department,
            experience,
            jobDesc,
            userId,
            tenantId,
            assignedRecruiters: finalAssignedRecruiters
        });

        // Create job form with tenant
        const jobFormInstance = new JobForm({
            jobType,
            locations,
            openings,
            targetHireDate,
            currency,
            amount,
            allowReapply,
            reapplyDate,
            markPriority,
            hiringFlow,
            BusinessUnit,
            Client: BusinessUnit === 'external' ? Client : undefined,
            salesPerson: BusinessUnit === 'external' ? salesPerson : undefined,
            salesPersonName: BusinessUnit === 'external' && salesPersonDetails ? salesPersonDetails.name : undefined,
            salesPersonEmail: BusinessUnit === 'external' && salesPersonDetails ? salesPersonDetails.email : undefined,
            recruitingPerson: Array.isArray(recruitingPerson) ? recruitingPerson : [recruitingPerson],
            tenantId
        });

        // Save both documents
        const [savedJob, savedJobForm] = await Promise.all([
            job.save(),
            jobFormInstance.save()
        ]);

        // Link job form to job
        savedJob.jobFormId = savedJobForm._id;
        await savedJob.save();

        // Populate response
        const populatedJobForm = await JobForm.findById(savedJobForm._id)
            .populate('locations', 'name')
            .populate('salesPerson', 'name email')
            .populate('Client', 'name');

        const responseJob = {
            ...savedJob.toObject(),
            jobForm: populatedJobForm.toObject()
        };

        // Send notification if external business unit
        if (BusinessUnit === 'external' && salesPersonDetails?.email) {
            try {
                const creator = await User.findById(userId).select('name');
                await sendSalesPersonNotification(
                    salesPersonDetails.email,
                    {
                        jobName: savedJob.jobName,
                        jobTitle: savedJob.jobTitle,
                        department: savedJob.department,
                        salesPersonName: salesPersonDetails.name,
                        creatorName: creator.name
                    }
                );
            } catch (emailError) {
                console.error('Failed to send salesperson notification:', emailError);
            }
        }

        // Send notifications to assigned recruiters
        if (finalAssignedRecruiters && finalAssignedRecruiters.length > 0) {
            try {
                const creator = await User.findById(userId).select('name');
                const recruiters = await User.find({ 
                    _id: { $in: finalAssignedRecruiters } 
                }).select('email username');
                
                for (const recruiter of recruiters) {
                    await sendRecruiterAssignmentEmail(
                        recruiter.email,
                        {
                            jobName: savedJob.jobName,
                            jobTitle: savedJob.jobTitle,
                            department: savedJob.department,
                            experience: savedJob.experience,
                            recruiterName: recruiter.username || recruiter.email,
                            creatorName: creator.name,
                            jobDescription: savedJob.jobDesc
                        }
                    );
                }
            } catch (emailError) {
                console.error('Failed to send recruiter assignment notifications:', emailError);
            }
        }

        res.status(201).json({
            message: 'Job created successfully',
            job: responseJob
        });

    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ error: 'Failed to create job', details: error.message });
    }
};

// Get all jobs for tenant
// const getAllJobs = async (req, res) => {
//     try {
//         const { status } = req.query;
//         const { tenantId, _id: userId } = req.user; // Get user ID from request
        
//         const filter = { tenantId, userId }; // Add userId to filter
//         if (status) filter.status = status;
        
//         const jobs = await Job.find(filter)
//             .populate({
//                 path: 'jobFormId',
//                 populate: [
//                     { path: 'locations', select: 'name' },
//                     { path: 'salesPerson', select: 'name email' }
//                 ]
//             })
//             .sort({ createdAt: -1 });

//         res.status(200).json({
//             message: 'Jobs fetched successfully',
//             jobs: jobs || []
//         });
//     } catch (error) {
//         console.error('Error fetching jobs:', error);
//         res.status(500).json({ error: 'Failed to fetch jobs' });
//     }
// };


const getAllJobs = async (req, res) => {
    try {
        const { status } = req.query;
        const { tenantId, _id: userId, role } = req.user;

        // Base filter (always apply tenantId)
        const filter = { tenantId };

        // Recruiters can only see their own jobs
        if (role === 'recruiter') {
            filter.userId = userId; // Only show recruiter's jobs
        }
        // Admins see all jobs (no userId filter)

        if (status) filter.status = status; // Optional status filter

        const jobs = await Job.find(filter)
            .populate({
                path: 'jobFormId',
                populate: [
                    { path: 'locations', select: 'name' },
                    { path: 'salesPerson', select: 'name email' },
                    { path: 'Client', select: 'name' }
                ]
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Jobs fetched successfully',
            jobs: jobs || []
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};


// Get job by ID with tenant check
const getJobDetailById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const { tenantId } = req.user;

        const job = await Job.findOne({ 
            _id: jobId,
            tenantId 
        })
        .populate({
            path: 'jobFormId',
            populate: [
                { path: 'locations', select: 'name' },
                { path: 'salesPerson', select: 'name email' },
                { path: 'Client', select: 'name' }
            ]
        });

        if (!job) {
            return res.status(404).json({ error: 'Job not found or not accessible' });
        }

        res.status(200).json({
            message: 'Job fetched successfully',
            job
        });
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ error: 'Failed to fetch job' });
    }
};

// Update job status
const changeJobStatusById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const { status, statusReason } = req.body;
        const { tenantId } = req.user;

        const validStatuses = ['Active', 'On Hold', 'Closed Own', 'Closed Lost', 'Archived'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const updatedJob = await Job.findOneAndUpdate(
            { _id: jobId, tenantId },
            { status, statusReason: statusReason || '' },
            { new: true }
        )
        .populate({
            path: 'jobFormId',
            populate: [
                { path: 'locations', select: 'name' },
                { path: 'salesPerson', select: 'name email' }
            ]
        });

        if (!updatedJob) {
            return res.status(404).json({ error: 'Job not found or not accessible' });
        }

        res.status(200).json({
            message: 'Job status updated successfully',
            job: updatedJob
        });
    } catch (error) {
        console.error('Error updating job status:', error);
        res.status(500).json({ error: 'Failed to update job status' });
    }
};

// Update job details
const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const { assignedRecruiters } = req.body;

        const job = await Job.findOne({ 
            _id: id,
            tenantId 
        }).populate('jobFormId');

        if (!job) {
            return res.status(404).json({ error: "Job not found or not accessible" });
        }

        // Verify assigned recruiters belong to the tenant
        if (assignedRecruiters && assignedRecruiters.length > 0) {
            const existingRecruiters = await User.find({ 
                _id: { $in: assignedRecruiters },
                tenantId,
                role: 'recruiter'
            });
            
            if (existingRecruiters.length !== assignedRecruiters.length) {
                return res.status(400).json({ error: "Invalid recruiters or recruiters not belonging to your tenant" });
            }
        }

        // Update basic job info
        const { jobTitle, department, experience, jobDesc } = req.body;
        if (jobTitle) job.jobTitle = jobTitle;
        if (department) job.department = department;
        if (experience) job.experience = experience;
        if (jobDesc) job.jobDesc = jobDesc;
        if (assignedRecruiters) job.assignedRecruiters = assignedRecruiters;

        // Update job form
        const {
            jobType, locations, openings, targetHireDate, currency,
            amount, allowReapply, reapplyDate, markPriority, hiringFlow,
            BusinessUnit, Client, salesPerson, recruitingPerson
        } = req.body;

        if (BusinessUnit === 'external' && !Client) {
            return res.status(400).json({ error: "Client is required for external business unit" });
        }

        const jobFormData = await JobForm.findOne({
            _id: job.jobFormId,
            tenantId
        });
        
        if (!jobFormData) {
            return res.status(404).json({ error: "Job form not found or not accessible" });
        }

        const previousSalesPerson = jobFormData.salesPerson;
        
        // Update job form fields
        jobFormData.jobType = jobType ?? jobFormData.jobType;
        jobFormData.locations = locations ?? jobFormData.locations;
        jobFormData.openings = openings ?? jobFormData.openings;
        jobFormData.targetHireDate = targetHireDate ?? jobFormData.targetHireDate;
        jobFormData.currency = currency ?? jobFormData.currency;
        jobFormData.amount = amount ?? jobFormData.amount;
        jobFormData.allowReapply = allowReapply ?? jobFormData.allowReapply;
        jobFormData.reapplyDate = reapplyDate ?? jobFormData.reapplyDate;
        jobFormData.markPriority = markPriority ?? jobFormData.markPriority;
        jobFormData.hiringFlow = hiringFlow ?? jobFormData.hiringFlow;
        jobFormData.BusinessUnit = BusinessUnit ?? jobFormData.BusinessUnit;
        jobFormData.Client = BusinessUnit === 'external' ? Client : undefined;
        jobFormData.salesPerson = salesPerson ?? jobFormData.salesPerson;
        jobFormData.recruitingPerson = Array.isArray(recruitingPerson) ? 
            recruitingPerson : [recruitingPerson] ?? jobFormData.recruitingPerson;

        await jobFormData.save();

        // Send notification if salesperson changed
        if (salesPerson && salesPerson !== previousSalesPerson && BusinessUnit === 'external') {
            try {
                const salesPersonUser = await Employee.findOne({
                    _id: salesPerson,
                    tenantId
                });
                
                if (salesPersonUser?.email) {
                    await sendSalesPersonNotification(
                        salesPersonUser.email,
                        {
                            jobName: job.jobName,
                            jobTitle: job.jobTitle,
                            department: job.department,
                            salesPersonName: salesPersonUser.name,
                            creatorName: req.user.name
                        }
                    );
                }
            } catch (emailError) {
                console.error('Failed to send salesperson notification:', emailError);
            }
        }

        // Send notifications to newly assigned recruiters
        if (assignedRecruiters && assignedRecruiters.length > 0) {
            try {
                const creator = await User.findById(req.user._id).select('name');
                const recruiters = await User.find({ 
                    _id: { $in: assignedRecruiters } 
                }).select('email username');
                
                for (const recruiter of recruiters) {
                    await sendRecruiterAssignmentEmail(
                        recruiter.email,
                        {
                            jobName: job.jobName,
                            jobTitle: job.jobTitle,
                            department: job.department,
                            experience: job.experience,
                            recruiterName: recruiter.username,
                            creatorName: creator.name,
                            jobDescription: job.jobDesc
                        }
                    );
                }
            } catch (emailError) {
                console.error('Failed to send recruiter assignment notifications:', emailError);
            }
        }

        await job.save();

        // Populate the updated data
        const populatedJob = await Job.findById(job._id)
            .populate({
                path: 'jobFormId',
                populate: [
                    { path: 'locations', select: 'name' },
                    { path: 'salesPerson', select: 'name email' }
                ]
            });

        return res.status(200).json({
            message: 'Job updated successfully',
            job: populatedJob
        });

    } catch (error) {
        console.error('Error updating job:', error);
        return res.status(500).json({ error: 'Failed to update job' });
    }
};

// Delete job
const deleteJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const { tenantId } = req.user;

        const job = await Job.findOneAndDelete({ 
            _id: jobId,
            tenantId 
        });
        
        if (!job) {
            return res.status(404).json({ error: "Job not found or not accessible" });
        }

        // Delete associated job form
        await JobForm.findOneAndDelete({
            _id: job.jobFormId,
            tenantId
        });

        return res.status(200).json({
            message: "Job deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting job:", error);
        return res.status(500).json({
            error: "Failed to delete job",
        });
    }
};

// Get jobs by status
const getAllJobsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const { tenantId } = req.user;

        const jobs = await Job.find({ 
            status: status,
            tenantId 
        })
        .populate({
            path: 'jobFormId',
            populate: [
                { path: 'locations', select: 'name' },
                { path: 'salesPerson', select: 'name email' }
            ]
        });

        res.status(200).json({
            message: 'Jobs fetched successfully',
            jobs: jobs || []
        });
    } catch (error) {
        console.error('Error fetching jobs by status:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

const deleteJobById = async(req, res) => {
  const jobId = req.params.id;
  const deletedJob = await Job.findByIdAndDelete(jobId);
  if(!deletedJob) {
      return res.status(400).json({
          success: false,
          message: `Job not found with this ${jobId} not found`
      });
  }
  return res.status(200).json({
      success: true,
      message: "Job Deleted Successfully"
  });
}; 

module.exports = {
    getJobTemplates,
    postJob,
    getAllJobs,
    getJobDetailById,
    changeJobStatusById,
    getAllJobsByStatus,
    updateJob,
    deleteJob,
    deleteJobById
};