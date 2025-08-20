const express = require('express');
const router = express.Router();
const Stage = require('../models/Stages');
const {authorize} = require('../middleware/auth');
const { stages: stageOptions } = require('../utils/stages');

// Get all stages (fixed enum order)
router.get('/', async (req, res) => {
  const stageDocs = await Stage.find().sort({ order: 1 });
  res.json(stageDocs);
});

// Get stage options (enum values)
router.get('/options', (req, res) => {
  res.json(stageOptions);
});

// Get rejection types (with custom added ones)
router.get('/rejection-types', async (req, res) => {
  const rejectedStage = await Stage.findOne({ name: "Rejected" });
  res.json(rejectedStage.rejectionTypes);
});

// Add custom rejection type (admin/recruiter only)
router.post('/rejection-types', 
  authorize('admin', 'recruiter'),
  async (req, res) => {
    try {
      const { type } = req.body;
      
      if (!type) {
        return res.status(400).json({ error: 'Rejection type is required' });
      }

      const stage = await Stage.findOneAndUpdate(
        { name: "Rejected" },
        { $addToSet: { rejectionTypes: type } },
        { new: true }
      );

      res.status(201).json(stage.rejectionTypes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add rejection type' });
    }
});

module.exports = router;