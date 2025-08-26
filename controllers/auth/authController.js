// const User = require('../../models/User');
// const Tenant=require('../../models/Tenant')
// const AppError = require('../../utils/appError');
// const jwt = require('jsonwebtoken');

// exports.initializeSystem = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
//     console.log('Initialization request received:', { email });

//     const existingSuperadmin = await User.findOne({ role: 'superadmin' });
//     if (existingSuperadmin) {
//       console.log('System already initialized with:', existingSuperadmin.email);
//       return next(new AppError('System already initialized', 400));
//     }

//     console.log('Creating superadmin...');
//     const superadmin = await User.create({
//       username: 'superadmin',
//       email: email.toLowerCase(),
//       password,
//       role: 'superadmin',
//       isActive: true
//     });
//     console.log('Superadmin created:', superadmin._id);

//     console.log('Generating token...');
//     const token = jwt.sign(
//       { id: superadmin._id }, 
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRES_IN }
//     );

//     console.log('Initialization successful');
//     res.status(201).json({
//       status: 'success',
//       token,
//       data: {
//         user: {
//           id: superadmin._id,
//           email: superadmin.email,
//           role: superadmin.role
//         }
//       }
//     });

//   } catch (err) {
//     console.error('Initialization error:', err);
//     next(new AppError('System initialization failed', 500));
//   }
// };

// exports.login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return next(new AppError('Please provide email and password', 400));
//     }

//     const user = await User.findOne({ email }).select('+password +tenantId');
    
//     if (!user || !(await user.comparePassword(password))) {
//       return next(new AppError('Incorrect email or password', 401));
//     }

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN
//     });

//     user.lastLogin = Date.now();
//     await user.save({ validateBeforeSave: false });

//     res.status(200).json({
//       status: 'success',
//       token,
//       data: {
//         user: {
//           id: user._id,
//           email: user.email,
//           role: user.role,
//           tenantId: user.tenantId
//         }
//       }
//     });
//   } catch (err) {
//     next(new AppError('Login failed', 500));
//   }
// };

// // Add this to your authController.js
// exports.getUserDetails = async (req, res, next) => {
//   try {
//     // The user is already available in req.user from the protect middleware
//     const user = await User.findById(req.user.id).select('-password -__v');
    
//     if (!user) {
//       return next(new AppError('User not found', 404));
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         user
//       }
//     });
//   } catch (err) {
//     next(new AppError('Failed to fetch user details', 500));
//   }
// };

//------------


// const User = require('../../models/User');
// const Tenant=require('../../models/Tenant')
// const AppError = require('../../utils/appError');
// const jwt = require('jsonwebtoken');
// const sendEmail = require('../../utils/email'); 
// const crypto = require('crypto');

// exports.initializeSystem = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
//     console.log('Initialization request received:', { email });

//     const existingSuperadmin = await User.findOne({ role: 'superadmin' });
//     if (existingSuperadmin) {
//       console.log('System already initialized with:', existingSuperadmin.email);
//       return next(new AppError('SuperAdmin Already Created ! Please Login to Continue', 400));
//     }

//     console.log('Creating superadmin...');
//     const superadmin = await User.create({
//       username: 'superadmin',
//       email: email.toLowerCase(),
//       password,
//       role: 'superadmin',
//       isActive: true
//     });
//     console.log('Superadmin created:', superadmin._id);

//     console.log('Generating token...');
//     const token = jwt.sign(
//       { id: superadmin._id }, 
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRES_IN }
//     );

//     console.log('Initialization successful');
//     res.status(201).json({
//       status: 'success',
//       token,
//       data: {
//         user: {
//           id: superadmin._id,
//           email: superadmin.email,
//           role: superadmin.role
//         }
//       }
//     });

//   } catch (err) {
//     console.error('Initialization error:', err);
//     next(new AppError('System initialization failed', 500));
//   }
// };

// exports.login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return next(new AppError('Please provide email and password', 400));
//     }

