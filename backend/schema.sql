-- IOT-Edge Database Schema
USE iotedge;
CREATE TABLE IF NOT EXISTS sensors (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  location VARCHAR(100),
  status VARCHAR(20),
  last_reading FLOAT,
  last_updated DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensor_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sensor_id VARCHAR(20) NOT NULL,
  value FLOAT NOT NULL,
  unit VARCHAR(20),
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (sensor_id) REFERENCES sensors(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  message TEXT,
  type VARCHAR(20),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(50) PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS electrical_systems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(50),
  currentPowerUsage INT,
  maxCapacity INT,
  voltage INT,
  lastMaintenance DATETIME,
  location VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS cold_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  temperature FLOAT,
  humidity INT,
  status VARCHAR(50),
  lastMaintenance DATETIME,
  location VARCHAR(100),
  capacity VARCHAR(50),
  currentLoad VARCHAR(20)
); 