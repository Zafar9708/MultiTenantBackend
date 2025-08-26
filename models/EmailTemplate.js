const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Template name is required'],
        unique: true 
    },
    subject: { 
        type: String, 
        required: [true, 'Email subject is required'] 
    },
    body: { 
        type: String, 
        required: [true, 'Email body is required'] 
    },
    variables: [{ 
        type: String 
    }],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);