//     const user = await User.findOne({ email }).select('+password +tenantId');
    
//     if (!user || !(await user.comparePassword(password))) {
//       return next(new AppError('Incorrect email or password', 401));
//     }

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN
//     });

//     user.lastLogin = Date.now();
//     await user.save({ validateBeforeSave: false });

//     res.status(200).json({
//       status: 'success',
//       token,
//       data: {
//         user: {
//           id: user._id,
//           email: user.email,
//           role: user.role,
//           tenantId: user.tenantId
//         }
//       }
//     });
//   } catch (err) {
//     next(new AppError('Login failed', 500));
//   }
// };

// // Add this to your authController.js
// exports.getUserDetails = async (req, res, next) => {
//   try {
//     // The user is already available in req.user from the protect middleware
//     const user = await User.findById(req.user.id).select('-password -__v');
    
//     if (!user) {
//       return next(new AppError('User not found', 404));
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         user
//       }
//     });
//   } catch (err) {
//     next(new AppError('Failed to fetch user details', 500));
//   }
// };


// exports.forgotPassword = async (req, res, next) => {
//   try {
//     const { email } = req.body;
    
//     console.log('🔐 Forgot password request for:', email);

//     // 1. Get user based on email
//     const user = await User.findOne({ email });
//     if (!user) {
//       console.log('❌ User not found:', email);
//       return next(new AppError('There is no user with that email address.', 404));
//     }

//     // 2. Generate OTP
//     const otp = user.createOTP();
//     await user.save({ validateBeforeSave: false });

//     console.log('✅ OTP generated for', email, ':', otp);

//     // 3. Send OTP via email
//     const message = `Your password reset OTP is ${otp}. This OTP is valid for 10 minutes.`;
    
//     try {
//       console.log('📧 Attempting to send OTP email to:', email);
      
//       await sendEmail({
//         email: user.email,
//         subject: 'Your Password Reset OTP - HireOnboard',
//         message: message,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
//             <h2 style="color: #4e54c8; text-align: center;">Password Reset Request</h2>
//             <p>Hello,</p>
//             <p>You requested a password reset for your HireOnboard account.</p>
//             <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; border: 2px dashed #4e54c8;">
//               <h3 style="color: #4e54c8; margin: 0; font-size: 28px; letter-spacing: 3px;">${otp}</h3>
//               <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">This OTP is valid for 10 minutes</p>
//             </div>
//             <p style="color: #888; font-size: 12px; text-align: center;">If you didn't request this reset, please ignore this email.</p>
//             <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
//             <p style="color: #666; font-size: 12px; text-align: center;">HireOnboard System</p>
//           </div>
//         `
//       });

//       console.log('✅ OTP email sent successfully to:', email);

//       res.status(200).json({
//         status: 'success',
//         message: 'OTP sent to your email! Check your Mailtrap inbox.'
//       });

//     } catch (emailError) {
//       console.error('❌ Email sending failed:', emailError);
      
//       // Reset OTP fields if email fails
//       user.otp = undefined;
//       user.otpExpires = undefined;
//       await user.save({ validateBeforeSave: false });

//       // Fallback: return OTP in response for development
//       res.status(200).json({
//         status: 'success',
//         message: 'Email sending failed. OTP generated for development.',
//         testOtp: otp,
//         note: 'Check Mailtrap configuration. OTP valid for 10 minutes.'
//       });
//     }
//   } catch (err) {
//     console.error('❌ Forgot password error:', err);
//     next(new AppError('Failed to process forgot password request', 500));
//   }
// };

// exports.verifyOTP = async (req, res, next) => {
//   try {
//     const { email, otp } = req.body;
    
//     // 1. Get user based on email
//     const user = await User.findOne({ 
//       email,
//       otpExpires: { $gt: Date.now() }
//     });
    
//     if (!user) {
//       return next(new AppError('Invalid email or OTP has expired', 400));
//     }

