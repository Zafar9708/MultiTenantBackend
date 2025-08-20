// const mongoose = require('mongoose');

// const locationSchema = new mongoose.Schema({
//   name: { 
//     type: String, 
//     required: true,
//     unique: true,
//     trim: true
//   },
//   isCustom: {
//     type: Boolean,
//     default: false
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// locationSchema.statics.initializeDefaults = async function() {
//   const defaultLocations = [
//     'Pune',
//     'Mumbai',
//     'Bangalore',
//     'Delhi',
//     'Hyderabad',
//     'Remote'
//   ];
  
//   for (const loc of defaultLocations) {
//     await this.findOneAndUpdate(
//       { name: loc },
//       { $setOnInsert: { name: loc, isCustom: false } },
//       { upsert: true, new: true }
//     );
//   }
// };

// module.exports = mongoose.model('Location', locationSchema);


// models/Location.js
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
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

// Remove unique index on name since names can be same across tenants
locationSchema.index({ name: 1, tenantId: 1 }, { unique: true });

locationSchema.statics.initializeDefaults = async function(tenantId) {
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
      { name: loc, tenantId },
      { $setOnInsert: { name: loc, isCustom: false, tenantId } },
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('Location', locationSchema);