// const nodemailer = require('nodemailer');
// const logger = require('./logger');
// const AppError = require('../utils/appError');

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD
//   }
// });

// exports.sendJobCreationEmail = async (to, jobDetails) => {
//   try {
//     const mailOptions = {
//       from: `"Job Portal" <${process.env.EMAIL_FROM}>`,
//       to,
//       subject: 'New Job Created',
//       html: `
//         <h1>New Job Created</h1>
//         <p>A new job has been created with the following details:</p>
//         <ul>
//           <li>Job Name: ${jobDetails.jobName}</li>
//           <li>Job Title: ${jobDetails.jobTitle}</li>
//           <li>Department: ${jobDetails.department}</li>
//         </ul>
//       `
//     };

//     await transporter.sendMail(mailOptions);
//   } catch (err) {
//     logger.error('Email sending error:', err);
//     throw new AppError('Failed to send email notification', 500);
//   }
// };

// exports.sendSalesPersonNotification = async (to, jobDetails, updaterName = null) => {
//   try {
//     const subject = updaterName 
//       ? `Job Updated: ${jobDetails.jobTitle}`
//       : `New Job Assigned: ${jobDetails.jobTitle}`;

//     const mailOptions = {
//       from: `"Job Portal" <${process.env.EMAIL_FROM}>`,
//       to,
//       subject,
//       html: `
//         <h1>${subject}</h1>
//         ${updaterName ? `<p>This job was updated by ${updaterName}</p>` : ''}
//         <p>You have been assigned to the following job:</p>
//         <ul>
//           <li>Job Name: ${jobDetails.jobName}</li>
//           <li>Job Title: ${jobDetails.jobTitle}</li>
//           <li>Department: ${jobDetails.department}</li>
//         </ul>
//       `
//     };

//     await transporter.sendMail(mailOptions);
//   } catch (err) {
//     logger.error('Salesperson notification error:', err);
//     throw new AppError('Failed to send salesperson notification', 500);
//   }
// };

//---------


const nodemailer = require('nodemailer');

// Configure your email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendJobAssignmentEmail = async (to, data) => {
  const { jobName, jobTitle, department, experience, jobDesc, recruiterName, adminName, adminEmail } = data;
  
  const mailOptions = {
    from: `${adminName} <${adminEmail}>`,
    to: to,
    subject: `New Job Assignment: ${jobTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .job-details { margin-bottom: 20px; }
          .job-details h3 { color: #1976d2; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Job Assignment</h1>
          </div>
          <div class="content">
            <p>Hello ${recruiterName},</p>
            <p>You have been assigned to a new job by ${adminName}.</p>
            
            <div class="job-details">
              <h3>Job Details:</h3>
              <p><strong>Job Name:</strong> ${jobName}</p>
              <p><strong>Job Title:</strong> ${jobTitle}</p>
              <p><strong>Department:</strong> ${department}</p>
              <p><strong>Experience Required:</strong> ${experience}</p>
              <p><strong>Job Description:</strong></p>
              <div>${jobDesc}</div>
            </div>
            
            <p>Please log in to the system to view complete details and start the recruitment process.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Job assignment email sent to ${to}`);
  } catch (error) {
    console.error('Error sending job assignment email:', error);
    throw error;
  }
};

const sendSalesPersonNotification = async (to, data) => {
  const { jobName, jobTitle, department, salesPersonName, creatorName } = data;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: `New Job Created: ${jobTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .job-details { margin-bottom: 20px; }
          .job-details h3 { color: #1976d2; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Job Created</h1>
          </div>
          <div class="content">
            <p>Hello ${salesPersonName},</p>
            <p>A new job has been created by ${creatorName} and assigned to you.</p>
            
            <div class="job-details">
              <h3>Job Details:</h3>
              <p><strong>Job Name:</strong> ${jobName}</p>
              <p><strong>Job Title:</strong> ${jobTitle}</p>
              <p><strong>Department:</strong> ${department}</p>
            </div>
            
            <p>Please log in to the system to view complete details.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Sales person notification email sent to ${to}`);
  } catch (error) {
    console.error('Error sending sales person notification email:', error);
    throw error;
  }
};

module.exports = {
  sendJobAssignmentEmail,
  sendSalesPersonNotification
};