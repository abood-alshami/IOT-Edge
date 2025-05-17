/**
 * Database Initialization Script
 * 
 * This script creates the necessary database tables and populates them with initial data.
 * Use this for development setup.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'iotedge',
  password: process.env.DB_PASSWORD || 'Iotedge@123',
  database: process.env.DB_NAME || 'iotedge'
};

async function initializeDatabase() {
  let connection;
  try {
    // Connect to MySQL server without specifying database
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`Database ${dbConfig.database} created or already exists`);

    // Use the database
    await connection.query(`USE ${dbConfig.database}`);

    // Create electrical_systems table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS electrical_systems (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        status ENUM('active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active',
        currentPowerUsage FLOAT,
        maxCapacity FLOAT,
        voltage FLOAT,
        lastMaintenance DATE,
        location VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Electrical systems table created or already exists');

    // Create cold_rooms table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cold_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        temperature FLOAT NOT NULL,
        humidity FLOAT,
        status ENUM('operational', 'maintenance', 'offline') NOT NULL DEFAULT 'operational',
        lastMaintenance DATE,
        location VARCHAR(100),
        capacity VARCHAR(50),
        currentLoad VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Cold rooms table created or already exists');

    // Insert sample data for electrical systems
    await connection.query(`
      INSERT IGNORE INTO electrical_systems (name, status, currentPowerUsage, maxCapacity, voltage, lastMaintenance, location)
      VALUES 
        ('Main Power Grid', 'active', 1500, 2000, 240, '2024-01-15', 'Building A'),
        ('Backup Generator', 'active', 0, 1000, 240, '2024-02-01', 'Building B')
    `);
    console.log('Sample electrical systems data inserted');

    // Insert sample data for cold rooms
    await connection.query(`
      INSERT IGNORE INTO cold_rooms (name, temperature, humidity, status, lastMaintenance, location, capacity, currentLoad)
      VALUES 
        ('Main Cold Storage', -18.5, 45, 'operational', '2024-01-20', 'Building A', '5000 cubic feet', '65%'),
        ('Secondary Cold Room', -20.0, 40, 'operational', '2024-02-05', 'Building B', '3000 cubic feet', '40%')
    `);
    console.log('Sample cold rooms data inserted');

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the initialization
initializeDatabase().catch(console.error);