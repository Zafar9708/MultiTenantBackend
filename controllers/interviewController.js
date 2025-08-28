const { Types } = require('mongoose');
const Interview = require('../models/Interview');
const Interviewer = require('../models/Interviewer');
const EmailTemplate = require('../models/EmailTemplate');
const Feedback = require('../models/Feedback');
const Job = require('../models/Job');
const { createGoogleMeet } = require('../services/googleMeetService');
const { createZoomMeeting } = require('../services/zoomService');
const { createTeamsMeeting } = require('../services/teamsService');
const { sendInterviewEmail, sendFeedbackEmail } = require('../services/emailService');

const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  
  // Check if it's a valid 24-character hex string
  return id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
};

const scheduleInterview = async (req, res) => {
    console.log("Schedule Interview Called")
    try {
        const {
            candidate,
            interviewerIds,
            date,
            startTime,
            duration,
            timezone,
            platform,
            templateId,
            notes,
            jobId
        } = req.body;

        const scheduledBy = req.user.id;
        const tenantId = req.user.tenantId;

        // Debug logging
        console.log('=== DEBUG INFO ===');
        console.log('interviewerIds:', interviewerIds, 'Type:', typeof interviewerIds);
        console.log('templateId:', templateId, 'Type:', typeof templateId);
        console.log('isValidObjectId(templateId):', isValidObjectId(templateId));

        if (Array.isArray(interviewerIds)) {
            interviewerIds.forEach((id, index) => {
                console.log(`interviewerIds[${index}]:`, id, 'Valid:', isValidObjectId(id));
            });
        }
        console.log('=== END DEBUG ===');

        // Validate required fields
        if (!candidate || !interviewerIds || !date || !startTime || !duration || 
            !timezone || !platform || !templateId) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if interviewerIds is an array and not empty
        if (!Array.isArray(interviewerIds)) {
            return res.status(400).json({
                success: false,
                message: 'interviewerIds must be an array'
            });
        }

        if (interviewerIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one interviewer is required'
            });
        }

        // Check each interviewer ID
        const invalidInterviewerIds = interviewerIds.filter(id => !isValidObjectId(id));
        if (invalidInterviewerIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid interviewer ID format',
                invalidIds: invalidInterviewerIds
            });
        }

        // Check template ID
        if (!isValidObjectId(templateId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid template ID format',
                templateId: templateId
            });
        }

        // Verify interviewers belong to the same tenant
        const interviewers = await Interviewer.find({ 
            _id: { $in: interviewerIds },
            
        });

        if (interviewers.length !== interviewerIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more interviewers not found or not in your tenant'
            });
        }

        const template = await EmailTemplate.findOne({
            _id: templateId,
           
        });
        
        if (!template) {
            return res.status(400).json({
                success: false,
                message: 'Email template not found'
            });
        }

        let meetingLink;
        try {
            const meetingDetails = {
                ...req.body,
                interviewers,
                subject: template.subject
            };

            switch (platform.toLowerCase()) {
                case 'google_meet':
                case 'google meet':
                    meetingLink = await createGoogleMeet(meetingDetails);
                    break;
                case 'zoom':
                    meetingLink = await createZoomMeeting(meetingDetails);
                    break;
                case 'microsoft_teams':
                case 'microsoft teams':
                    meetingLink = await createTeamsMeeting(meetingDetails);
                    break;
                default:
                    meetingLink = null;
            }
        } catch (error) {
            console.error('Meeting creation error:', error);
            return res.status(500).json({
                success: false,
                message: `Failed to create ${platform} meeting`,
                error: error.message
            });
        }

        const formattedDate = new Date(date).toLocaleDateString();
        let emailBody = template.body
        .replace(/{candidate}/g, candidate.name)
        .replace(/{date}/g, formattedDate)
        .replace(/{time}/g, startTime)
        .replace(/{duration}/g, duration)
        .replace(/{timezone}/g, timezone)
        .replace(/{platform}/g, platform)
        .replace(/Meeting Link: [^\n]*\n?/g, '')
        .replace(/Best regards,[\s\S]*?(Tech Team|Interview Team|HR Team)/g, '');

        const interview = new Interview({
            candidate,
            interviewers: interviewerIds,
            date,
            startTime,
            duration,
            timezone,
            platform,
            meetingLink,
            templateUsed: templateId,
            subject: template.subject,
            emailBody,
            notes,
            scheduledBy,
            tenantId,
            jobId
        });

        await interview.save();

        try {
            const feedbackLinks = interviewers.map(interviewer => ({
                interviewerId: interviewer._id,
                feedbackLink: `${process.env.FRONTEND_URL}/feedback/${interview._id}/${interviewer._id}`
            }));

            console.log('Generated feedback links:', feedbackLinks);

            const emailPromises = [
                sendInterviewEmail(
                    candidate.email,
                    template.subject,
                    emailBody,
                    meetingLink,
                    'N/A', 
                    candidate.name, 
                    'technical' 
                ),
                ...interviewers.map(interviewer => {
                    const feedbackLink = feedbackLinks.find(link => 
                        link.interviewerId.toString() === interviewer._id.toString()
                    ).feedbackLink;
                    
                    return sendInterviewEmail(
                        interviewer.email,
                        template.subject,
                        emailBody.replace(/{interviewer}/g, interviewer.name),
                        meetingLink,
                        feedbackLink,
                        interviewer.name,
                        'technical' 
                    );
                })
            ];

            await Promise.all(emailPromises);
            console.log('All emails sent successfully');
        } catch (emailError) {
            console.error('Email sending error:', emailError);
        }

        res.status(201).json({
            success: true,
            data: interview,
            message: 'Interview scheduled successfully'
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getTimezones = (req, res) => {
    const timezones = require('../utils/timezone');
    res.json(timezones);
};

const getDurations = (req, res) => {
    const durations = require('../utils/durations');
    res.json(durations);
};

const getAllInterviews = async (req, res) => {
    try {
        const { jobName, status } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;
        const tenantId = req.user.tenantId;

        let query = { tenantId };

        // Regular users can only see their own interviews
        if (userRole === 'recruiter') {
            query.scheduledBy = userId;
        }

        // Admins can see all interviews in their tenant
        if (userRole === 'admin') {
            // No additional filter needed - can see all interviews in tenant
        }

        // Superadmin can see everything (no tenant filter)
        if (userRole === 'superadmin') {
            query = {};
        }

        if (jobName) {
            const matchingJobs = await Job.find({ 
                title: { $regex: jobName, $options: 'i' },
                tenantId: userRole === 'superadmin' ? undefined : tenantId
            }, '_id');
            
            const jobIds = matchingJobs.map(job => job._id);
            query.jobId = { $in: jobIds };
        }

        if (status) {
            query.status = status;
        }

        const interviews = await Interview.find(query)
            .populate('interviewers', 'name email')
            .populate('templateUsed', 'name')
            .populate('scheduledBy', 'name email')
            .populate('jobId', 'jobName jobTitle')
            .sort({ date: -1, startTime: -1 });

        // Add feedback status for each interview
        const interviewsWithFeedback = await Promise.all(
            interviews.map(async interview => {
                const feedbacks = await Feedback.find({ interviewId: interview._id });
                return {
                    ...interview.toObject(),
                    feedbackStatus: {
                        submitted: feedbacks.length,
                        total: interview.interviewers.length
                    }
                };
            })
        );

        res.status(200).json({
            success: true,
            count: interviewsWithFeedback.length,
            data: interviewsWithFeedback
        });
    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getInterviewById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        const tenantId = req.user.tenantId;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid interview ID format'
            });
        }

        let query = { _id: id };

        // Add tenant and user restrictions based on role
        if (userRole === 'recruiter') {
            query.tenantId = tenantId;
            query.scheduledBy = userId;
        } else if (userRole === 'admin') {
            query.tenantId = tenantId;
        }
        // Superadmin can access any interview without restrictions

        const interview = await Interview.findOne(query)
            .populate('interviewers', 'name email')
            .populate('templateUsed', 'name subject')
            .populate('scheduledBy', 'name email')
            .populate('jobId', 'jobName jobTitle');

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found or you do not have permission to view it'
            });
        }

        // Get feedback for this interview
        const feedbacks = await Feedback.find({ interviewId: id })
            .populate('interviewerId', 'name email');

        res.status(200).json({
            success: true,
            data: {
                ...interview.toObject(),
                feedbacks
            }
        });
    } catch (error) {
        console.error('Error fetching interview:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getUpcomingInterviews = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const userId = req.user.id;
        const userRole = req.user.role;
        const tenantId = req.user.tenantId;

        let query = { 
            date: { $gte: today },
            status: 'scheduled'
        };

        // Add tenant and user restrictions based on role
        if (userRole === 'recruiter') {
            query.tenantId = tenantId;
            query.scheduledBy = userId;
        } else if (userRole === 'admin') {
            query.tenantId = tenantId;
        }
        // Superadmin can access any interview without restrictions

        const interviews = await Interview.find(query)
            .populate('candidate', 'name email')
            .populate('interviewers', 'name email')
            .populate('jobId', 'jobName jobTitle')
            .sort({ date: 1, startTime: 1 });

        res.status(200).json({
            success: true,
            count: interviews.length,
            data: interviews
        });
    } catch (error) {
        console.error('Error fetching upcoming interviews:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getInterviewFeedback = async (req, res) => {
    try {
        const { interviewId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        const tenantId = req.user.tenantId;

        if (!isValidObjectId(interviewId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid interview ID format'
            });
        }

        // First check if user has access to this interview
        let interviewQuery = { _id: interviewId };

        if (userRole === 'recruiter') {
            interviewQuery.tenantId = tenantId;
            interviewQuery.scheduledBy = userId;
        } else if (userRole === 'admin') {
            interviewQuery.tenantId = tenantId;
        }

        const interview = await Interview.findOne(interviewQuery);
        
        if (!interview) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found or you do not have permission to view feedback'
            });
        }

        const feedbacks = await Feedback.find({ interviewId })
            .populate('interviewerId', 'name email')
            .sort({ submittedAt: -1 });

        res.status(200).json({
            success: true,
            count: feedbacks.length,
            data: feedbacks
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const updateInterviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        const tenantId = req.user.tenantId;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid interview ID format'
            });
        }

        const validStatuses = ['scheduled', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        let query = { _id: id };

        // Add tenant and user restrictions based on role
        if (userRole === 'recruiter') {
            query.tenantId = tenantId;
            query.scheduledBy = userId;
        } else if (userRole === 'admin') {
            query.tenantId = tenantId;
        }

        const interview = await Interview.findOneAndUpdate(
            query,
            { status },
            { new: true, runValidators: true }
        );

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found or you do not have permission to update it'
            });
        }

        res.status(200).json({
            success: true,
            data: interview,
            message: 'Interview status updated successfully'
        });
    } catch (error) {
        console.error('Error updating interview status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// const getAllInterviews = async (req, res) => {
//     try {
//         const { 
//             page = 1, 
//             limit = 10, 
//             status, 
//             jobId, 
//             interviewerId, 
//             candidateName, 
//             dateFrom, 
//             dateTo,
//             sortBy = 'date',
//             sortOrder = 'desc'
//         } = req.query;
        
//         const userId = req.user.id;
//         const userRole = req.user.role;
//         const tenantId = req.user.tenantId;

//         // Build base query
//         let query = {};

//         // Apply tenant and user restrictions based on role
//         if (userRole === 'recruiter') {
//             query.tenantId = tenantId;
//             query.scheduledBy = userId;
//         } else if (userRole === 'admin') {
//             query.tenantId = tenantId;
//         }
//         // Superadmin can see everything (no tenant filter)

//         // Apply filters
//         if (status) {
//             query.status = status;
//         }

//         if (jobId && isValidObjectId(jobId)) {
//             query.jobId = jobId;
//         }

//         if (interviewerId && isValidObjectId(interviewerId)) {
//             query.interviewers = interviewerId;
//         }

//         if (candidateName) {
//             query['candidate.name'] = { $regex: candidateName, $options: 'i' };
//         }

//         if (dateFrom || dateTo) {
//             query.date = {};
//             if (dateFrom) {
//                 query.date.$gte = new Date(dateFrom);
//             }
//             if (dateTo) {
//                 query.date.$lte = new Date(dateTo);
//             }
//         }

//         // Sort configuration
//         const sortOptions = {};
//         sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

//         // Execute query with pagination
//         const interviews = await Interview.find(query)
//             .populate('interviewers', 'name email')
//             .populate('templateUsed', 'name')
//             .populate('scheduledBy', 'name email')
//             .populate('jobId', 'jobName jobTitle')
//             .sort(sortOptions)
//             .limit(limit * 1)
//             .skip((page - 1) * limit);

//         // Get total count for pagination
//         const totalCount = await Interview.countDocuments(query);

//         // Add feedback status for each interview
//         const interviewsWithFeedback = await Promise.all(
//             interviews.map(async interview => {
//                 const feedbacks = await Feedback.find({ interviewId: interview._id });
//                 return {
//                     ...interview.toObject(),
//                     feedbackStatus: {
//                         submitted: feedbacks.length,
//                         total: interview.interviewers.length,
//                         pending: interview.interviewers.length - feedbacks.length
//                     }
//                 };
//             })
//         );

//         res.status(200).json({
//             success: true,
//             data: interviewsWithFeedback,
//             pagination: {
//                 currentPage: parseInt(page),
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalItems: totalCount,
//                 itemsPerPage: parseInt(limit)
//             },
//             filters: {
//                 status,
//                 jobId,
//                 interviewerId,
//                 candidateName,
//                 dateFrom,
//                 dateTo
//             }
//         });

//     } catch (error) {
//         console.error('Error fetching interviews:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: error.message
//         });
//     }
// };

module.exports = {
    scheduleInterview,
    getTimezones,
    getDurations,
    getAllInterviews,
    getInterviewById,
    getUpcomingInterviews,
    getInterviewFeedback,
    updateInterviewStatus,
    
};