/**
 * Generate Mock Data Script
 * 
 * This script generates mock data for development and testing without requiring
 * a database connection. It's useful when you want to test the frontend without
 * setting up a database.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Directory to store mock data
const MOCK_DATA_DIR = path.join(process.cwd(), 'mock-data');

/**
 * Generate mock sensor data
 */
function generateSensorData() {
  const sensorTypes = [
    { type: 'temperature', unit: '°C', baseValue: 4.5, min: 2, max: 8 },
    { type: 'humidity', unit: '%', baseValue: 45, min: 30, max: 70 },
    { type: 'power', unit: 'kW', baseValue: 5.2, min: 1, max: 10 },
    { type: 'voltage', unit: 'V', baseValue: 220, min: 210, max: 230 },
    { type: 'current', unit: 'A', baseValue: 2.4, min: 0.5, max: 5 }
  ];
  
  // Generate array of 20 sensors
  const sensors = Array(20).fill(0).map((_, index) => {
    const sensorType = sensorTypes[index % sensorTypes.length];
    return {
      id: `SNS-${1000 + index}`,
      name: `Sensor ${index + 1} (${sensorType.type})`,
      type: sensorType.type,
      location: ['Cold Room 1', 'Cold Room 2', 'Electrical Panel', 'HVAC System', 'Entrance'][index % 5],
      status: ['Online', 'Online', 'Online', 'Warning', 'Offline'][Math.floor(Math.random() * 5)],
      lastReading: (sensorType.baseValue + (Math.random() * (sensorType.max - sensorType.min) - (sensorType.max - sensorType.min) / 2)).toFixed(1),
      lastCalibration: new Date(Date.now() - (Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
      unit: sensorType.unit
    };
  });
  
  return sensors;
}

/**
 * Generate sensor readings for a specific sensor
 */
function generateSensorReadings(sensorId, sensorType, days = 7) {
  const now = new Date();
  const readings = [];
  const sensorTypes = {
    'temperature': { unit: '°C', baseValue: 4.5, variation: 2 },
    'humidity': { unit: '%', baseValue: 45, variation: 10 },
    'power': { unit: 'kW', baseValue: 5.2, variation: 2 },
    'voltage': { unit: 'V', baseValue: 220, variation: 10 },
    'current': { unit: 'A', baseValue: 2.4, variation: 1 }
  };
  
  const typeConfig = sensorTypes[sensorType] || sensorTypes.temperature;
  
  // Generate a reading every 30 minutes for the specified number of days
  const points = days * 48; // 48 points per day (every 30 minutes)
  
  for (let i = 0; i < points; i++) {
    const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000);
    const value = (typeConfig.baseValue + (Math.random() * typeConfig.variation * 2 - typeConfig.variation)).toFixed(1);
    
    readings.push({
      id: i + 1,
      sensorId,
      value: parseFloat(value),
      unit: typeConfig.unit,
      timestamp: timestamp.toISOString()
    });
  }
  
  return readings;
}

/**
 * Generate notifications
 */
function generateNotifications(count = 20) {
  const now = new Date();
  const types = ['info', 'warning', 'critical'];
  const notificationTemplates = [
    { title: 'Temperature Alert', message: 'Cold Room {room} temperature {above/below} threshold ({value}°C).' },
    { title: 'Humidity Alert', message: 'Cold Room {room} humidity {above/below} recommended level ({value}%).' },
    { title: 'Power Fluctuation', message: 'Power fluctuation detected in {location}.' },
    { title: 'Sensor Offline', message: '{sensor} is offline. Maintenance required.' },
    { title: 'System Update', message: 'New system update available (v{version}).' },
    { title: 'Backup Generator', message: 'Backup generator {status}.' },
    { title: 'Door Alert', message: 'Cold Room {room} door has been open for {duration} minutes.' },
    { title: 'Scheduled Maintenance', message: 'Scheduled maintenance due in {days} days.' }
  ];
  
  const notifications = [];
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const template = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];
    
    // Create timestamp with most recent notifications first
    const hoursAgo = Math.floor(Math.random() * 14 * 24); // Random time in the last 14 days
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    
    // Replace template placeholders
    let message = template.message
      .replace('{room}', Math.floor(Math.random() * 3) + 1)
      .replace('{above/below}', Math.random() > 0.5 ? 'above' : 'below')
      .replace('{value}', (Math.random() * 10).toFixed(1))
      .replace('{location}', ['Electrical Panel', 'Cold Room 1', 'Cold Room 2', 'HVAC System'][Math.floor(Math.random() * 4)])
      .replace('{sensor}', `Sensor ${Math.floor(Math.random() * 10) + 1}`)
      .replace('{version}', `4.0.${Math.floor(Math.random() * 10)}`)
      .replace('{status}', ['started', 'stopped', 'tested', 'needs maintenance'][Math.floor(Math.random() * 4)])
      .replace('{duration}', Math.floor(Math.random() * 30) + 1)
      .replace('{days}', Math.floor(Math.random() * 14) + 1);
    
    notifications.push({
      id: i + 1,
      title: template.title,
      message,
      type,
      read: hoursAgo > 48, // Older notifications are more likely to be read
      createdAt: timestamp.toISOString()
    });
  }
  
  // Sort by timestamp (newest first)
  return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Generate monitoring dashboard data
 */
