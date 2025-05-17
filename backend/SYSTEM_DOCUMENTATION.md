# IOT-Edge System Documentation

## System Architecture Overview

The IOT-Edge backend is a comprehensive IoT platform built using the following technologies:

1. **Server Framework**: Next.js + Express.js
2. **Database**: MySQL
3. **Authentication**: JWT-based authentication 
4. **API**: RESTful API design pattern
5. **Real-time Communication**: WebSocket and Server-Sent Events (SSE)

The system follows a modular architecture with:
- API endpoints organized by domain (devices, sensor-data, auth, etc.)
- Middleware for cross-cutting concerns like authentication
- Utility functions for database operations
- Configuration management

## Core Components

### 1. Server Configuration (server.js)

The main Express server provides:
- API routing and middleware integration
- Authentication endpoints (login, logout, status)
- Static file serving in production
- Health check endpoints
- WebSocket and SSE support for real-time communication

### 2. Database Layer (config/db.js)

Manages database connections with:
- Connection pooling for efficiency
- Query execution helpers
- Automatic reconnection handling

### 3. Authentication System (middleware/auth.js)

Provides:
- JWT token verification
- Role-based access control
- Session management

### 4. API Routes

Organized into logical domains:
- `/api/devices` - Device management
- `/api/sensor-data` - Sensor readings management
- `/api/health` - System health monitoring
- `/api/auth` - Authentication endpoints

### 5. Real-time Communication

The system provides two methods for real-time communication:

1. **WebSocket (Socket.IO)**
   - Path: `/api/socket`
   - Events:
     - `sensor:update`: Real-time sensor data updates
     - `alert:new`: New alerts and notifications
     - `device:status`: Device status changes

2. **Server-Sent Events (SSE)**
   - Path: `/api/stream`
   - Events:
     - `sensor-update`: Real-time sensor data updates
     - `alert`: New alerts and notifications
     - `device-status`: Device status changes

## Project Structure

```
backend/
├── api/              # API routes and endpoints
├── config/           # Configuration files
├── docs/             # Documentation
├── k8s/              # Kubernetes configuration files
├── middleware/       # Custom middleware
├── pages/            # Next.js pages and API routes
├── scripts/          # Utility scripts
├── utils/            # Utility functions
├── .env              # Environment variables
├── API_DOCUMENTATION.md # API documentation
├── SYSTEM_DOCUMENTATION.md # System documentation
├── deploy.sh         # Deployment script
├── docker-compose.yml # Docker compose configuration
├── Dockerfile        # Docker configuration
├── next.config.js    # Next.js configuration
├── next-env.d.ts     # Next.js TypeScript declarations
├── package.json      # Project dependencies
├── package-lock.json # Dependency lock file
├── schema.sql        # Database schema
└── tsconfig.json     # TypeScript configuration
```

## Environment Configuration

The system requires the following environment variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=iotedge
DB_PASSWORD=iotedge_password
DB_NAME=iotedge

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# API Configuration
API_RATE_LIMIT=100
API_RATE_WINDOW=15m

# Monitoring Configuration
ENABLE_MONITORING=true
MONITORING_INTERVAL=60
```

## Deployment

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t iot-edge-backend .
```

2. Run the container:
```bash
docker run -p 5000:5000 \
  -e DB_HOST=host.docker.internal \
  -e REDIS_HOST=host.docker.internal \
  -e JWT_SECRET=your_secret_key \
  iot-edge-backend
```

### Docker Compose

For local development with all dependencies:
```bash
docker-compose up -d
```

### Kubernetes Deployment

The `k8s/` directory contains Kubernetes configuration files for production deployment:
- `deployment.yaml`: Main application deployment
- `service.yaml`: Service configuration
- `configmap.yaml`: Environment configuration
- `secret.yaml`: Sensitive data (secrets)

## Error Handling

The system implements a standardized error handling approach:

```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  
  res.status(err.statusCode || 500).json({
    error: err.code || 'SERVER_ERROR',
    message: err.message || 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Custom error class
class APIError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
```

## Security Considerations

1. **Authentication**
   - JWT-based authentication
   - Token expiration and refresh mechanism
   - Role-based access control

2. **API Security**
   - Rate limiting
   - Input validation
   - SQL injection prevention
   - CORS configuration

3. **Data Protection**
   - Environment variables for sensitive data
   - Secure database connections
   - Encrypted communication

## Monitoring and Health Checks

The system provides several health check endpoints:

1. **Overall Health**
   - Endpoint: `GET /api/health`
   - Checks: Basic system status

2. **Database Health**
   - Endpoint: `GET /api/health/database`
   - Checks: Database connectivity

3. **Queue Health**
   - Endpoint: `GET /api/health/queues`
   - Checks: Message queue system status

## Development Guidelines

1. **Code Style**
   - Follow ESLint configuration
   - Use TypeScript for type safety
   - Write unit tests for new features

2. **API Development**
   - Follow RESTful principles
   - Document all endpoints
   - Implement proper error handling
   - Add input validation

3. **Database**
   - Use prepared statements
   - Implement connection pooling
   - Handle transactions properly

4. **Security**
   - Never commit sensitive data
   - Validate all input
   - Implement proper authentication
   - Use environment variables

## Identified Issues and Solutions

### 1. Authentication Inconsistency

**Issue:** The system implements two competing authentication methods - simple token-based authentication with in-memory sessions in server.js, but JWT-based auth in middleware/auth.js.

**Solution:**
```javascript
// In server.js, standardize on JWT authentication
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.post('/api/auth/login', (req, res) => {
  // Find user with matching credentials
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // Return user and token
  return res.status(200).json({ token, user: {...} });
});
```

### 2. Hardcoded Credentials

