// routes/setupRoutes.js
const express = require('express');
const router = express.Router();
const Stage = require('../models/Stages');
const { stages } = require('../utils/stages');

// One-time setup endpoint (run manually once)
router.post('/setup-stages', async (req, res) => {
  try {
    // Delete existing stages
    await Stage.deleteMany({});
    
    // Create new stages in order
    const createdStages = await Promise.all(
      stages.map((name, index) => 
        Stage.create({
          name,
          order: index + 1,
          rejectionTypes: name === 'Rejected' 
            ? ["R1 Rejected", "R2 Rejected", "Client Rejected"]
            : []
        })
      )
    );
    
    res.json({
      message: 'Stages initialized successfully',
      stages: createdStages
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Failed to initialize stages' });
  }
});

module.exports = router;