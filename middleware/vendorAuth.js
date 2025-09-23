const jwt = require('jsonwebtoken');
// const VendorToken = require('../models/VendorToken'); // If you're storing tokens

// const validateVendorToken = async (req, res, next) => {
//   try {
//     let token = req.header('Authorization');

//     if (!token || !token.startsWith('Bearer ')) {
//       return res.status(401).json({
//         status: 'fail',
//         message: 'No token provided or invalid format'
//       });
//     }

//     token = token.slice(7); 

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     if (decoded.type !== 'vendor_upload') {
//       return res.status(401).json({
//         status: 'fail',
//         message: 'Invalid token type'
//       });
//     }

  
//     req.vendor = {
//       email: decoded.vendorEmail,
//       jobId: decoded.jobId,
//       tenantId: decoded.tenantId
//     };

//     next();
//   } catch (error) {
//     return res.status(401).json({
//       status: 'fail',
//       message: 'Invalid or expired token'
//     });
//   }
// };

const validateVendorToken = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    if (!token || !token.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'fail', message: 'No token provided' });
    }

    token = token.slice(7); 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'vendor_upload') {
      return res.status(401).json({ status: 'fail', message: 'Invalid token type' });
    }

    req.vendor = {
      email: decoded.vendorEmail,
      jobId: decoded.jobId,
      tenantId: decoded.tenantId,
      jobDesc: decoded.jobDesc // ✅ Extract job description from token
    };

    next();
  } catch (error) {
    return res.status(401).json({ status: 'fail', message: 'Invalid or expired token' });
  }
};

module.exports = { validateVendorToken };