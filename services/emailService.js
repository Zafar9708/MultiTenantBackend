const nodemailer = require('nodemailer');
const logger = require('./logger');
const AppError = require('../utils/appError');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendJobCreationEmail = async (to, jobDetails) => {
  try {
    const mailOptions = {
      from: `"Job Portal" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'New Job Created',
      html: `
        <h1>New Job Created</h1>
        <p>A new job has been created with the following details:</p>
        <ul>
          <li>Job Name: ${jobDetails.jobName}</li>
          <li>Job Title: ${jobDetails.jobTitle}</li>
          <li>Department: ${jobDetails.department}</li>
        </ul>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    logger.error('Email sending error:', err);
    throw new AppError('Failed to send email notification', 500);
  }
};

exports.sendSalesPersonNotification = async (to, jobDetails, updaterName = null) => {
  try {
    const subject = updaterName 
      ? `Job Updated: ${jobDetails.jobTitle}`
      : `New Job Assigned: ${jobDetails.jobTitle}`;

    const mailOptions = {
      from: `"Job Portal" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html: `
        <h1>${subject}</h1>
        ${updaterName ? `<p>This job was updated by ${updaterName}</p>` : ''}
        <p>You have been assigned to the following job:</p>
        <ul>
          <li>Job Name: ${jobDetails.jobName}</li>
          <li>Job Title: ${jobDetails.jobTitle}</li>
          <li>Department: ${jobDetails.department}</li>
        </ul>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    logger.error('Salesperson notification error:', err);
    throw new AppError('Failed to send salesperson notification', 500);
  }
};