function generateMonitoringData() {
  // Generate cold room data
  const coldRooms = [];
  const roomCount = 4 + Math.floor(Math.random() * 3); // 4-6 cold rooms
  
  for (let i = 1; i <= roomCount; i++) {
    const baseTemp = 4 + (i % 3) * 0.5; // Slight variations per room (4°C, 4.5°C, 5°C)
    const currentTemp = (baseTemp + (Math.random() - 0.5) * 0.6).toFixed(1);
    const isInRange = parseFloat(currentTemp) >= baseTemp - 1 && parseFloat(currentTemp) <= baseTemp + 1;
    const isDoorClosed = Math.random() < 0.9; // 90% chance door is closed
    
    // Calculate compliance
    const isSfdaCompliant = isInRange && isDoorClosed;
    
    coldRooms.push({
      id: i,
      name: `Cold Room ${i}`,
      temperature: parseFloat(currentTemp),
      humidity: Math.floor(60 + Math.random() * 20), // 60-80%
      temperatureRange: {
        min: baseTemp - 1,
        max: baseTemp + 1
      },
      doorStatus: isDoorClosed ? "Closed" : "Open",
      doorLastOpened: isDoorClosed ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : new Date().toISOString(),
      sfdaCompliant: isSfdaCompliant,
      complianceScore: isSfdaCompliant ? (85 + Math.floor(Math.random() * 15)) : (70 + Math.floor(Math.random() * 15)),
      lastUpdated: new Date().toISOString(),
      alertsCount: isInRange && isDoorClosed ? 0 : 1 + Math.floor(Math.random() * 2)
    });
  }
  
  // Generate electrical systems data
  const electricalData = {
    status: "operational",
    powerConsumption: {
      current: 42.7,
      daily: 985.3,
      weekly: 6788.2,
      monthly: 28456.5,
      unit: "kWh"
    },
    mainPower: {
      status: "active",
      voltage: 219.4,
      frequency: 50.1,
      current: 98.2,
      powerFactor: 0.96
    },
    backupGenerator: {
      status: "standby",
      fuelLevel: 92,
      lastTest: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      nextScheduledTest: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    loadDistribution: [
      { name: "HVAC Systems", load: 18.4, unit: "kW" },
      { name: "Cold Rooms", load: 12.6, unit: "kW" },
      { name: "Lighting", load: 3.8, unit: "kW" },
      { name: "Office Equipment", load: 2.1, unit: "kW" },
      { name: "Security Systems", load: 1.5, unit: "kW" },
      { name: "Other", load: 4.3, unit: "kW" }
    ],
    alerts: [
      {
        id: "ELECT-001",
        severity: "info",
        message: "Scheduled monthly maintenance due in 5 days",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "ELECT-002",
        severity: "warning",
        message: "Voltage fluctuation detected in circuit B3",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        resolved: false
      }
    ],
    efficiency: {
      current: 94.2,
      target: 95.0,
      historical: [
        { period: "Jan", value: 93.5 },
        { period: "Feb", value: 93.8 },
        { period: "Mar", value: 94.0 },
        { period: "Apr", value: 94.1 },
        { period: "May", value: 94.2 }
      ]
    },
    lastUpdated: new Date().toISOString()
  };
  
  // System overview data
  const overviewData = {
    status: "operational",
    totalSensors: 24,
    activeSensors: 22,
    alertCount: {
      critical: 1,
      warning: 2,
      info: 3
    },
    uptime: "4d 12h 35m",
    lastUpdated: new Date().toISOString()
  };
  
  return {
    overview: overviewData,
    coldRooms,
    electrical: electricalData
  };
}

/**
 * Generate report data
 */
function generateReportData() {
  const sensorTypes = ['temperature', 'humidity', 'pressure', 'voltage', 'current'];
  const intervals = ['hourly', 'daily', 'weekly', 'monthly'];
  const reports = {};
  
  // Generate reports for each sensor type and interval
  sensorTypes.forEach(sensorType => {
    reports[sensorType] = {};
    
    intervals.forEach(interval => {
      const now = new Date();
      const points = [];
      
      let totalPoints = 24; // Default for hourly
      if (interval === 'daily') totalPoints = 30;
      if (interval === 'weekly') totalPoints = 52;
      if (interval === 'monthly') totalPoints = 12;
      
      let intervalMs = 3600000; // hourly
      if (interval === 'daily') intervalMs = 86400000;
      if (interval === 'weekly') intervalMs = 604800000;
      if (interval === 'monthly') intervalMs = 2592000000;
      
      // Generate appropriate base values and units based on sensor type
      let baseValue, unit;
      if (sensorType === 'temperature') {
        baseValue = 22;
        unit = '°C';
      } else if (sensorType === 'humidity') {
        baseValue = 50;
        unit = '%';
      } else if (sensorType === 'pressure') {
        baseValue = 1013;
        unit = 'hPa';
      } else if (sensorType === 'voltage') {
        baseValue = 220;
        unit = 'V';
      } else {
        baseValue = 10;
        unit = 'A';
      }
      
      for (let i = 0; i < totalPoints; i++) {
        const timestamp = new Date(now.getTime() - (i * intervalMs));
        let value = baseValue + (Math.random() * 10 - 5); // Random fluctuation
        
        if (sensorType === 'temperature') {
          value = parseFloat(value.toFixed(1));
        } else if (sensorType === 'humidity') {
          value = Math.round(value);
        } else {
          value = parseFloat(value.toFixed(2));
        }
        
        points.push({
          timestamp: timestamp.toISOString(),
          value,
          unit
        });
      }
      
      reports[sensorType][interval] = {
        sensorType,
        interval,
        points: points.reverse() // Most recent first
      };
    });
  });
  
  return reports;
}

/**
 * Save generated data to JSON files
 */
function saveMockData() {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(MOCK_DATA_DIR)) {
      fs.mkdirSync(MOCK_DATA_DIR, { recursive: true });
    }
    
    console.log('Generating mock data...');
    
    // Generate and save sensor data
    const sensors = generateSensorData();
    fs.writeFileSync(
      path.join(MOCK_DATA_DIR, 'sensors.json'),
      JSON.stringify(sensors, null, 2)
    );
    console.log(`Generated ${sensors.length} sensors`);
    
    // Generate and save sensor readings for first few sensors
    for (let i = 0; i < 5; i++) {
      const sensor = sensors[i];
      const readings = generateSensorReadings(sensor.id, sensor.type, 7);
      
      fs.writeFileSync(
        path.join(MOCK_DATA_DIR, `sensor-readings-${sensor.id}.json`),
        JSON.stringify(readings, null, 2)
      );
      console.log(`Generated ${readings.length} readings for ${sensor.id}`);
    }
    
    // Generate and save latest sensor data
    const latestData = sensors.map(sensor => ({
      id: sensor.id,
      name: sensor.name,
      type: sensor.type,
      value: sensor.lastReading,
      unit: sensor.unit,
      timestamp: new Date().toISOString(),
      status: sensor.status
    }));
    
    fs.writeFileSync(
      path.join(MOCK_DATA_DIR, 'latest-sensor-data.json'),
      JSON.stringify(latestData, null, 2)
    );
    console.log(`Generated latest data for ${latestData.length} sensors`);
    
    // Generate and save notifications
    const notifications = generateNotifications(20);
    fs.writeFileSync(
      path.join(MOCK_DATA_DIR, 'notifications.json'),
      JSON.stringify(notifications, null, 2)
    );
    console.log(`Generated ${notifications.length} notifications`);
    
    // Generate and save monitoring data
    const monitoringData = generateMonitoringData();
    fs.writeFileSync(
      path.join(MOCK_DATA_DIR, 'monitoring.json'),
      JSON.stringify(monitoringData, null, 2)
    );
    console.log('Generated monitoring dashboard data');
    
    // Generate and save report data
    const reportData = generateReportData();
    fs.writeFileSync(
      path.join(MOCK_DATA_DIR, 'reports.json'),
      JSON.stringify(reportData, null, 2)
    );
    console.log('Generated report data');
    
    console.log(`\nAll mock data saved to ${MOCK_DATA_DIR}`);
    console.log('This data can be used when database connection is not available');
    
    return true;
  } catch (error) {
    console.error('Error generating mock data:', error);
    return false;
  }
}

// Run the mock data generation
saveMockData(); 