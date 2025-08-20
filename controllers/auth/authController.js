const User = require('../../models/User');
const Tenant=require('../../models/Tenant')
const AppError = require('../../utils/appError');
const jwt = require('jsonwebtoken');

exports.initializeSystem = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('Initialization request received:', { email });

    const existingSuperadmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperadmin) {
      console.log('System already initialized with:', existingSuperadmin.email);
      return next(new AppError('System already initialized', 400));
    }

    console.log('Creating superadmin...');
    const superadmin = await User.create({
      username: 'superadmin',
      email: email.toLowerCase(),
      password,
      role: 'superadmin',
      isActive: true
    });
    console.log('Superadmin created:', superadmin._id);

    console.log('Generating token...');
    const token = jwt.sign(
      { id: superadmin._id }, 
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    console.log('Initialization successful');
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: superadmin._id,
          email: superadmin.email,
          role: superadmin.role
        }
      }
    });

  } catch (err) {
    console.error('Initialization error:', err);
    next(new AppError('System initialization failed', 500));
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password +tenantId');
    
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId
        }
      }
    });
  } catch (err) {
    next(new AppError('Login failed', 500));
  }
};

// Add this to your authController.js
exports.getUserDetails = async (req, res, next) => {
  try {
    // The user is already available in req.user from the protect middleware
    const user = await User.findById(req.user.id).select('-password -__v');
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    next(new AppError('Failed to fetch user details', 500));
  }
};





