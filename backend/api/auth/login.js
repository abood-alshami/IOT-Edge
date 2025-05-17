// Login API route
import { withApi } from '../../middleware';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../../config';

/**
 * Login handler
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const loginHandler = async (req, res) => {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    }
    
    // Validate request body
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Username and password are required' });
    }
    
    // In a real application, you would query the database to get the user
    // For this example, we're using a mock user
    // Replace this with actual database queries
    const db = require('../../utils/database');
    
    try {
      // Get user from database
      const user = await db.getOne(
        'SELECT id, username, password, role, email, name FROM users WHERE username = ?',
        [username]
      );
      
      if (!user) {
        // Use the same error message for security reasons
        return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid username or password' });
      }
      
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        // Use the same error message for security reasons
        return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid username or password' });
      }
      
      // Create token payload
      const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        name: user.name,
      };
      
      // Sign token
      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });
      
      // Return token and user info
      return res.status(200).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          name: user.name,
        },
      });
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      return res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error during login' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error during login' });
  }
};

// Export the handler with CORS middleware
// No authentication required for login
export default withApi(loginHandler, { auth: false }); 