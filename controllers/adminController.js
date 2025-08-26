


const User = require('../models/User');
const Tenant = require('../models/Tenant');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

exports.addRecruiter = async (req, res, next) => {
  try {
    const { email, password, username, experience, phoneNumber } = req.body;
    const tenantId = req.user.tenantId;

    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase().trim() },
        { username: username.trim() }
      ]
    });
    
    if (existingUser) {
      if (existingUser.email === email.toLowerCase().trim()) {
        return next(new AppError('Email already in use', 400));
      }
      if (existingUser.username === username.trim()) {
        return next(new AppError('Username already in use', 400));
      }
    }

    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters', 400));
    }

    const tenantExists = await Tenant.findById(tenantId);
    if (!tenantExists) {
      return next(new AppError('Invalid tenant specified', 400));
    }

    // Handle profile picture upload
    let profilePicture = null;
    if (req.file) {
      profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
    }

    // Generate a temporary password for first login
    const tempPassword = crypto.randomBytes(8).toString('hex');
    
    const recruiter = await User.create({
      username: username || email.split('@')[0],
      email: email.toLowerCase().trim(),
      password: tempPassword,
      experience: experience || 0,
      phoneNumber: phoneNumber || null,
      profilePicture,
      role: 'recruiter',
      tenantId,
      isActive: true,
      requiresPasswordReset: true
    });

    // Generate login token for first login
    const loginToken = recruiter.createPasswordResetToken();
    await recruiter.save({ validateBeforeSave: false });

    // Create login link
    const loginLink = `${process.env.FRONTEND_URL}/first-login?token=${loginToken}&email=${encodeURIComponent(recruiter.email)}`;

    // Send welcome email with login link
    try {
      await sendEmail({
        email: recruiter.email,
        subject: 'Welcome to HireOnboard - Your Account Details',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #4e54c8; text-align: center;">Welcome to HireOnboard!</h2>
            <p>Hello ${recruiter.username},</p>
            <p>Your recruiter account has been created. Please use the link below to log in for the first time and set up your password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginLink}" style="background-color: #4e54c8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Set Up Your Account
              </a>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">
              This link will expire in 10 minutes. If you didn't request this, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">HireOnboard System</p>
          </div>
        `
      });

      console.log('Welcome email sent to:', recruiter.email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Even if email fails, we still create the user but notify admin
      return res.status(201).json({
        status: 'partial_success',
        message: 'Recruiter created but welcome email failed to send',
        data: {
          recruiter: {
            _id: recruiter._id,
            email: recruiter.email,
            username: recruiter.username,
            requiresPasswordReset: recruiter.requiresPasswordReset
          },
          loginLink
        }
      });
    }

    // Remove password from response
    recruiter.password = undefined;

    res.status(201).json({
      status: 'success',
      message: 'Recruiter added successfully and welcome email sent',
      data: {
        recruiter,
        loginLink
      }
    });

  } catch (err) {
    console.error('Recruiter creation error:', err);
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return next(new AppError(`${field} already exists`, 400));
    }
    
    next(new AppError('Failed to add recruiter', 500));
  }
};

exports.resendWelcomeEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const recruiter = await User.findById(id);
    if (!recruiter) {
      return next(new AppError('Recruiter not found', 404));
    }

    // Generate new login token
    const loginToken = recruiter.createPasswordResetToken();
    await recruiter.save({ validateBeforeSave: false });

    // Create login link
    const loginLink = `${process.env.FRONTEND_URL}/first-login?token=${loginToken}&email=${encodeURIComponent(recruiter.email)}`;

    // Send welcome email
    try {
      await sendEmail({
        email: recruiter.email,
        subject: 'Your HireOnboard Account Access',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #4e54c8; text-align: center;">HireOnboard Account Access</h2>
            <p>Hello ${recruiter.username},</p>
            <p>Here is your login link to access your HireOnboard account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginLink}" style="background-color: #4e54c8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Access Your Account
              </a>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">
              This link will expire in 10 minutes.
            </p>
          </div>
        `
      });

      res.status(200).json({
        status: 'success',
        message: 'Welcome email sent successfully',
        loginLink
      });
    } catch (emailError) {
      console.error('Failed to resend welcome email:', emailError);
      return next(new AppError('Failed to send welcome email', 500));
    }

  } catch (err) {
    console.error('Resend welcome email error:', err);
    next(new AppError('Failed to resend welcome email', 500));
  }
};

exports.getAllRecruiter = async (req, res, next) => {
  try {
    const recruiters = await User.find({ role: "recruiter" }).select('-password');
    
    if (!recruiters || recruiters.length === 0) {
      return next(new AppError("No Recruiters Found", 404));
    }
    
    return res.status(200).json({
      success: true,
      message: "All Recruiters fetched Successfully",
      recruiters
    });
  } catch (err) {
    next(new AppError('Failed to fetch recruiters', 500));
  }
};

exports.updateRecruiter = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if username or email already exists for another user
    if (req.body.username || req.body.email) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: id } },
          { 
            $or: [
              { username: req.body.username },
              { email: req.body.email ? req.body.email.toLowerCase().trim() : null }
            ]
          }
        ]
      });
      
      if (existingUser) {
        if (existingUser.username === req.body.username) {
          return next(new AppError('Username already in use', 400));
        }
        if (existingUser.email === req.body.email.toLowerCase().trim()) {
          return next(new AppError('Email already in use', 400));
        }
      }
    }
    
    // Handle profile picture upload if a new file is provided
    if (req.file) {
      req.body.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
    }
    
    const recruiter = await User.findOneAndUpdate(
      { _id: id, role: "recruiter" }, 
      req.body, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!recruiter) {
      return next(new AppError("Recruiter not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Recruiter updated successfully",
      recruiter
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return next(new AppError(`${field} already exists`, 400));
    }
    next(err);
  }
};

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
      recruiter: {
        id: recruiter._id,
        email: recruiter.email,
        username: recruiter.username
      }
    });
  } catch (err) {
    next(err);
  }
};