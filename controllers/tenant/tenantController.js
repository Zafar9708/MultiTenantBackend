// const Tenant = require('../../models/Tenant');
// const User = require('../../models/User');
// const AppError = require('../../utils/appError');



// exports.createTenant = async (req, res, next) => {
//   try {
//     const { name, domain, email } = req.body;

//     // 1. Validate all required fields
//     if (!name || !domain || !email) {
//       return next(new AppError('Name, domain, and email are required', 400));
//     }

//     // 2. Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return next(new AppError('Please provide a valid email address', 400));
//     }

//     // 3. Check for existing tenant
//     const existingTenant = await Tenant.findOne({ 
//       $or: [
//         { name }, 
//         { domain }, 
//         { email: email.toLowerCase() }
//       ] 
//     });

//     if (existingTenant) {
//       let conflictField;
//       if (existingTenant.name === name) conflictField = 'name';
//       else if (existingTenant.domain === domain) conflictField = 'domain';
//       else conflictField = 'email';
//       return next(new AppError(`${conflictField} already in use`, 409));
//     }

//     // 4. Create tenant
//     const tenant = await Tenant.create({ 
//       name, 
//       domain, 
//       email: email.toLowerCase(),
//       isActive: true 
//     });

//     res.status(201).json({
//       status: 'success',
//       data: {
//         tenant: {
//           id: tenant._id,
//           name: tenant.name,
//           domain: tenant.domain,
//           email: tenant.email,
//           isActive: tenant.isActive,
//           createdAt: tenant.createdAt
//         }
//       }
//     });

//   } catch (err) {
//     console.error('Tenant creation error:', {
//       message: err.message,
//       stack: err.stack,
//       ...(err.errors && { errors: err.errors })
//     });

//     if (err.code === 11000) {
//       const field = Object.keys(err.keyPattern)[0];
//       return next(new AppError(`${field} already exists`, 409));
//     }

//     if (err.name === 'ValidationError') {
//       const messages = Object.values(err.errors).map(val => val.message);
//       return next(new AppError(messages.join(', '), 400));
//     }

//     next(new AppError('Failed to create tenant', 500));
//   }
// };

// exports.getAllTenants = async (req, res, next) => {
//   try {
//     const tenants = await Tenant.find({ isActive: true });
    
//     res.status(200).json({
//       status: 'success',
//       results: tenants.length,
//       data: { tenants }
//     });
//   } catch (err) {
//     next(new AppError('Failed to fetch tenants', 500));
//   }
// };



// exports.updateTenant = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { name, domain, email, isActive, settings } = req.body;

//     // 1. Find the tenant
//     const tenant = await Tenant.findById(id);
//     if (!tenant) {
//       return next(new AppError('Tenant not found', 404));
//     }