//     // 2. Verify OTP
//     const hashedOTP = crypto.createHash('sha256').update(otp).toString('hex');
    
//     if (hashedOTP !== user.otp) {
//       return next(new AppError('Invalid OTP', 400));
//     }

//     // 3. Generate reset token
//     const resetToken = user.createPasswordResetToken();
//     await user.save({ validateBeforeSave: false });

//     res.status(200).json({
//       status: 'success',
//       message: 'OTP verified successfully',
//       resetToken
//     });
//   } catch (err) {
//     next(new AppError('Failed to verify OTP', 500));
//   }
// };

// exports.resetPassword = async (req, res, next) => {
//   try {
//     const { token } = req.params;
//     const { password, passwordConfirm } = req.body;
    
//     if (password !== passwordConfirm) {
//       return next(new AppError('Passwords do not match', 400));
//     }

//     // 1. Get user based on the token
//     const hashedToken = crypto.createHash('sha256').update(token).toString('hex');
//     const user = await User.findOne({
//       passwordResetToken: hashedToken,
//       passwordResetExpires: { $gt: Date.now() }
//     });

//     // 2. If token has not expired, and there is user, set the new password
//     if (!user) {
//       return next(new AppError('Token is invalid or has expired', 400));
//     }

//     // 3. Update password and clear reset token fields
//     user.password = password;
//     user.passwordResetToken = undefined;
//     user.passwordResetExpires = undefined;
//     user.otp = undefined;
//     user.otpExpires = undefined;
//     await user.save();

//     // 4. Log the user in, send JWT
//     const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN
//     });

//     res.status(200).json({
//       status: 'success',
//       token: authToken,
//       data: {
//         user: {
//           id: user._id,
//           email: user.email,
//           role: user.role,
//           tenantId: user.tenantId
//         }
//       }
//     });
//   } catch (err) {
//     next(new AppError('Failed to reset password', 500));
//   }
// };

// exports.register = async (req, res, next) => {
//   try {
//     // Check if the requesting user is a superadmin
//     if (req.user.role !== 'superadmin') {
//       return next(new AppError('Only superadmin can register new users', 403));
//     }

//     const { username, email, password, passwordConfirm, role, tenantId, experience, phoneNumber } = req.body;
    
//     if (password !== passwordConfirm) {
//       return next(new AppError('Passwords do not match', 400));
//     }

//     // Check if tenant exists if provided
//     if (tenantId && role !== 'superadmin') {
//       const tenant = await Tenant.findById(tenantId);
//       if (!tenant) {
//         return next(new AppError('The specified tenant does not exist', 400));
//       }
//     }

//     // Check if username or email already exists
//     const existingUser = await User.findOne({
//       $or: [
//         { email: email.toLowerCase().trim() },
//         { username: username.trim() }
//       ]
//     });
    
//     if (existingUser) {
//       if (existingUser.email === email.toLowerCase().trim()) {
//         return next(new AppError('Email already in use', 400));
//       }
//       if (existingUser.username === username.trim()) {
//         return next(new AppError('Username already in use', 400));
//       }
//     }

//     // Create new user
//     const newUser = await User.create({
//       username: username.trim(),
//       email: email.toLowerCase().trim(),
//       password,
//       role,
//       tenantId: role !== 'superadmin' ? tenantId : null,
//       experience: experience || 0,
//       phoneNumber: phoneNumber || null,
//       isActive: true
//     });

//     // Remove password from output
//     newUser.password = undefined;

//     res.status(201).json({
//       status: 'success',
//       data: {
//         user: newUser
//       }
//     });
//   } catch (err) {
//     if (err.code === 11000) {
//       return next(new AppError('Email or username already exists', 400));
//     }
//     next(new AppError('Registration failed', 500));
//   }
// };



