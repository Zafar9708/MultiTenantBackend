

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    interviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interview',
        required: true,
        index: true
    },
    interviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interviewer',
        required: true
    },
    candidateId: {
        type: String, 
        required: true
      },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    status: {
        type: String,
        enum: ['Selected', 'Rejected', 'Hold'],
        required: true
    },
    technicalSkills: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    communicationSkills: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    problemSolving: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    culturalFit: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    overallFeedback: {
        type: String,
        required: true,
        trim: true,
        minlength: 10
    },
    additionalComments: {
        type: String,
        trim: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

feedbackSchema.index({ interviewId: 1, interviewerId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);