const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+tenantId');

    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    next(new AppError('Not authorized to access this route', 401));
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`User role ${req.user.role} is not authorized`, 403));
    }
    next();
  };
};

exports.tenantRestriction = (req, res, next) => {
  if (req.user.role === 'superadmin') return next();
  
  if (!req.user.tenantId) {
    return next(new AppError('Tenant ID is required', 400));
  }
  
  req.query.tenantId = req.user.tenantId;
  if (req.body && !req.body.tenantId) {
    req.body.tenantId = req.user.tenantId;
  }
  
  next();
};