// exports.testMailtrapConfig = async (req, res, next) => {
//   try {
//     console.log('🧪 Testing Mailtrap configuration...');
//     console.log('Host:', process.env.EMAIL_HOST);
//     console.log('Port:', process.env.EMAIL_PORT);
//     console.log('Username:', process.env.EMAIL_USERNAME);
    
//     await sendEmail({
//       email: 'sahil84344426@gmail.com', // Send to your email
//       subject: 'TEST: Mailtrap SMTP Working! - HireOnboard',
//       message: 'This is a test email from HireOnboard using Mailtrap SMTP.',
//       html: `
//         <div style="font-family: Arial, sans-serif;">
//           <h2 style="color: #4e54c8;">✅ Mailtrap Test Successful!</h2>
//           <p>Your Mailtrap SMTP configuration is working correctly.</p>
//           <p><strong>Host:</strong> ${process.env.EMAIL_HOST}</p>
//           <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
//         </div>
//       `
//     });

//     res.status(200).json({
//       status: 'success',
//       message: 'Mailtrap test email sent successfully! Check your Mailtrap inbox.'
//     });

//   } catch (error) {
//     console.error('❌ Mailtrap test failed:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Mailtrap test failed: ' + error.message,
//       details: {
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         username: process.env.EMAIL_USERNAME
//       }
//     });
//   }
// };

//----------

const User = require('../../models/User');
const Tenant = require('../../models/Tenant');
const AppError = require('../../utils/appError');
const jwt = require('jsonwebtoken');
const sendEmail = require('../../utils/email'); 
const crypto = require('crypto');

exports.initializeSystem = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('Initialization request received:', { email });

    const existingSuperadmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperadmin) {
      console.log('System already initialized with:', existingSuperadmin.email);
      return next(new AppError('SuperAdmin Already Created ! Please Login to Continue', 400));
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

    const user = await User.findOne({ email }).select('+password +tenantId +requiresPasswordReset');
    
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // Check if user requires password reset
    if (user.requiresPasswordReset) {
      return res.status(200).json({
        status: 'success',
        requiresPasswordReset: true,
        message: 'Please reset your password before continuing'
      });
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
          tenantId: user.tenantId,
          requiresPasswordReset: user.requiresPasswordReset
        }
      }
    });
  } catch (err) {
    next(new AppError('Login failed', 500));
  }
};

// In controllers/auth/authController.js
exports.firstLogin = async (req, res, next) => {
  try {
    const { token, email, password } = req.body;

    console.log('First login request received:', { token, email, hasPassword: !!password });

    if (!token || !email) {
      return next(new AppError('Token and email are required', 400));
    }

    // 1. Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(token).toString('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      email: email.toLowerCase()
    });

    // 2. If token has not expired, and there is user, allow password setup
    if (!user) {
      console.log('Token validation failed - invalid or expired token');
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // 3. Check if password is provided (for the reset step)
    if (!password) {
      console.log('Token is valid, requesting password');
      return res.status(200).json({
        status: 'success',
        message: 'Token is valid. Please provide a new password.',
        valid: true
      });
    }

    console.log('Setting new password for user:', user.email);

    // 4. Update password and clear reset token fields
    user.password = password;
    user.requiresPasswordReset = false;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    console.log('Password updated successfully for user:', user.email);

    // 5. Log the user in, send JWT
    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.status(200).json({
      status: 'success',
      token: authToken,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          requiresPasswordReset: user.requiresPasswordReset
        }
      }
    });
  } catch (err) {
    console.error('First login error:', err);
    next(new AppError('Failed to complete first login', 500));
  }
};

// In controllers/auth/authController.js
exports.validateFirstLoginToken = async (req, res, next) => {
  try {
    const { token, email } = req.body;

    console.log('Token validation request:', { token, email });

    if (!token || !email) {
      return next(new AppError('Token and email are required', 400));
    }

    // 1. Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(token).toString('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      email: email.toLowerCase()
    });

    // 2. If token has not expired, and there is user, token is valid
    if (!user) {
      console.log('Token validation failed');
      return next(new AppError('Token is invalid or has expired', 400));
    }

    console.log('Token validation successful for user:', user.email);

    res.status(200).json({
      status: 'success',
      message: 'Token is valid',
      valid: true
    });
  } catch (err) {
    console.error('Token validation error:', err);
    next(new AppError('Failed to validate token', 500));
  }
};

