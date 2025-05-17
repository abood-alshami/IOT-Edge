/**
 * Enhanced Database utility for connecting to MySQL with support for IoT data and enterprise workloads
 */
import mysql from 'mysql2/promise';

// Database connection configuration with enhanced options for handling IoT data volume
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'iotedge',
  password: process.env.DB_PASSWORD || 'Iotedge@123',
  database: process.env.DB_NAME || 'iotedge',
  waitForConnections: true,
  connectionLimit: 25,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

// Flag to track if we're using mock data due to DB connection failure
let usingMockData = false;

// Create a connection pool with enhanced error handling and retry logic
const createPool = () => {
  try {
    console.log(`Attempting to connect to database at ${dbConfig.host}:${process.env.DB_PORT || '3306'}`);
    
    if (!dbConfig.user || !dbConfig.password) {
      console.warn('Database credentials incomplete. Using mock data.');
      usingMockData = true;
      return null;
    }
    
    const pool = mysql.createPool(dbConfig);
    console.log('Enhanced database connection pool initialized');
    
    // Test the connection immediately
    pool.query('SELECT 1')
      .then(() => console.log('Database connection validated'))
      .catch(err => {
        console.error('Database connection test failed:', err.message);
        console.info('Falling back to mock data mode for development');
        usingMockData = true;
      });
    
    return pool;
  } catch (error) {
    console.error('Error creating database pool:', error.message);
    console.info('Falling back to mock data mode for development');
    usingMockData = true;
    return null;
  }
};

// Initialize the pool
const pool = createPool();

/**
 * Save data to a specific table in the database
 * 
 * @param {string} table - Table name
 * @param {Object} data - Data to save
 * @returns {Promise<number>} - Inserted ID
 */
export const saveToDatabase = async (table, data) => {
  try {
    if (!pool || usingMockData) {
      console.log('Using mock data (no database connection)');
      return Math.floor(Math.random() * 10000) + 1; // Mock ID
    }
    
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values);
    
    return result.insertId;
  } catch (error) {
    console.error('Database save error:', error);
    usingMockData = true;
    throw error;
  }
};

/**
 * Insert data into a table
 * 
 * @param {string} table - Table name
 * @param {Object} data - Data to insert
 * @returns {Promise<number>} - Inserted ID
 */
export const insert = async (table, data) => {
  return saveToDatabase(table, data);
};

/**
 * Update data in a table
 * 
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {Object} where - Where clause
 * @returns {Promise<boolean>} - Success status
 */
export const update = async (table, data, where) => {
  try {
    if (!pool || usingMockData) {
      console.log('Using mock data (no database connection)');
      return true;
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // Build SET clause
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    // Build WHERE clause
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);
    const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const params = [...values, ...whereValues];
    
    const [result] = await pool.execute(sql, params);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Database update error:', error);
    usingMockData = true;
    throw error;
  }
};

/**
 * Remove data from a table
 * 
 * @param {string} table - Table name
 * @param {Object} where - Where clause
 * @returns {Promise<boolean>} - Success status
 */
export const remove = async (table, where) => {
  try {
    if (!pool || usingMockData) {
      console.log('Using mock data (no database connection)');
      return true;
    }
    
    // Build WHERE clause
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);
    const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
    
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    const [result] = await pool.execute(sql, whereValues);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Database delete error:', error);
    usingMockData = true;
    throw error;
  }
};

/**
 * Execute a database query
 * 
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
export const query = async (sql, params = []) => {
  try {
    if (!pool || usingMockData) {
      console.log('Using mock data (no database connection)');
      return [];
    }
    
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
      usingMockData = true;
    }
    throw error;
  }
};

/**
 * Check if database is connected
 * 
 * @returns {Promise<boolean>} - True if connected
 */
export const isConnected = async () => {
  try {
    if (!pool || usingMockData) {
      return false;
    }
    
    await pool.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection check error:', error);
    usingMockData = true;
    return false;
  }
};

/**
 * Get a single record from a table
 * 
 * @param {string} table - Table name
 * @param {Object} where - Where clause
 * @returns {Promise<Object>} - Record data
 */
export const getOne = async (table, where) => {
  try {
    if (!pool || usingMockData) {
      console.log('Using mock data (no database connection)');
      return generateMockData(table);
    }
    
    // Build WHERE clause
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);
    const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
    
    const sql = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`;
    
    const [rows] = await pool.execute(sql, whereValues);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Database getOne error:', error);
    usingMockData = true;
    return generateMockData(table);
  }
};

/**
 * Generate mock data for development
 * 
 * @param {string} table - Table name to generate mock data for
 * @returns {Object} - Mock data
 */
function generateMockData(table) {
  const mockId = Math.floor(Math.random() * 10000) + 1;
  
  // Return different mock data based on table
  switch (table) {
    case 'sensors':
      return {
        id: mockId,
        name: `Mock Sensor ${mockId}`,
        type: ['temperature', 'humidity', 'pressure'][Math.floor(Math.random() * 3)],
        location: 'Mock Location',
        status: ['active', 'inactive', 'maintenance'][Math.floor(Math.random() * 3)],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    case 'users':
      return {
        id: mockId,
        username: `user${mockId}`,
        role: ['admin', 'user', 'viewer'][Math.floor(Math.random() * 3)],
        email: `user${mockId}@example.com`,
        created_at: new Date().toISOString()
      };
    default:
      return { id: mockId, mock: true };
  }
}

// Export flag to indicate if we're using mock data
export const isUsingMockData = () => usingMockData;

// Export all database functions
export default {
  saveToDatabase,
  query,
  isConnected,
  insert,
  update,
  remove,
  getOne,
  isUsingMockData
};