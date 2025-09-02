const mongoose = require('mongoose');

const offlineInterviewSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
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
    location: {
        address: { type: String, required: true },
        building: { type: String, required: true },
        floor: { type: String, required: true },
        room: { type: String }
    },
    round: {
        type: String,
        enum: ['ROUND1', 'ROUND2', 'ROUND3', 'HR_ROUND', 'FINAL_ROUND'],
        required: true
    },
    templateUsed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailTemplate',
        required: true
    },
    subject: { type: String, required: true },
    emailBody: { type: String, required: true },
    notes: { type: String },
    scheduledBy: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled' 
    },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

offlineInterviewSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('OfflineInterview', offlineInterviewSchema);