const Candidate = require('../models/Candidate');
const Stage = require('../models/Stages');
const mongoose = require('mongoose');

const moveCandidateStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, comment, rejectionType, rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(stage)) {
      return res.status(400).json({ error: 'Invalid stage ID format' });
    }

    const stageExists = await Stage.findById(stage);
    if (!stageExists) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid candidate ID format' });
    }

    const candidate = await Candidate.findById(id).populate('stage');
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (candidate.stage && candidate.stage._id.toString() === stage) {
      return res.status(400).json({ error: 'Candidate is already in this stage' });
    }

    candidate.stage = stage;
    if (stageExists.name === 'Rejected') {
      candidate.rejectionType = rejectionType;
      candidate.rejectionReason = rejectionReason || '';
    } else {
      candidate.rejectionType = undefined;
      candidate.rejectionReason = undefined;
    }

    if (comment) {
      candidate.comments = candidate.comments || [];
      candidate.comments.push({
        text: comment,
        stageChangedFrom: candidate.stage?.name || 'Unknown',
        stageChangedTo: stageExists.name,
        changedAt: new Date()
      });
    }

    await candidate.save();

    const updatedCandidate = await Candidate.findById(id)
      .populate('stage')
      .populate('owner', 'name email')
      .populate('jobId', 'title');

    res.json({
      message: 'Candidate stage updated successfully',
      candidate: updatedCandidate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update candidate stage' });
  }
};

module.exports = {
  moveCandidateStage
};