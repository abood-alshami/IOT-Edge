// Configuration settings for the IOT-Edge backend

/**
 * This file centralizes all configuration to ensure consistent settings across the application.
 * Environment variables are loaded from .env file (if present) by the Next.js framework.
 */

const config = {
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'iotedge',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'iotedge',
    port: parseInt(process.env.DB_PORT || '3306', 10),
  },
  
  // JWT authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-from-env',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  
  // Server settings
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    baseUrl: process.env.BASE_URL || 'http://localhost:5000',
    environment: process.env.NODE_ENV || 'development',
    apiPath: '/api',
  },
  
  // MQTT configuration
  mqtt: {
    broker: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
    clientId: process.env.MQTT_CLIENT_ID || 'iot-edge-backend',
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
  },
  
  // API limits
  apiLimits: {
    requestsPerMinute: parseInt(process.env.RATE_LIMIT || '100', 10),
    maxPayloadSize: '5mb',
  },
  
  // AI model configurations
  ai: {
    openAiApiKey: process.env.OPENAI_API_KEY || '',
    googleAiApiKey: process.env.GOOGLE_AI_API_KEY || '',
    defaultModel: process.env.DEFAULT_AI_MODEL || 'gpt-4o',
    ollamaEndpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
    ollamaDefaultModel: process.env.OLLAMA_DEFAULT_MODEL || 'llama3',
  },
};

module.exports = config;