// const Location=require('../models/Location');
// const AppError = require('../utils/appError');


// exports.getAllLocations = async (req, res,next) => {
//   try {
//     const locations = await Location.find().sort({ name: 1 });
//     res.status(200).json({
//       success: true,
//       data: locations
//     });
//   } catch (err) {
//     return next(new AppError('Failed to fetch Locations'))
//   }
// };

// exports.createLocation = async (req, res,next) => {
//   try {
//     const { name } = req.body;
    
//     if (!name || !name.trim()) {
//       return next(new AppError('Location not found'))
//     }
//     const existingLocation = await Location.findOne({ 
//       name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
//     });
    
//     if (existingLocation) {
//       return next(new AppError('Location Already Exists'))
//     }
//     const newLocation = new Location({
//       name: name.trim(),
//       isCustom: true
//     });
    
//     await newLocation.save();
    
//     res.status(201).json({
//       success: true,
//       data: newLocation,
//       message: 'Location added successfully'
//     });
//   } catch (err) {
//     return next(new AppError('Failed to add Location',500))
//   }
// };


// controllers/locationController.js
const Location = require('../models/Location');
const AppError = require('../utils/appError');

exports.getAllLocations = async (req, res, next) => {
  try {
    const locations = await Location.find({ tenantId: req.user.tenantId }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: locations
    });
  } catch (err) {
    return next(new AppError('Failed to fetch Locations', 500));
  }
};

exports.createLocation = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { tenantId } = req.user;

    if (!name || !name.trim()) {
      return next(new AppError('Location name is required', 400));
    }

    const existingLocation = await Location.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      tenantId
    });

    if (existingLocation) {
      return next(new AppError('Location already exists', 400));
    }

    const newLocation = new Location({
      name: name.trim(),
      tenantId,
      isCustom: true
    });

    await newLocation.save();

    res.status(201).json({
      success: true,
      data: newLocation,
      message: 'Location added successfully'
    });
  } catch (err) {
    console.error("Error creating location:", err);   // 👈 log real error
    return next(new AppError(err.message || 'Failed to add Location', 500));
  }
};
