const { Types } = require('mongoose');
const mongoose=require('mongoose')
const OfflineInterview = require('../models/Offline');
const Interviewer = require('../models/Interviewer');
const EmailTemplate = require('../models/EmailTemplate');
const Feedback = require('../models/Feedback');
const { sendInterviewEmail } = require('../services/emailService');

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const scheduleInterview = async (req, res) => {
    try {
        const {
            candidate,
            interviewerIds,
            date,
            startTime,
            duration,
            timezone,
            location,
            round,
            templateId,
            notes,
            scheduledBy,
            jobId
        } = req.body;

        console.log("Received request body:", JSON.stringify(req.body, null, 2));

        const tenantId = req.user.tenantId;

        // Validation
        if (!candidate || !candidate.id || !candidate.name || !candidate.email || 
            !interviewerIds || !date || !startTime || !duration || 
            !timezone || !location || !location.address || !location.building || !location.floor || 
            !round || !templateId || !scheduledBy) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
                missingFields: {
                    candidate: !candidate ? 'missing' : (!candidate.id ? 'id' : (!candidate.name ? 'name' : (!candidate.email ? 'email' : 'ok'))),
                    interviewerIds: !interviewerIds ? 'missing' : 'ok',
                    date: !date ? 'missing' : 'ok',
                    startTime: !startTime ? 'missing' : 'ok',
                    duration: !duration ? 'missing' : 'ok',
                    timezone: !timezone ? 'missing' : 'ok',
                    location: !location ? 'missing' : (!location.address ? 'address' : (!location.building ? 'building' : (!location.floor ? 'floor' : 'ok'))),
                    round: !round ? 'missing' : 'ok',
                    templateId: !templateId ? 'missing' : 'ok',
                    scheduledBy: !scheduledBy ? 'missing' : 'ok'
                }
            });
        }

        // Validate ObjectIds
        if (!Array.isArray(interviewerIds) || interviewerIds.some(id => !isValidObjectId(id)) || 
            !isValidObjectId(templateId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format'
            });
        }

        // REMOVED TENANT VALIDATION FOR INTERVIEWERS
        // Verify interviewers exist (regardless of tenant)
        const interviewers = await Interviewer.find({ 
            _id: { $in: interviewerIds }
        });

        if (interviewers.length !== interviewerIds.length) {
            const foundIds = interviewers.map(i => i._id.toString());
            const missingIds = interviewerIds.filter(id => !foundIds.includes(id));
            
            return res.status(400).json({
                success: false,
                message: 'One or more interviewers not found',
                missingInterviewerIds: missingIds
            });
        }

        // REMOVED TENANT VALIDATION FOR TEMPLATES TOO
        // Verify template exists (regardless of tenant)
        const template = await EmailTemplate.findOne({
            _id: templateId
        });
        
        if (!template) {
            return res.status(400).json({
                success: false,
                message: 'Email template not found'
            });
        }

        // Format the email body
        const formattedDate = new Date(date).toLocaleDateString();
        let emailBody = template.body
            .replace(/{candidate}/g, candidate.name)
            .replace(/{date}/g, formattedDate)
            .replace(/{time}/g, startTime)
            .replace(/{duration}/g, duration)
            .replace(/{timezone}/g, timezone)
            .replace(/{location}/g, `${location.building}, ${location.address}, Floor ${location.floor}${location.room ? ', Room ' + location.room : ''}`)
            .replace(/{round}/g, round)
            .replace(/Best regards,[\s\S]*?(Tech Team|Interview Team|HR Team)/g, '');

        // Create the interview record
        const interview = new OfflineInterview({
            tenantId,
            candidate: {
                id: candidate.id,
                name: candidate.name,
                email: candidate.email
            },
            interviewers: interviewerIds,
            date: new Date(date),
            startTime,
            duration: parseInt(duration),
            timezone,
            location,
            round,
            templateUsed: templateId,
            subject: template.subject,
            emailBody,
            notes,
            scheduledBy,
            jobId
        });

        await interview.save();

        // Send emails
        try {
            const feedbackLinks = interviewers.map(interviewer => ({
                interviewerId: interviewer._id,
                feedbackLink: `${process.env.FRONTEND_URL}/feedback/${interview._id}/${interviewer._id}`
            }));

            const emailPromises = [
                sendInterviewEmail(
                    candidate.email,
                    template.subject,
                    emailBody,
                    null,
                    'N/A', 
                    candidate.name, 
                    'offline',
                    location
                ),
                ...interviewers.map(interviewer => {
                    const feedbackLink = feedbackLinks.find(link => 
                        link.interviewerId.toString() === interviewer._id.toString()
                    ).feedbackLink;
                    
                    return sendInterviewEmail(
                        interviewer.email,
                        template.subject,
                        emailBody.replace(/{interviewer}/g, interviewer.name),
                        null,
                        feedbackLink,
                        interviewer.name,
                        'offline',
                        location
                    );
                })
            ];

            await Promise.all(emailPromises);
            console.log('All offline interview emails sent successfully');
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Don't fail the request if email sending fails
        }

        res.status(201).json({
            success: true,
            data: interview,
            message: 'Offline interview scheduled successfully'
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

const getScheduledInterviews = async (req, res) => {
    try {
        const tenantId = req.user.tenantId
        const { status, round, dateFrom, dateTo } = req.query;
        
        let query = { tenantId };

        if (status) {
            query.status = status;
        }

        if (round) {
            query.round = round;
        }

        if (dateFrom || dateTo) {
            query.date = {};
            if (dateFrom) query.date.$gte = new Date(dateFrom);
            if (dateTo) query.date.$lte = new Date(dateTo);
        }

        const interviews = await OfflineInterview.find(query)
            .populate('interviewers', 'name email')
            .populate('templateUsed', 'name')
            .populate('jobId', 'jobName jobTitle')
            .sort({ date: -1, startTime: -1 });

        // Add feedback status for each interview
        const interviewsWithFeedback = await Promise.all(
            interviews.map(async interview => {
                const feedbacks = await Feedback.find({ 
                    interviewId: interview._id,
                    interviewType: 'offline'
                });
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
        console.error('Error fetching offline interviews:', error);
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
        // const tenantId = req.tenant._id;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid interview ID format'
            });
        }

        const interview = await OfflineInterview.findOne({
            _id: id,
            // tenantId: tenantId
        })
        .populate('interviewers', 'name email')
        .populate('templateUsed', 'name subject')
        .populate('jobId', 'jobName jobTitle');

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: 'Offline interview not found'
            });
        }

        // Get feedback for this interview
        const feedbacks = await Feedback.find({ 
            interviewId: id,
            interviewType: 'offline'
        }).populate('interviewerId', 'name email');

        res.status(200).json({
            success: true,
            data: {
                ...interview.toObject(),
                feedbacks
            }
        });
    } catch (error) {
        console.error('Error fetching offline interview:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getUpcomingInterviews = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const interviews = await OfflineInterview.find({ 
            tenantId,
            date: { $gte: today },
            status: 'scheduled'
        })
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
        console.error('Error fetching upcoming offline interviews:', error);
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
        const tenantId = req.tenant._id;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid interview ID format'
            });
        }

        const validStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const interview = await OfflineInterview.findOneAndUpdate(
            { _id: id, tenantId },
            { status, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: 'Offline interview not found'
            });
        }

        res.status(200).json({
            success: true,
            data: interview,
            message: 'Offline interview status updated successfully'
        });
    } catch (error) {
        console.error('Error updating offline interview status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getLocations = (req, res) => {
    // You can store predefined locations or fetch from database
    const locations = [
        { id: 'main-office', name: 'Main Office', address: '123 Tech Park', building: 'Tech Tower', floors: ['1', '2', '3'] },
        { id: 'branch-office', name: 'Branch Office', address: '456 Innovation Road', building: 'Innovation Hub', floors: ['G', '1', '2'] }
    ];
    res.json(locations);
};

const getRounds = (req, res) => {
    const rounds = [
        { value: 'ROUND1', label: 'Technical Round 1' },
        { value: 'ROUND2', label: 'Technical Round 2' },
        { value: 'ROUND3', label: 'Technical Round 3' },
        { value: 'HR_ROUND', label: 'HR Round' },
        { value: 'FINAL_ROUND', label: 'Final Round' }
    ];
    res.json(rounds);
};

module.exports = {
    scheduleInterview,
    getScheduledInterviews,
    getInterviewById,
    getUpcomingInterviews,
    updateInterviewStatus,
    getLocations,
    getRounds
};