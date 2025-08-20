const Job = require('../models/Job');
const Note = require('../models/Notes');

exports.createNote = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { content } = req.body;

        const job = await Job.findOne({ _id: jobId, tenantId: req.user.tenantId });
        if (!job) {
            return res.status(404).json({ message: 'Job not found or unauthorized access' });
        }

        const newNote = await Note.create({
            jobId,
            content,
            createdBy: req.user._id,
            tenantId: req.user.tenantId
        });

        const populatedNote = await newNote.populate('createdBy', 'username email');

        res.status(201).json({
            message: 'Note created successfully',
            note: populatedNote
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getNotesByJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findOne({ _id: jobId, tenantId: req.user.tenantId });
        if (!job) {
            return res.status(404).json({ message: 'Job not found or unauthorized access' });
        }

        const notes = await Note.find({ 
            jobId, 
            tenantId: req.user.tenantId 
        })
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Notes fetched successfully',
            notes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        const { content } = req.body;

        const note = await Note.findOne({ 
            _id: noteId, 
            tenantId: req.user.tenantId 
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found or unauthorized access' });
        }

        if (!note.createdBy.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        note.content = content;
        await note.save();

        const updatedNote = await note.populate('createdBy', 'username email');

        res.status(200).json({
            message: 'Note updated successfully',
            note: updatedNote
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const { noteId } = req.params;

        const note = await Note.findOne({ 
            _id: noteId, 
            tenantId: req.user.tenantId 
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found or unauthorized access' });
        }

        if (!note.createdBy.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Note.findByIdAndDelete(noteId);

        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};