exports.getUserDetails = async (req, res, next) => {
  try {
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

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    console.log('🔐 Forgot password request for:', email);

    // 1. Get user based on email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return next(new AppError('There is no user with that email address.', 404));
    }

    // 2. Generate OTP
    const otp = user.createOTP();
    await user.save({ validateBeforeSave: false });

    console.log('✅ OTP generated for', email, ':', otp);

    // 3. Send OTP via email
    const message = `Your password reset OTP is ${otp}. This OTP is valid for 10 minutes.`;
    
    try {
      console.log('📧 Attempting to send OTP email to:', email);
      
      await sendEmail({
        email: user.email,
        subject: 'Your Password Reset OTP - HireOnboard',
        message: message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #4e54c8; text-align: center;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You requested a password reset for your HireOnboard account.</p>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; border: 2px dashed #4e54c8;">
              <h3 style="color: #4e54c8; margin: 0; font-size: 28px; letter-spacing: 3px;">${otp}</h3>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">This OTP is valid for 10 minutes</p>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">If you didn't request this reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">HireOnboard System</p>
          </div>
        `
      });

      console.log('✅ OTP email sent successfully to:', email);

      res.status(200).json({
        status: 'success',
        message: 'OTP sent to your email! Check your Mailtrap inbox.'
      });

    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      
      // Reset OTP fields if email fails
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });

      // Fallback: return OTP in response for development
      res.status(200).json({
        status: 'success',
        message: 'Email sending failed. OTP generated for development.',
        testOtp: otp,
        note: 'Check Mailtrap configuration. OTP valid for 10 minutes.'
      });
    }
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    next(new AppError('Failed to process forgot password request', 500));
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    // 1. Get user based on email
    const user = await User.findOne({ 
      email,
      otpExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return next(new AppError('Invalid email or OTP has expired', 400));
    }

    // 2. Verify OTP
    const hashedOTP = crypto.createHash('sha256').update(otp).toString('hex');
    
    if (hashedOTP !== user.otp) {
      return next(new AppError('Invalid OTP', 400));
    }

    // 3. Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully',
      resetToken
    });
  } catch (err) {
    next(new AppError('Failed to verify OTP', 500));
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, passwordConfirm } = req.body;
    
    if (password !== passwordConfirm) {
      return next(new AppError('Passwords do not match', 400));
    }

    // 1. Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(token).toString('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2. If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // 3. Update password and clear reset token fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // 4. Log the user in, send JWT
    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.status(200).json({
      status: 'success',
      token: authToken,
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
    next(new AppError('Failed to reset password', 500));
  }
};

exports.register = async (req, res, next) => {
  try {
    // Check if the requesting user is a superadmin
    if (req.user.role !== 'superadmin') {
      return next(new AppError('Only superadmin can register new users', 403));
    }

    const { username, email, password, passwordConfirm, role, tenantId, experience, phoneNumber } = req.body;
    
    if (password !== passwordConfirm) {
      return next(new AppError('Passwords do not match', 400));
    }

    // Check if tenant exists if provided
    if (tenantId && role !== 'superadmin') {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return next(new AppError('The specified tenant does not exist', 400));
      }
    }

    // Check if username or email already exists
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

    // Create new user
    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      tenantId: role !== 'superadmin' ? tenantId : null,
      experience: experience || 0,
      phoneNumber: phoneNumber || null,
      isActive: true
    });

    // Remove password from output
    newUser.password = undefined;

    res.status(201).json({
      status: 'success',
      data: {
        user: newUser
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError('Email or username already exists', 400));
    }
    next(new AppError('Registration failed', 500));
  }
};