//     // 2. Prepare update data (only update fields that are provided)
//     const updateData = {};
//     if (name !== undefined) updateData.name = name;
//     if (domain !== undefined) updateData.domain = domain;
//     if (email !== undefined) {
//       // Validate email format
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(email)) {
//         return next(new AppError('Please provide a valid email address', 400));
//       }
//       updateData.email = email.toLowerCase();
//     }
//     if (isActive !== undefined) updateData.isActive = isActive;
//     if (settings !== undefined) updateData.settings = settings;

//     // 3. Check for conflicts if updating unique fields
//     const conflictConditions = [];
//     if (name && name !== tenant.name) conflictConditions.push({ name });
//     if (domain && domain !== tenant.domain) conflictConditions.push({ domain });
//     if (email && email !== tenant.email) conflictConditions.push({ email: email.toLowerCase() });

//     if (conflictConditions.length > 0) {
//       const existingTenant = await Tenant.findOne({
//         $or: conflictConditions,
//         _id: { $ne: id }
//       });

//       if (existingTenant) {
//         const conflictField = existingTenant.name === name ? 'name' : 
//                           existingTenant.domain === domain ? 'domain' : 'email';
//         return next(new AppError(`${conflictField} already in use by another tenant`, 409));
//       }
//     }

//     // 4. Perform the update
//     const updatedTenant = await Tenant.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true, runValidators: true }
//     ).select('-__v');

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tenant: updatedTenant
//       }
//     });

//   } catch (err) {
//     console.error('Tenant update error:', err);

//     if (err.code === 11000) {
//       const field = Object.keys(err.keyPattern)[0];
//       return next(new AppError(`${field} already exists`, 409));
//     }

//     next(new AppError('Failed to update tenant', 500));
//   }
// };


// exports.deleteTenant = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     // 1. Find the tenant
//     const tenant = await Tenant.findById(id);
//     if (!tenant) {
//       return next(new AppError('Tenant not found', 404));
//     }

//     // 2. Check if tenant has active users (optional)
//     const userCount = await User.countDocuments({ tenantId: id });
//     if (userCount > 0) {
//       return next(new AppError('Cannot delete tenant with active users', 400));
//     }

//     // 3. Delete tenant (choose one method):

//     // Method A: Hard delete (completely remove from database)
//     await Tenant.findByIdAndDelete(id);

//     // Method B: Soft delete (recommended - set isActive to false)
//     // await Tenant.findByIdAndUpdate(id, { isActive: false });

//     res.status(204).json({
//       status: 'success',
//       data: null
//     });

//   } catch (err) {
//     console.error('Tenant deletion error:', err);
//     next(new AppError('Failed to delete tenant', 500));
//   }
// };


// controllers/tenantController.js
const Tenant = require('../../models/Tenant');
const User = require('../../models/User');
const AppError = require('../../utils/appError');
const sendEmail = require('../../utils/email');
const crypto = require('crypto');

exports.createTenant = async (req, res, next) => {
  try {
    const { name, domain, email, adminPassword } = req.body;

    // 1. Validate all required fields
    if (!name || !domain || !email || !adminPassword) {
      return next(new AppError('Name, domain, email, and admin password are required', 400));
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new AppError('Please provide a valid email address', 400));
    }

    // 3. Check for existing tenant
    const existingTenant = await Tenant.findOne({ 
      $or: [
        { name }, 
        { domain }, 
        { email: email.toLowerCase() }
      ] 
    });

    if (existingTenant) {
      let conflictField;
      if (existingTenant.name === name) conflictField = 'name';
      else if (existingTenant.domain === domain) conflictField = 'domain';
      else conflictField = 'email';
      return next(new AppError(`${conflictField} already in use`, 409));
    }

    // 4. Create tenant
    const tenant = await Tenant.create({ 
      name, 
      domain, 
      email: email.toLowerCase(),
      isActive: true 
    });

    // 5. Create admin user for the tenant with password reset required
    const adminUser = await User.create({
      username: name.toLowerCase(),
      email: email.toLowerCase(),
      password: adminPassword,
      role: 'admin',
      tenantId: tenant._id,
      isActive: true,
      requiresPasswordReset: true
    });

    // 6. Generate login token for first login
    const loginToken = adminUser.createPasswordResetToken();
    await adminUser.save({ validateBeforeSave: false });

    // 7. Create login link
    const loginLink = `${process.env.FRONTEND_URL}/first-login?token=${loginToken}&email=${encodeURIComponent(adminUser.email)}`;

    // 8. Send welcome email
    try {
      await sendEmail({
        email: adminUser.email,
        subject: `Welcome to HireOnboard - Admin Account for ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #4e54c8; text-align: center;">Welcome to HireOnboard!</h2>
            <p>Hello,</p>
            <p>Your admin account for <strong>${name}</strong> has been created successfully. Please use the link below to log in for the first time and set up your password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginLink}" style="background-color: #4e54c8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Set Up Your Admin Account
              </a>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">
              This link will expire in 24 hours. If you didn't request this account, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">HireOnboard System</p>
          </div>
        `
      });

      console.log('Welcome email sent to admin:', adminUser.email);

      res.status(201).json({
        status: 'success',
        message: 'Tenant created successfully and welcome email sent to admin',
        data: {
          tenant: {
            id: tenant._id,
            name: tenant.name,
            domain: tenant.domain,
            email: tenant.email,
            isActive: tenant.isActive,
            createdAt: tenant.createdAt
          },
          adminUser: {
            id: adminUser._id,
            email: adminUser.email,
            username: adminUser.username
          },
          loginLink
        }
      });

    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      
      // Even if email fails, we still create the tenant but notify superadmin
      res.status(201).json({
        status: 'partial_success',
        message: 'Tenant created but welcome email failed to send',
        data: {
          tenant: {
            id: tenant._id,
            name: tenant.name,
            domain: tenant.domain,
            email: tenant.email,
            isActive: tenant.isActive,
            createdAt: tenant.createdAt
          },
          adminUser: {
            id: adminUser._id,
            email: adminUser.email,
            username: adminUser.username
          },
          loginLink
        }
      });
    }

  } catch (err) {
    console.error('Tenant creation error:', {
      message: err.message,
      stack: err.stack,
      ...(err.errors && { errors: err.errors })
    });

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return next(new AppError(`${field} already exists`, 409));
    }

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return next(new AppError(messages.join(', '), 400));
    }

    next(new AppError('Failed to create tenant', 500));
  }
};

