// backend/utils/emailService.js
const nodemailer = require('nodemailer');

// Create email transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'your-email@gmail.com',
    pass: process.env.GMAIL_PASSWORD || 'your-app-password'
  }
});

// Email transporter verification disabled for development
// transporter.verify() - skipped to avoid warnings during development

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.GMAIL_USER || 'kinder-support@gmail.com',
      to: email,
      subject: 'KINDER - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">KINDER Babysitter Platform</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Password Reset Request</h3>
            
            <p>Hello ${userName},</p>
            
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #333; color: white; padding: 12px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666; background-color: #fff; padding: 10px; border-radius: 3px;">
              ${resetUrl}
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This link will expire in 1 hour. If you didn't request this, please ignore this email.
            </p>
            
            <p style="color: #999; font-size: 12px;">
              For security reasons, never share this link with anyone.
            </p>
          </div>
          
          <p style="text-align: center; color: #999; font-size: 12px;">
            © 2024 KINDER Babysitter Platform. All rights reserved.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Password reset email sent to:', email);
    return { success: true, message: 'Email sent successfully' };
    
  } catch (error) {
    console.error('🔥 EMAIL SEND ERROR:', error.message);
    return { success: false, error: error.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, userName) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER || 'kinder-support@gmail.com',
      to: email,
      subject: 'Welcome to KINDER - Babysitter Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Welcome to KINDER</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Hello ${userName},</p>
            
            <p>Thank you for joining KINDER Babysitter Platform! We're excited to have you on board.</p>
            
            <p>Your account is now active and ready to use. Log in to get started:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/login" style="background-color: #333; color: white; padding: 12px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Login to KINDER
              </a>
            </div>
            
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
          
          <p style="text-align: center; color: #999; font-size: 12px;">
            © 2024 KINDER Babysitter Platform. All rights reserved.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Welcome email sent to:', email);
    return { success: true };
    
  } catch (error) {
    console.error('🔥 EMAIL SEND ERROR:', error.message);
    return { success: false };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail
};
