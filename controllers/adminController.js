const User=require('../models/User')
const Tenant=require('../models/Tenant')
const AppError = require('../utils/appError');


exports.addRecruiter = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const tenantId = req.user.tenantId;

    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters', 400));
    }

    const tenantExists = await Tenant.findById(tenantId);
    if (!tenantExists) {
      return next(new AppError('Invalid tenant specified', 400));
    }

    const recruiter = await User.create({
      username: email.split('@')[0],
      email: email.toLowerCase().trim(),
      password,
      role: 'recruiter',
      tenantId,
      isActive: true
    });

    res.status(201).json({
      status: 'success',
      data: {
        recruiter: {
          id: recruiter._id,
          email: recruiter.email,
          role: recruiter.role
        }
      }
    });

  } catch (err) {
    console.error('Recruiter creation error:', err);
    
    if (err.code === 11000) {
      return next(new AppError('Email already exists', 400));
    }
    
    next(new AppError('Failed to add recruiter', 500));
  }
};

exports.getAllRecruiter=async(req,res,next)=>{
  const recuiter=await User.find({role:"recruiter"})
  if(!recuiter){
   return next (new AppError("No Recuiter Found"),400 )
  }
  return res.status(200).json({
    success:true,
    message:"All Recuiter fetched Successfully",
    recuiter
  })
}

// Update recruiter by ID
exports.updateRecruiter = async (req, res, next) => {
  try {
    const { id } = req.params; 
    const recruiter = await User.findOneAndUpdate(
      { _id: id, role: "recruiter" }, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!recruiter) {
      return next(new AppError("Recruiter not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Recruiter updated successfully",
      recruiter
    });
  } catch (err) {
    next(err);
  }
};

// Delete recruiter by ID
exports.deleteRecruiter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const recruiter = await User.findOneAndDelete({ _id: id, role: "recruiter" });

    if (!recruiter) {
      return next(new AppError("Recruiter not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Recruiter deleted successfully",
      recruiter
    });
  } catch (err) {
    next(err);
  }
};