// Add resend welcome email endpoint for tenants
exports.resendWelcomeEmail = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Find the tenant
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return next(new AppError('Tenant not found', 404));
    }

    // 2. Find the admin user for this tenant
    const adminUser = await User.findOne({ 
      tenantId: id, 
      role: 'admin' 
    });

    if (!adminUser) {
      return next(new AppError('Admin user not found for this tenant', 404));
    }

    // 3. Generate new login token
    const loginToken = adminUser.createPasswordResetToken();
    adminUser.requiresPasswordReset = true;
    await adminUser.save({ validateBeforeSave: false });

    // 4. Create login link
    const loginLink = `${process.env.FRONTEND_URL}/first-login?token=${loginToken}&email=${encodeURIComponent(adminUser.email)}`;

    // 5. Send welcome email
    try {
      await sendEmail({
        email: adminUser.email,
        subject: `Your HireOnboard Admin Account Access - ${tenant.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #4e54c8; text-align: center;">HireOnboard Account Access</h2>
            <p>Hello,</p>
            <p>Here is your login link to access your admin account for <strong>${tenant.name}</strong>:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginLink}" style="background-color: #4e54c8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Access Your Admin Account
              </a>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">
              This link will expire in 24 hours.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">HireOnboard System</p>
          </div>
        `
      });

      res.status(200).json({
        status: 'success',
        message: 'Welcome email resent successfully',
        data: {
          loginLink
        }
      });
    } catch (emailError) {
      console.error('Failed to resend welcome email:', emailError);
      return next(new AppError('Failed to resend welcome email', 500));
    }

  } catch (err) {
    console.error('Resend welcome email error:', err);
    next(new AppError('Failed to resend welcome email', 500));
  }
};

exports.getAllTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.find({ isActive: true });
    
    res.status(200).json({
      status: 'success',
      results: tenants.length,
      data: { tenants }
    });
  } catch (err) {
    next(new AppError('Failed to fetch tenants', 500));
  }
};

exports.updateTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, domain, email, isActive, settings } = req.body;

    // 1. Find the tenant
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return next(new AppError('Tenant not found', 404));
    }

    // 2. Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (domain !== undefined) updateData.domain = domain;
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return next(new AppError('Please provide a valid email address', 400));
      }
      updateData.email = email.toLowerCase();
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (settings !== undefined) updateData.settings = settings;

    // 3. Check for conflicts
    const conflictConditions = [];
    if (name && name !== tenant.name) conflictConditions.push({ name });
    if (domain && domain !== tenant.domain) conflictConditions.push({ domain });
    if (email && email !== tenant.email) conflictConditions.push({ email: email.toLowerCase() });

    if (conflictConditions.length > 0) {
      const existingTenant = await Tenant.findOne({
        $or: conflictConditions,
        _id: { $ne: id }
      });

      if (existingTenant) {
        const conflictField = existingTenant.name === name ? 'name' : 
                          existingTenant.domain === domain ? 'domain' : 'email';
        return next(new AppError(`${conflictField} already in use by another tenant`, 409));
      }
    }

    // 4. Perform the update
    const updatedTenant = await Tenant.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    res.status(200).json({
      status: 'success',
      data: {
        tenant: updatedTenant
      }
    });

  } catch (err) {
    console.error('Tenant update error:', err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return next(new AppError(`${field} already exists`, 409));
    }

    next(new AppError('Failed to update tenant', 500));
  }
};

exports.deleteTenant = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return next(new AppError('Tenant not found', 404));
    }

    const userCount = await User.countDocuments({ tenantId: id });
    if (userCount > 0) {
      return next(new AppError('Cannot delete tenant with active users', 400));
    }

    await Tenant.findByIdAndDelete(id);

    res.status(204).json({
      status: 'success',
      data: null
    });

  } catch (err) {
    console.error('Tenant deletion error:', err);
    next(new AppError('Failed to delete tenant', 500));
  }
};