const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const AppError = require('../../utils/appError');
const logger = require('../../services/logger');


exports.debugCheck = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const testPassword = req.body.password || "wrocus@12345";
    const isMatch = await bcrypt.compare(testPassword, user.password);

    return res.status(200).json({
      exists: true,
      user: {
        email: user.email,
        role: user.role,
        passwordHash: user.password,
        passwordMatch: isMatch,
        createdAt: user.createdAt
      },
      test: {
        passwordAttempt: testPassword,
        matchResult: isMatch
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.initializeSystem = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("Initialization attempt with:", { email, password });

    if (!email || !password) return next(new AppError('Email and password are required', 400));
    if (!validator.isEmail(email)) return next(new AppError('Please provide a valid email', 400));
    if (password.length < 8) return next(new AppError('Password must be at least 8 characters', 400));

    const existing = await User.findOne({ role: 'superadmin' });
    if (existing) return next(new AppError('System already initialized', 400));

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Generated hash:", hashedPassword);

    const verifyHash = await bcrypt.compare(password, hashedPassword);
    if (!verifyHash) {
      console.error("CRITICAL: HASH VERIFICATION FAILED DURING INITIALIZATION");
      return next(new AppError('Password hashing failed', 500));
    }

    const superadmin = await User.create({
      username: 'superadmin',
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'superadmin',
      isActive: true
    });

    console.log("User created successfully:", {
      id: superadmin._id,
      email: superadmin.email,
      hash: superadmin.password
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: superadmin._id,
          email: superadmin.email,
          role: superadmin.role
        },
        message: 'System initialized successfully'
      }
    });

  } catch (err) {
    console.error("Initialization error:", err);
    next(new AppError('System initialization failed', 500));
  }
};

exports.loginSuperAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt with:", { email, password });

    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim()
    });

    console.log("Found user:", user ? {
      _id: user._id,
      email: user.email,
      role: user.role,
      passwordHash: user.password.substring(0, 30) + "..."
    } : null);

    if (!user || user.role !== 'superadmin') {
      console.log("Login fail: User not found or not superadmin");
      return next(new AppError("Email or Password is Incorrect", 401));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password comparison result:", isMatch);

    if (!isMatch) {
      const newHash = await bcrypt.hash(password, 10);
      console.log("Debug Info:", {
        inputPassword: password,
        storedHash: user.password,
        newHashWithSamePassword: newHash,
        hashComparison: user.password === newHash
      });
      return next(new AppError("Email or Password is Incorrect", 401));
    }

    console.log("Login successful for:", user.email);
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    next(new AppError('Login failed', 500));
  }
};