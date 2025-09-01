const nodemailer = require('nodemailer');
const transporter = require('../config/email');
require('dotenv').config();

console.log('=== EMAIL SERVICE DEBUG ===');
console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('===========================');

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
    from: process.env.EMAIL_FROM,
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

const sendInterviewEmail = async (to, subject, body, meetingLink, feedbackLink, recipientName, emailType = 'technical') => {
  try {
    console.log('📧 Attempting to send interview email to:', to);

    let signature = 'HireOnboard Team';
    if (emailType === 'technical') {
      signature = 'Technical Team';
    } else if (emailType === 'final') {
      signature = 'Hiring Team';
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
            <h1>Interview Scheduled</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            ${body.replace(/\n/g, '<br>')}
            
            ${meetingLink ? `
            <div style="margin: 20px 0; padding: 15px; background: #e8f5e8; border-radius: 5px; border-left: 4px solid #4caf50;">
              <h3 style="margin: 0; color: #2e7d32;">Meeting Link</h3>
              <p style="margin: 10px 0;">
                <a href="${meetingLink}" style="color: #1976d2; text-decoration: none; font-weight: bold;">
                  ${meetingLink}
                </a>
              </p>
            </div>
            ` : ''}
            
            ${feedbackLink && feedbackLink !== 'N/A' ? `
            <div style="margin: 20px 0; padding: 15px; background: #fff3e0; border-radius: 5px; border-left: 4px solid #ff9800;">
              <h3 style="margin: 0; color: #ef6c00;">Feedback Required</h3>
              <p style="margin: 10px 0;">
                Please submit your feedback after the interview:
                <a href="${feedbackLink}" style="color: #1976d2; text-decoration: none; font-weight: bold;">
                  Submit Feedback
                </a>
              </p>
            </div>
            ` : ''}
          </div>
          <div style="padding: 20px; text-align: center; background: #333; color: white;">
            <p>Best regards,<br>${signature}</p>
            <p style="font-size: 12px; color: #ccc;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', to);
    console.log('📧 Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email to:', to);
    console.error('❌ Error:', error.message);
    throw error;
  }
};

const sendFeedbackEmail = async (to, interview, feedback, interviewer) => {
  try {
    console.log('📧 Attempting to send feedback email to:', to);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: `Interview Feedback for ${interview.candidate.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; text-align: center; color: white;">
            <h1>Interview Feedback Submitted</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Interview Details</h3>
            <p><strong>Candidate:</strong> ${interview.candidate.name}</p>
            <p><strong>Date:</strong> ${new Date(interview.date).toLocaleDateString()}</p>
            <p><strong>Interviewer:</strong> ${interviewer.name}</p>
            
            <h3>Feedback Details</h3>
            <p><strong>Status:</strong> ${feedback.status}</p>
            <p><strong>Technical Skills:</strong> ${feedback.technicalSkills}/5</p>
            <p><strong>Communication:</strong> ${feedback.communicationSkills}/5</p>
            <p><strong>Problem Solving:</strong> ${feedback.problemSolving}/5</p>
            <p><strong>Cultural Fit:</strong> ${feedback.culturalFit}/5</p>
            
            <h4>Overall Feedback</h4>
            <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
              ${feedback.overallFeedback}
            </div>
            
            ${feedback.additionalComments ? `
            <h4>Additional Comments</h4>
            <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
              ${feedback.additionalComments}
            </div>
            ` : ''}
          </div>
          <div style="padding: 20px; text-align: center; background: #333; color: white;">
            <p>Best regards,<br>Interview Team</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Feedback email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('❌ Failed to send feedback email to:', to);
    console.error('❌ Error:', error.message);
    throw error;
  }
};

const sendRecruiterAssignmentEmail = async (email, data) => {
  const { jobName, jobTitle, department, experience, recruiterName, creatorName, jobDescription } = data;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
        .header { background-color: #4e54c8; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; }
        .job-details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4e54c8; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Job Assignment</h2>
        </div>
        <div class="content">
          <p>Hello ${recruiterName},</p>
          <p>You have been assigned to a new job posting by ${creatorName}.</p>
          
          <div class="job-details">
            <h3>Job Details:</h3>
            <p><strong>Job ID:</strong> ${jobName}</p>
            <p><strong>Job Title:</strong> ${jobTitle}</p>
            <p><strong>Department:</strong> ${department}</p>
            <p><strong>Experience Required:</strong> ${experience}</p>
            <p><strong>Job Description:</strong><br>${jobDescription}</p>
          </div>
          
          <p>Please log in to your account to view complete details and start managing applications for this position.</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Dashboard</a>
          </div>
          
          <p>If you have any questions, please contact your administrator.</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} HireOnboard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      email,
      subject: `New Job Assignment: ${jobTitle}`,
      html
    });
    console.log(`Recruiter assignment email sent to: ${email}`);
  } catch (error) {
    console.error(`Failed to send recruiter assignment email to ${email}:`, error);
    throw error;
  }
};

module.exports = {
  sendJobAssignmentEmail,
  sendSalesPersonNotification,
  sendInterviewEmail,
  sendFeedbackEmail,
  sendRecruiterAssignmentEmail
};