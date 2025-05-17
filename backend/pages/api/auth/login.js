/**
 * Login API route
 */
import { withApi } from '../../../middleware';
import passport from '../../../middleware/auth';
import { generateToken } from '../../../middleware/auth';
import { verifyTOTP } from '../../../utils/mfa';

/**
 * Authenticate a user and issue a JWT with optional MFA
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const login = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
  }

  // Step 1: Authenticate with username and password
  return passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err);
      return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: info?.message || 'Invalid username or password' });
    }

    // Step 2: Check if MFA is enabled for the user
    if (user.mfaEnabled) {
      const { mfaCode } = req.body;

      // If MFA is enabled but no code provided, return a challenge
      if (!mfaCode) {
        return res.status(200).json({
          requiresMfa: true,
          message: 'MFA code required',
          userId: user.id
        });
      }

      // Verify the MFA code
      const isValidMfaCode = verifyTOTP(user.mfaSecret, mfaCode);
      if (!isValidMfaCode) {
        return res.status(401).json({
          error: 'INVALID_MFA_CODE',
          message: 'Invalid MFA code',
          requiresMfa: true
        });
      }
    }

    // Step 3: Generate JWT token
    const token = generateToken(user);

    // Return user info and token
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled
      }
    });
  })(req, res);
};

// Export the handler with CORS middleware
// No authentication required for login
export default withApi(login, { auth: false });