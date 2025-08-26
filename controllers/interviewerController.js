const Interviewer = require('../models/Interviewer');

const createInterviewer = async (req, res) => {
    try {
        const interviewer = new Interviewer(req.body);
        await interviewer.save();
        res.status(201).json(interviewer);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getAllInterviewers = async (req, res) => {
    try {
        const interviewers = await Interviewer.find();
        res.json(interviewers);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createInterviewer,
    getAllInterviewers
};