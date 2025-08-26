const express = require('express');
const mongoose = require('mongoose');
const AppError = require('../utils/appError');
const Candidate = require('../models/Candidate');
const CandidateNote = require('../models/Note'); // Make sure this path is correct

exports.addCandidateNote = async (req, res, next) => {
    const { candidateId, note } = req.body; // Changed from CandidateNote to note

    if (!candidateId || !note) { // Changed from content to note
        return next(new AppError('Candidate ID and Note content are required', 400));
    }

    try {
        const candidateNote = await CandidateNote.create({ // Fixed variable name
            Candidate: candidateId, // Changed from candidate to Candidate
            note: note, // Changed from CandidateNote to note
            createdAt: new Date()
        });

        // Populate the candidate details for the response
        await candidateNote.populate('Candidate', 'name email');

        res.status(201).json({
            status: 'success',
            data: {
                candidateNote: candidateNote // Fixed variable name
            }
        });
    } catch (err) {
        console.error('Error adding candidate note:', err);
        return next(new AppError('Failed to add candidate note', 500));
    }
}

exports.getCandidateNotesByCandidateId = async (req, res, next) => {
    const { candidateId } = req.params; // Changed from id to candidateId

    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
        return next(new AppError('Invalid candidate ID format', 400));
    }

    try {
        const candidateNotes = await CandidateNote.find({ Candidate: candidateId })
            .populate('Candidate', 'name email')
            .sort({ createdAt: -1 }); 

        if (!candidateNotes || candidateNotes.length === 0) {
            return res.status(404).json({ message: 'No notes found for this candidate' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                candidateNotes // Fixed variable name
            }
        });
    } catch (err) {
        console.error('Error fetching candidate notes:', err);
        return next(new AppError('Failed to fetch candidate notes', 500));
    }
}

exports.deleteCandidateNote = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid note ID format', 400));
    }

    try {
        const candidateNote = await CandidateNote.findByIdAndDelete(id); // Fixed variable name

        if (!candidateNote) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Note deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting note:', err);
        return next(new AppError('Failed to delete note', 500));
    }
}

exports.updateCandidateNote = async (req, res, next) => {
    const { id } = req.params;
    const { note } = req.body; // Changed from content to note

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid note ID format', 400));
    }

    if (!note) { // Changed from content to note
        return next(new AppError('Note content is required to update the note', 400));
    }

    try {
        const updatedCandidateNote = await CandidateNote.findByIdAndUpdate(
            id,
            { note }, // Changed from content to note
            { new: true, runValidators: true }
        ).populate('Candidate', 'name email');

        if (!updatedCandidateNote) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                candidateNote: updatedCandidateNote // Fixed variable name
            }
        });
    } catch (err) {
        console.error('Error updating note:', err);
        return next(new AppError('Failed to update note', 500));
    }
};