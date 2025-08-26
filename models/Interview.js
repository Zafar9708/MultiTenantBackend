const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    candidate: {
        id: { type: String, required: true },
        name: { type: String, required: true },
        email: { 
            type: String, 
            required: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
        }
    },
    interviewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interviewer',
        required: true,
        validate: {
            validator: function(v) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: props => `${props.value} is not a valid interviewer ID!`
        }
    }],
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    duration: { type: Number, required: true, min: 15, max: 240 },
    timezone: { type: String, required: true },
    platform: { 
        type: String, 
        required: true,
        enum: ['google_meet', 'zoom', 'microsoft_teams', 'other']
    },
    meetingLink: { type: String },
    templateUsed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailTemplate',
        required: true
    },
    subject: { type: String, required: true },
    emailBody: { type: String, required: true },
    notes: { type: String },
    scheduledBy: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    status: { type: String, default: 'scheduled' },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    createdAt: { type: Date, default: Date.now }
});

// Index for better query performance
interviewSchema.index({ tenantId: 1, scheduledBy: 1 });
interviewSchema.index({ date: 1, startTime: 1 });

module.exports = mongoose.model('Interview', interviewSchema);