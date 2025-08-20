const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

locationSchema.statics.initializeDefaults = async function() {
  const defaultLocations = [
    'Pune',
    'Mumbai',
    'Bangalore',
    'Delhi',
    'Hyderabad',
    'Remote'
  ];
  
  for (const loc of defaultLocations) {
    await this.findOneAndUpdate(
      { name: loc },
      { $setOnInsert: { name: loc, isCustom: false } },
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('Location', locationSchema);