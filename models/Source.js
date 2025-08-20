const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
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

sourceSchema.index({ name: 1, tenantId: 1 }, { unique: true });

// Initialize default sources for a tenant
sourceSchema.statics.initializeDefaults = async function(tenantId) {
  const defaultSources = [
    'LinkedIn',
    'Naukri',
    'Indeed',
    'Referral',
    'Career Site'
  ];
  
  for (const source of defaultSources) {
    await this.findOneAndUpdate(
      { name: source, tenantId },
      { $setOnInsert: { name: source, isCustom: false, tenantId } },
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('Source', sourceSchema);