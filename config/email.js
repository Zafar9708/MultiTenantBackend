const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('=== EMAIL CONFIG DEBUG ===');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
console.log('==========================');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Email connection error:', error.message);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

module.exports = transporter;