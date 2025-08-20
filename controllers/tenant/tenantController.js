const Tenant = require('../../models/Tenant');
const User = require('../../models/User');
const AppError = require('../../utils/appError');



exports.createTenant = async (req, res, next) => {
  try {
    const { name, domain, email } = req.body;

    // 1. Validate all required fields
    if (!name || !domain || !email) {
      return next(new AppError('Name, domain, and email are required', 400));
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

    res.status(201).json({
      status: 'success',
      data: {
        tenant: {
          id: tenant._id,
          name: tenant.name,
          domain: tenant.domain,
          email: tenant.email,
          isActive: tenant.isActive,
          createdAt: tenant.createdAt
        }
      }
    });

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

    // 2. Prepare update data (only update fields that are provided)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (domain !== undefined) updateData.domain = domain;
    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return next(new AppError('Please provide a valid email address', 400));
      }
      updateData.email = email.toLowerCase();
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (settings !== undefined) updateData.settings = settings;

    // 3. Check for conflicts if updating unique fields
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

    // 1. Find the tenant
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return next(new AppError('Tenant not found', 404));
    }

    // 2. Check if tenant has active users (optional)
    const userCount = await User.countDocuments({ tenantId: id });
    if (userCount > 0) {
      return next(new AppError('Cannot delete tenant with active users', 400));
    }

    // 3. Delete tenant (choose one method):

    // Method A: Hard delete (completely remove from database)
    await Tenant.findByIdAndDelete(id);

    // Method B: Soft delete (recommended - set isActive to false)
    // await Tenant.findByIdAndUpdate(id, { isActive: false });

    res.status(204).json({
      status: 'success',
      data: null
    });

  } catch (err) {
    console.error('Tenant deletion error:', err);
    next(new AppError('Failed to delete tenant', 500));
  }
};


