const { isConnected } = require('../../../utils/database');

export default async function handler(req, res) {
  try {
    const isDbConnected = await isConnected();
    res.status(200).json({
      status: isDbConnected ? 'ok' : 'db_error',
      timestamp: new Date().toISOString(),
      database: {
        connected: isDbConnected,
        message: isDbConnected ? 'Database connection is active' : 'Database connection failed'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        message: 'Error checking database connection'
      }
    });
  }
}

module.exports = handler; 