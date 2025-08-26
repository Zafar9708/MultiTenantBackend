const mongoose = require('mongoose');

const interviewerSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Interviewer name is required'] 
    },

    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    phone: { 
        type: String,
        match: [/^[0-9]{10}$/, 'Please fill a valid phone number']
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Interviewer', interviewerSchema);