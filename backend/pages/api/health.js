/**
 * Health check API route
 */

/**
 * Simple health check endpoint
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    message: "API server is operational",
    timestamp: new Date().toISOString(),
    version: "5.0.1",
    env: process.env.NODE_ENV || "development"
  });
} 