**Issue:** The server.js file contains hardcoded user credentials and database.js has default database credentials.

**Solution:**
1. Create a `.env.example` file:
```
# Database Configuration
DB_HOST=localhost
DB_USER=iot_edge
DB_PASSWORD=
DB_NAME=iot_db
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development
```

2. Update database connection code to require environment variables:
```javascript
// Enhanced environment variable validation
function getRequiredEnvVar(name, defaultValue = null) {
  const value = process.env[name] || defaultValue;
  if (value === null) {
    throw new Error(`Required environment variable ${name} is missing`);
  }
  return value;
}

const dbConfig = {
  host: getRequiredEnvVar('DB_HOST', 'localhost'),
  user: getRequiredEnvVar('DB_USER'),
  password: getRequiredEnvVar('DB_PASSWORD'),
  database: getRequiredEnvVar('DB_NAME'),
  // ...
};
```

### 3. Database Connection Logic Issues

**Issue:** The database.js module has inconsistent error handling and doesn't properly check for connection states.

**Solution:**
```javascript
// Enhanced connection management
async function getConnection(app) {
  if (!app || !app.locals.promisePool) {
    await initializeDb(app);
  }
  
  try {
    // Test the connection before returning
    await app.locals.promisePool.query('SELECT 1');
    return app.locals.promisePool;
  } catch (err) {
    console.error("Database connection lost, reconnecting...");
    await initializeDb(app);
    return app.locals.promisePool;
  }
}
```

### 4. Missing Input Validation

**Issue:** Many API endpoints have minimal input validation, which can lead to security vulnerabilities.

**Solution:**
```javascript
const { body, validationResult } = require('express-validator');

// Define validation middleware
const validateSensorData = [
  body('sensorId').isInt().withMessage('Sensor ID must be an integer'),
  body('value').isFloat().withMessage('Value must be a number'),
  body('unit').isString().trim().notEmpty().withMessage('Unit is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Use in routes
app.post('/api/sensor-data', validateSensorData, addSensorData);
```

### 5. SQL Injection Vulnerabilities

**Issue:** Some database queries are built using string concatenation which can lead to SQL injection.

**Solution:**
```javascript
// Instead of:
let sql = 'SELECT * FROM sensor_data WHERE ' + conditions.join(' AND ');

// Use:
let sql = 'SELECT * FROM sensor_data WHERE ' + conditions.map(() => '?').join(' AND ');
```

### 6. Inconsistent Error Handling

**Issue:** Error handling varies across different API endpoints with inconsistent error formats.

**Solution:**
```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  
  // Standard error response format
  res.status(err.statusCode || 500).json({
    error: err.code || 'SERVER_ERROR',
    message: err.message || 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Custom error class
class APIError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
```

### 7. Insufficient Logging

**Issue:** The application uses console.log/error which isn't suitable for production.

**Solution:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Replace console.log/error with logger
logger.info('Server started on port', PORT);
logger.error('Database connection error:', error);
```

### 8. Missing API Documentation

**Issue:** While there is an API_DOCUMENTATION.md file, the API endpoints lack proper OpenAPI/Swagger documentation.

**Solution:**
```javascript
// Add Swagger UI to your Express app
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IoT Edge API',
      version: '1.0.0',
      description: 'API documentation for IoT Edge platform'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ]
  },
  apis: ['./api/**/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
```

### 9. Security Headers Missing

**Issue:** The server doesn't set essential security headers.

**Solution:**
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 10. Lack of Request Rate Limiting

**Issue:** There's no protection against API abuse through rate limiting.

**Solution:**
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Apply to all API routes
app.use('/api/', apiLimiter);
```

## Implementation Plan

Here's a prioritized plan to address these issues:

### High Priority (Security Issues)
1. Fix authentication inconsistencies
2. Remove hardcoded credentials
3. Address SQL injection vulnerabilities
4. Implement input validation

### Medium Priority (Stability Issues)
1. Improve database connection logic
2. Standardize error handling
3. Implement proper logging
4. Add security headers and rate limiting

### Lower Priority (Documentation/Maintainability)
1. Add OpenAPI/Swagger documentation
2. Refactor duplicate code
3. Implement unit and integration tests

## Security Best Practices

### Authentication
- Use JWT tokens with appropriate expiration times
- Store tokens securely (HttpOnly cookies)
- Implement refresh token rotation
- Validate user roles for access control

### Data Security
- Use prepared statements for all database queries
- Validate all user input
- Implement proper error handling
- Use HTTPS in production

### API Security
- Implement rate limiting
- Add security headers (CORS, Content-Security-Policy, etc.)
- Validate content types
- Sanitize response data

## Performance Optimization

### Database
- Use connection pooling
- Optimize common queries
- Implement proper indexing on frequently queried columns
- Use pagination for large datasets

### API
- Implement caching for frequently accessed data
- Use compression middleware
- Return only necessary data in responses
- Implement efficient error handling

## Deployment Recommendations

### Environment-specific Configuration
- Use environment variables for configuration
- Create separate configurations for development, testing, and production
- Never commit sensitive information to version control

### Containerization
- Package the application as a Docker container
- Use Docker Compose for local development
- Create Kubernetes configurations for production deployment

### Monitoring & Logging
- Implement structured logging
- Set up centralized log collection
- Implement health checks and monitoring
- Configure alerts for system issues

## Next Steps

1. **Dependency Updates**: Review and update outdated libraries
2. **Code Refactoring**: Remove duplicate code and improve modularity
3. **Test Coverage**: Implement unit and integration tests
4. **Documentation**: Improve in-code documentation and update API documentation
5. **Continuous Integration**: Set up CI/CD pipelines for automated testing and deployment