// Reset Password API route
import { withApi } from '../../middleware';
import bcrypt from 'bcrypt';
import config from '../../config';

/**
 * Reset Password handler
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const resetPasswordHandler = async (req, res) => {
  try {
    // Accept both GET and POST requests
    if (req.method === 'GET') {
      return validateTokenHandler(req, res);
    } else if (req.method !== 'POST') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    }
    
    // For POST requests, handle password reset
    const { token } = req.query;
    const { password, confirmPassword } = req.body;
    
    // Validate input
    if (!token) {
      return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Reset token is required' });
    }
    
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Password must be at least 8 characters long' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Passwords do not match' });
    }
    
    const db = require('../../utils/database');
    
    try {
      // Find user with valid token
      const user = await db.getOne(
        'SELECT id FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()',
        [token]
      );
      
      if (!user) {
        return res.status(400).json({ 
          error: 'INVALID_TOKEN', 
          message: 'Invalid or expired reset token. Please request a new password reset.' 
        });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Update password and clear reset token
      await db.query(
        'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL, updatedAt = NOW() WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      return res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.'
      });
    } catch (dbError) {
      console.error('Database error during password reset:', dbError);
      return res.status(500).json({ error: 'SERVER_ERROR', message: 'An error occurred while resetting your password.' });
    }
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'An error occurred while resetting your password.' });
  }
};

/**
 * Validate Reset Token handler
 * Handles GET requests to validate if a token is valid
 */
const validateTokenHandler = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Reset token is required' });
    }
    
    const db = require('../../utils/database');
    
    // Check if token exists and is not expired
    const user = await db.getOne(
      'SELECT id FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()',
      [token]
    );
    
    if (!user) {
      return res.status(400).json({ 
        error: 'INVALID_TOKEN', 
        message: 'Invalid or expired reset token. Please request a new password reset.' 
      });
    }
    
    return res.status(200).json({
      valid: true,
      message: 'Reset token is valid.'
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'An error occurred while validating the reset token.' });
  }
};

// Export the handler with API middleware
// No authentication required for password reset
export default withApi(resetPasswordHandler, { auth: false });