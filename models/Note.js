const mongoose = require('mongoose')

const NoteSchema = mongoose.Schema({
    Candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true
    },
    note: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }); 

module.exports = mongoose.model('CandidateNote', NoteSchema); 