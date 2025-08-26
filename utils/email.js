const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    console.log('📧 Attempting to send email to:', options.email);
    console.log('🔧 Using Mailtrap SMTP');

    // Create transporter with Mailtrap configuration
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Transporter created successfully');

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Define email options
    const mailOptions = {
      from: `HireOnboard System <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message
    };

    console.log('📤 Sending email...');
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully! Message ID:', info.messageId);
    
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('Error details:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

module.exports = sendEmail;