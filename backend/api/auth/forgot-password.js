// Forgot Password API route
import { withApi } from '../../middleware';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import config from '../../config';

/**
 * Forgot Password handler
 * Initiates the password reset process by sending a reset token to the user's email
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const forgotPasswordHandler = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    }
    
    const { email } = req.body;
    
    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'INVALID_REQUEST', message: 'A valid email address is required' });
    }
    
    const db = require('../../utils/database');
    
    try {
      // Check if user exists
      const user = await db.getOne('SELECT id, email, firstName FROM users WHERE email = ?', [email]);
      
      // Even if user not found, return success for security reasons
      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If your email is registered, you will receive password reset instructions.'
        });
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      
      // Save reset token to user record
      await db.query(
        'UPDATE users SET resetToken = ?, resetTokenExpiry = ?, updatedAt = NOW() WHERE id = ?',
        [resetToken, resetTokenExpiry, user.id]
      );
      
      // Create reset URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
      
      // Setup email transport
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || 'user@example.com',
          pass: process.env.SMTP_PASS || 'password'
        }
      });
      
      // Email content
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        to: user.email,
        subject: 'Password Reset Request - IOT Edge System',
        html: `
          <p>Hello ${user.firstName || 'User'},</p>
          <p>You requested a password reset for your IOT Edge System account.</p>
          <p>Please click the link below to reset your password:</p>
          <p><a href="${resetUrl}" target="_blank">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this reset, you can safely ignore this email.</p>
          <p>Thank you,<br>IOT Edge Team</p>
        `
      };
      
      // Send email
      await transporter.sendMail(mailOptions);
      
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive password reset instructions.'
      });
    } catch (dbError) {
      console.error('Database error during forgot password:', dbError);
      return res.status(500).json({ error: 'SERVER_ERROR', message: 'An error occurred while processing your request.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'An error occurred while processing your request.' });
  }
};

// Export the handler with API middleware
// No authentication required for forgot password
export default withApi(forgotPasswordHandler, { auth: false });