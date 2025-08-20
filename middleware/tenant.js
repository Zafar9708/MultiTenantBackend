const Tenant = require('../models/Tenant');
const logger = require('../services/logger');
const AppError = require('../utils/appError');

const identifyTenant = async (req, res, next) => {
  try {
    const tenantIdentifier = req.subdomains[0] || 
                           req.headers['x-tenant-id'] || 
                           req.query.tenantId;
    
    if (!tenantIdentifier) {
      const defaultTenant = await Tenant.findOne({ domain: 'default' });
      
      if (!defaultTenant) {
        return next(new AppError('Tenant identification required', 400));
      }
      
      req.tenant = defaultTenant;
      return next();
    }

    const tenant = await Tenant.findOne({ 
      $or: [
        { domain: tenantIdentifier },
        { _id: tenantIdentifier }
      ] 
    });

    if (!tenant || !tenant.isActive) {
      return next(new AppError('Invalid or inactive tenant', 403));
    }

    req.tenant = tenant;
    next();
  } catch (err) {
    logger.error('Tenant identification error:', err);
    next(new AppError('Tenant processing failed', 500));
  }
};

module.exports = identifyTenant;