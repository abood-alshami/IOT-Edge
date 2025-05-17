const mysql = require('mysql2/promise');
const path = require('path');

let mysqlPool = null;

/**
 * Initialize database connections
 * @param {Object} app - Express app instance for storing connections
 * @returns {Promise<void>}
 */
async function initializeDb(app) {
  try {
    // MySQL connection
    if (!mysqlPool) {
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'iot_edge',
        password: process.env.DB_PASSWORD || 'iotedgedb',
        database: process.env.DB_NAME || 'iot_db',
        waitForConnections: true,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
        queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0')
      };
      
      console.log(`Connecting to MySQL database at: ${dbConfig.host}:${dbConfig.port || 3306}`);
      mysqlPool = mysql.createPool(dbConfig);
      console.log('MySQL connection pool created successfully');
    }
    
    if (app) {
      app.locals.promisePool = mysqlPool;
    }
  } catch (error) {
    console.error('MySQL database connection error:', error);
    throw error;
  }
}

/**
 * Execute a database query with automatic connection handling
 * @param {Object} app - Express app instance with connection
 * @param {string} query - MySQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<any>} - Query results
 */
async function executeQuery(app, query, params = []) {
  if (!app || !app.locals.promisePool) {
    await initializeDb(app);
  }
  
  try {
    const [rows] = await app.locals.promisePool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Get a single row from the database
 * @param {Object} app - Express app instance with connection
 * @param {string} query - MySQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<any>} - Query result (single row)
 */
async function getRow(app, query, params = []) {
  if (!app || !app.locals.promisePool) {
    await initializeDb(app);
  }
  
  try {
    const [rows] = await app.locals.promisePool.query(query, params);
    return rows[0];
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute an insert statement
 * @param {Object} app - Express app instance with connection
 * @param {string} query - MySQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<any>} - Insert result with ID
 */
async function executeInsert(app, query, params = []) {
  if (!app || !app.locals.promisePool) {
    await initializeDb(app);
  }
  
  try {
    const [result] = await app.locals.promisePool.query(query, params);
    return { id: result.insertId };
  } catch (error) {
    console.error('Database insert error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

module.exports = {
  initializeDb,
  executeQuery,
  getRow,
  executeInsert
};