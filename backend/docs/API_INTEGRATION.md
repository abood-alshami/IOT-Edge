# API Integration Troubleshooting

This document provides guidance on troubleshooting and resolving API integration issues between the Next.js backend and React frontend.

## Common Issues and Solutions

### 1. 404 (Not Found) Errors

When encountering 404 errors for API endpoints, check the following:

#### Problem: Missing API Route Files

**Solution:** Create the appropriate API route file in the correct location.

Example path structure:
- `/api/health` → `backend/pages/api/health.js`
- `/api/monitoring/electrical-systems` → `backend/pages/api/monitoring/electrical-systems/index.js`

#### Problem: URL Prefix Issues

**Solution:** Ensure that the middleware correctly handles URL prefixes.

The middleware now properly handles URLs with and without the `/api` prefix for frontend compatibility:

```javascript
// Fix URL format for frontend compatibility
if (req.url && !req.url.startsWith('/api/') && !req.originalUrl) {
  req.originalUrl = req.url;
  req.url = `/api${req.url}`;
}
```

### 2. 401 (Unauthorized) Errors

When encountering 401 errors for endpoints that shouldn't require authentication:

#### Problem: Authentication Not Properly Disabled

**Solution:** 
1. Ensure that the endpoint's export statement includes `{ auth: false }`
   ```javascript
   export default withApi(handlerFunction, { auth: false });
   ```

2. Make sure the middleware properly respects this flag:
   ```javascript
   // Skip authentication check completely if auth option is false
   if (options.auth === false) {
     // Skip authentication but fix URL if needed
     if (req.url && !req.url.startsWith('/api/') && !req.originalUrl) {
       req.originalUrl = req.url;
       req.url = `/api${req.url}`;
     }
     
     // Process the request with the handler directly
     return handler(req, res);
   }
   ```

### 3. Database Connection Errors

When the API returns 500 errors due to database connection issues:

#### Problem: Database Query Errors in Development Environment

**Solution:** 
Implement mock data functionality for development purposes as we've done with endpoints like:
- `/api/sensor-data`
- `/api/monitoring/electrical-systems`

Example mock data implementation:
```javascript
// Generate mock sensor data
const generateMockData = (id, count) => {
  const now = new Date();
  const data = [];
  const sensorTypes = {
    "1": { type: "temperature", unit: "°C", baseValue: 22 },
    // ...
  };
  
  // Generate and return mock data
  // ...
};
```

## Recently Implemented API Endpoints

### Monitoring Endpoints
- `/api/monitoring` - Overview of system monitoring
- `/api/monitoring/cold-room` - Cold room monitoring data
- `/api/monitoring/cold-room/[id]` - Individual cold room data
- `/api/monitoring/electrical-systems` - Electrical systems monitoring

### Sensor Data Endpoints
- `/api/sensor-data` - Get sensor data with filtering options
- `/api/sensors/data/latest` - Get latest sensor readings

### Report Endpoints
- `/api/reports/sensor-data` - Get sensor data reports with various parameters

## Authentication Changes

For development purposes, we've disabled authentication for most API endpoints:

1. Updated the middleware to properly bypass authentication checks when the `auth: false` option is provided
2. Modified all monitoring, sensor data, and reporting endpoints to use `{ auth: false }`

In a production environment, you would need to re-enable authentication for sensitive endpoints.

## ESM Export Syntax

Next.js requires proper ES module syntax for exports. We updated the middleware to use:

```javascript
// Correct ESM export syntax
export { withApi, cors, authenticate, runMiddleware };

// Instead of CommonJS style
module.exports = { withApi, cors, authenticate, runMiddleware };
```

## Testing API Endpoints

To test if an API endpoint is working correctly:

```bash
# Test an endpoint with curl
curl http://localhost:5000/api/monitoring

# Test with query parameters
curl "http://localhost:5000/api/reports/sensor-data?sensorType=temperature&interval=hourly"
```

## Adding New API Endpoints

When adding new API endpoints:

1. Create the appropriate file in the `pages/api` directory
2. Use the withApi middleware with the appropriate authentication setting
3. Follow the existing patterns for error handling and response formats

Example:
```javascript
import { withApi } from '../../../middleware';

const myEndpointHandler = async (req, res) => {
  try {
    // Handle request
    return res.status(200).json({ data: "response data" });
  } catch (error) {
    console.error('Error in endpoint:', error);
    return res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Error message'
    });
  }
};

export default withApi(myEndpointHandler, { auth: false });
``` 