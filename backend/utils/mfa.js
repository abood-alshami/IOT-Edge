// Multi-factor authentication (MFA) module
import crypto from 'crypto';

/**
 * Generate a random MFA secret
 * @returns {string} MFA secret
 */
export function generateMFASecret() {
  return crypto.randomBytes(20).toString('hex');
}

/**
 * Generate a time-based one-time password (TOTP)
 * @param {string} secret - MFA secret
 * @param {number} window - Time window for code validity (defaults to current time)
 * @returns {string} 6-digit TOTP code
 */
export function generateTOTP(secret, window = Math.floor(Date.now() / 30000)) {
  // Convert secret to Buffer if it's a string
  const secretBuffer = typeof secret === 'string' 
    ? Buffer.from(secret, 'hex') 
    : secret;
  
  // Convert window to Buffer
  const windowBuffer = Buffer.alloc(8);
  let windowHex = window.toString(16).padStart(16, '0');
  for (let i = 0; i < 8; i++) {
    windowBuffer[i] = parseInt(windowHex.slice(i*2, i*2+2), 16);
  }
  
  // Generate HMAC-SHA1 hash
  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(windowBuffer);
  const hmacResult = hmac.digest();
  
  // Get offset and truncate to 4 bytes
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const binary = ((hmacResult[offset] & 0x7f) << 24) |
                ((hmacResult[offset + 1] & 0xff) << 16) |
                ((hmacResult[offset + 2] & 0xff) << 8) |
                (hmacResult[offset + 3] & 0xff);
  
  // Get 6-digit code
  const otp = binary % 1000000;
  
  // Pad with leading zeros if needed
  return otp.toString().padStart(6, '0');
}

/**
 * Verify a TOTP code
 * @param {string} secret - MFA secret
 * @param {string} token - TOTP code to verify
 * @param {number} window - Number of time windows to check (default: 1)
 * @returns {boolean} Whether the token is valid
 */
export function verifyTOTP(secret, token, window = 1) {
  if (!token || !secret) return false;
  
  // Current time window
  const currentWindow = Math.floor(Date.now() / 30000);
  
  // Check current and previous windows
  for (let i = -window; i <= window; i++) {
    const calculatedToken = generateTOTP(secret, currentWindow + i);
    if (calculatedToken === token) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate an MFA QR code URL for Google Authenticator or similar apps
 * @param {string} secret - MFA secret
 * @param {string} accountName - User account name
 * @param {string} issuer - Application name
 * @returns {string} URL for QR code
 */
export function generateQRCodeUrl(secret, accountName, issuer = 'IOT-Edge') {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  const encodedSecret = encodeURIComponent(secret);
  
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${encodedSecret}&issuer=${encodedIssuer}`;
}