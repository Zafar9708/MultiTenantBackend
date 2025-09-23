// utils/auth.js
const jwt = require('jsonwebtoken');

/**
 * Generate vendor token for job sharing
 */
const generateVendorToken = (vendorEmail, jobId, tenantId) => {
  return jwt.sign(
    { 
      vendorEmail, 
      jobId, 
      tenantId,
      type: 'vendor_upload' 
    },
    process.env.JWT_SECRET, // Use the actual environment variable
    { expiresIn: '30d' } // Token expires in 30 days
  );
};

/**
 * Verify vendor token
 */
const verifyVendorToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET); // Use the actual environment variable
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateVendorToken,
  verifyVendorToken
};