const Tenant = require('../models/Tenant');
const { getTenantDB } = require('../config/tenant');
const AppError = require('../utils/appError');

const identifyTenant = async (req, res, next) => {
  try {
    const tenantIdentifier = req.subdomains[0] || 
                           req.headers['x-tenant-id'] || 
                           req.query.tenantId;
    
    if (!tenantIdentifier) {
      return next(new AppError('Tenant identification required', 400));
    }

    const tenant = await Tenant.findOne({ 
      $or: [
        { domain: tenantIdentifier },
        { _id: tenantIdentifier }
      ],
      isActive: true
    });

    if (!tenant) {
      return next(new AppError('Invalid or inactive tenant', 403));
    }

    await getTenantDB(tenant._id);
    
    req.tenant = tenant;
    next();
  } catch (err) {
    next(new AppError('Tenant processing failed', 500));
  }
};

module.exports = identifyTenant;