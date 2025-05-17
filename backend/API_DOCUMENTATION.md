# IOT-Edge API Documentation

## Overview

The IOT-Edge platform provides a RESTful API for accessing and managing IoT sensors, sensor data, monitoring systems, and notifications for industrial environments. This document details all available endpoints, authentication methods, expected request/response formats, and error handling.

## Base URL

```
http://localhost:5000/api
```

For production deployments, replace with your actual domain.

## Authentication

Most endpoints require authentication using JWT (JSON Web Tokens). The authentication flow is as follows:

1. Obtain a JWT token by authenticating via the `/api/auth/login` endpoint
2. Include the token in subsequent requests using the Authorization header:
   ```
   Authorization: Bearer <your_token>
   ```
3. Tokens expire after 24 hours by default (configurable via JWT_EXPIRES_IN environment variable)

### Authentication Endpoints

#### POST /auth/login

Authenticates a user and returns a JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "email": "admin@example.com"
  }
}
```

**Error Responses:**

- 400 Bad Request: Missing credentials
```json
{
  "error": "MISSING_CREDENTIALS",
  "message": "Username and password are required"
}
```

- 401 Unauthorized: Invalid credentials
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid username or password"
}
```

#### POST /auth/logout

Invalidates the current JWT token.

**Request:**
Headers:
```
Authorization: Bearer <your_token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

#### GET /auth/status

Checks the authentication status of the current token.

**Request:**
Headers:
```
Authorization: Bearer <your_token>
```

**Response (200 OK) - Authenticated:**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "email": "admin@example.com"
  }
}
```

**Response (200 OK) - Not Authenticated:**
```json
{
  "authenticated": false,
  "message": "No active session"
}
```

## Health Endpoints

#### GET /health

Returns the overall system health status.

**Response (200 OK) - Healthy:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-14T12:00:00Z"
}
```

#### GET /health/database

Checks database connectivity.

**Response (200 OK) - Connected:**
```json
{
  "status": "connected",
  "timestamp": "2024-03-14T12:00:00Z"
}
```

#### GET /health/queues

Checks message queue system status.

**Response (200 OK) - Healthy:**
```json
{
  "status": "ok",
  "queues": {
    "sensor-data": "active",
    "alerts": "active"
  },
  "timestamp": "2024-03-14T12:00:00Z"
}
```

## Sensor Data Endpoints

#### POST /sensor-data

Submit new sensor data.

**Request:**
```json
{
  "sensorId": "sensor123",
  "value": 25.5,
  "unit": "C",
  "timestamp": "2024-03-14T12:00:00Z"
}
```

**Response (202 Accepted):**
```json
{
  "status": "accepted",
  "message": "Telemetry data queued for processing"
}
```

#### GET /sensor-data/latest

Get latest sensor readings.

**Query Parameters:**
- `sensorId` (optional): Filter by sensor ID
- `type` (optional): Filter by sensor type
- `limit` (optional): Number of records to return (default: 10)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "sensor_id": "sensor123",
      "value": 25.5,
      "unit": "C",
      "timestamp": "2024-03-14T12:00:00Z",
      "name": "Temperature Sensor 1",
      "type": "temperature",
      "status": "active"
    }
  ]
}
```

## Device Management Endpoints

#### GET /devices

List all IoT devices.

**Response (200 OK):**
```json
{
  "devices": [
    {
      "id": "device123",
      "name": "Temperature Sensor",
      "type": "sensor",
      "status": "online",
      "lastSeen": "2024-03-14T12:00:00Z"
    }
  ]
}
```

#### GET /devices/:deviceId/twin

Get device twin properties.

**Response (200 OK):**
```json
{
  "deviceId": "device123",
  "properties": {
    "reported": {
      "temperature": 25.5,
      "humidity": 60
    },
    "desired": {
      "targetTemperature": 22
    }
  }
}
```

#### POST /devices/:deviceId/methods/:methodName

Invoke a device method.

**Request:**
```json
{
  "payload": {
    "parameter1": "value1"
  }
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "payload": {
    "result": "method executed successfully"
  }
}
```

## Real-time Communication

### WebSocket Connection

Connect to WebSocket server:
```javascript
const socket = io('http://localhost:5000', {
  path: '/api/socket'
});
```

Available events:
- `sensor:update`: Real-time sensor data updates
- `alert:new`: New alerts and notifications
- `device:status`: Device status changes

### Server-Sent Events (SSE)

Connect to SSE endpoint:
```javascript
const eventSource = new EventSource('/api/stream');
```

Available events:
- `sensor-update`: Real-time sensor data updates
- `alert`: New alerts and notifications
- `device-status`: Device status changes

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    // Optional additional error details
  }
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | INVALID_REQUEST | Invalid request parameters or body |
| 401 | UNAUTHORIZED | Authentication required |
| 401 | INVALID_CREDENTIALS | Invalid username or password |
| 401 | INVALID_TOKEN | Invalid authentication token |
| 401 | TOKEN_EXPIRED | Authentication token has expired |
| 403 | ACCESS_DENIED | Insufficient privileges |
| 404 | NOT_FOUND | Resource not found |
| 405 | METHOD_NOT_ALLOWED | HTTP method not allowed for this endpoint |
| 429 | RATE_LIMITED | Too many requests |
| 500 | SERVER_ERROR | Internal server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

## Database Schema

The IOT-Edge platform uses a MySQL database with the following schema:

### users

Stores user account information.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| username | VARCHAR(50) | Unique username |
| password | VARCHAR(255) | Hashed password |
| email | VARCHAR(100) | User email address |
| role | VARCHAR(20) | User role (admin, user, technician) |
| created_at | TIMESTAMP | Account creation timestamp |
| last_login | TIMESTAMP | Last login timestamp |
| status | VARCHAR(20) | Account status (active, inactive) |

### sensors

Stores sensor metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| name | VARCHAR(100) | Sensor name |
| type | VARCHAR(50) | Sensor type (temperature, humidity, power, etc.) |
| model | VARCHAR(100) | Sensor model number |
| manufacturer | VARCHAR(100) | Sensor manufacturer |
| serial_number | VARCHAR(100) | Unique serial number |
| location | VARCHAR(100) | Physical location |
| position | VARCHAR(100) | Specific position within location |
| installed_date | TIMESTAMP | Installation date |
| status | VARCHAR(20) | Status (active, inactive, maintenance) |
| last_reading | FLOAT | Last recorded value |
| last_updated | TIMESTAMP | Last reading timestamp |
| unit | VARCHAR(20) | Measurement unit |
| min_threshold | FLOAT | Minimum acceptable value |
| max_threshold | FLOAT | Maximum acceptable value |
| accuracy | FLOAT | Sensor accuracy |
| calibration_date | TIMESTAMP | Last calibration date |
| next_calibration_date | TIMESTAMP | Next scheduled calibration |
| firmware_version | VARCHAR(50) | Current firmware version |
| firmware_updated | TIMESTAMP | Last firmware update date |

### sensor_data

Stores individual sensor readings.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary Key |
| sensor_id | INT | Foreign Key to sensors.id |
| value | FLOAT | Recorded value |
| unit | VARCHAR(20) | Measurement unit |
| timestamp | TIMESTAMP | Reading timestamp |
| status | VARCHAR(20) | Reading status (normal, warning, critical) |

### cold_rooms

Stores cold room information.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| name | VARCHAR(100) | Cold room name |
| location | VARCHAR(100) | Physical location |
| status | VARCHAR(20) | Status (operational, maintenance, critical) |
| capacity | VARCHAR(50) | Storage capacity |
| current_load | VARCHAR(50) | Current usage percentage |
| temperature | FLOAT | Current temperature |
| humidity | INT | Current humidity percentage |
| min_temperature | FLOAT | Minimum acceptable temperature |
| max_temperature | FLOAT | Maximum acceptable temperature |
| target_temperature | FLOAT | Target temperature |
| min_humidity | INT | Minimum acceptable humidity |
| max_humidity | INT | Maximum acceptable humidity |
| target_humidity | INT | Target humidity |
| last_maintenance | TIMESTAMP | Last maintenance date |
| next_maintenance | TIMESTAMP | Next scheduled maintenance |

### electrical_systems

Stores electrical system information.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| name | VARCHAR(100) | System name |
| location | VARCHAR(100) | Physical location |
| status | VARCHAR(20) | Status (operational, standby, maintenance, critical) |
| current_power_usage | INT | Current power usage in kW |
| max_capacity | INT | Maximum capacity in kW |
| voltage | INT | Voltage |
| last_maintenance | TIMESTAMP | Last maintenance date |
| next_maintenance | TIMESTAMP | Next scheduled maintenance |
| efficiency | FLOAT | System efficiency percentage |
| power_factor | FLOAT | Power factor |

### notifications

Stores system notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| type | VARCHAR(50) | Notification type (alert, maintenance, info) |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Detailed message |
| timestamp | TIMESTAMP | Creation timestamp |
| read | BOOLEAN | Read status |
| read_at | TIMESTAMP | When notification was read |
| severity | VARCHAR(20) | Severity level (info, warning, critical) |
| source_type | VARCHAR(50) | Source entity type |
| source_id | INT | Source entity ID |

### maintenance_records

Stores maintenance history.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| entity_type | VARCHAR(50) | Entity type (sensor, cold_room, electrical_system) |
| entity_id | INT | Entity ID |
| type | VARCHAR(50) | Maintenance type |
| description | TEXT | Detailed description |
| performed_at | TIMESTAMP | When maintenance was performed |
| technician | VARCHAR(100) | Technician name |
| notes | TEXT | Additional notes |

### alert_rules

Stores alert configuration rules.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| name | VARCHAR(100) | Rule name |
| entity_type | VARCHAR(50) | Entity type to monitor |
| entity_id | INT | Specific entity ID (or NULL for all) |
| condition_type | VARCHAR(50) | Condition type (above, below, between, etc.) |
| threshold_value1 | FLOAT | Primary threshold value |
| threshold_value2 | FLOAT | Secondary threshold value (for range conditions) |
| severity | VARCHAR(20) | Alert severity (info, warning, critical) |
| message_template | TEXT | Template for alert message |
| enabled | BOOLEAN | Whether rule is enabled |
| cooldown_minutes | INT | Minimum minutes between alerts |

### control_panels

Stores logical or physical control panels for UI/UX or device management.

| Column      | Type         | Description                                 |
|------------|--------------|---------------------------------------------|
| id         | INT          | Primary Key                                 |
| name       | VARCHAR(100) | Panel name                                  |
| description| TEXT         | Description                                 |
| location   | VARCHAR(100) | Physical or logical location                 |
| type       | VARCHAR(50)  | Panel type (dashboard, physical, mobile, etc)|
| created_at | TIMESTAMP    | Creation timestamp                          |
| updated_at | TIMESTAMP    | Last update timestamp                       |

### control_settings

Stores key-value settings for each control panel or system-wide.

| Column        | Type         | Description                                 |
|---------------|--------------|---------------------------------------------|
| id            | INT          | Primary Key                                 |
| panel_id      | INT          | Foreign Key to control_panels.id            |
| setting_key   | VARCHAR(100) | Setting key                                 |
| setting_value | TEXT         | Setting value                               |
| description   | TEXT         | Description                                 |
| data_type     | ENUM         | Data type (string, integer, boolean, etc.)  |
| updated_at    | TIMESTAMP    | Last update timestamp                       |

### user_preferences

Stores per-user preferences for UI/UX and notifications.

| Column           | Type         | Description                                 |
|------------------|--------------|---------------------------------------------|
| id               | INT          | Primary Key                                 |
| user_id          | INT          | Foreign Key to users.id                     |
| preference_key   | VARCHAR(100) | Preference key                              |
| preference_value | TEXT         | Preference value                            |
| data_type        | ENUM         | Data type (string, integer, boolean, etc.)  |
| updated_at       | TIMESTAMP    | Last update timestamp                       |

### device_policies

Stores enforceable policies for device operation and security.

| Column        | Type         | Description                                 |
|---------------|--------------|---------------------------------------------|
| id            | INT          | Primary Key                                 |
| device_id     | INT          | Foreign Key to devices.id                   |
| policy_key    | VARCHAR(100) | Policy key                                  |
| policy_value  | TEXT         | Policy value                                |
| description   | TEXT         | Description                                 |
| data_type     | ENUM         | Data type (string, integer, boolean, etc.)  |
| enforced      | BOOLEAN      | Whether policy is enforced                  |
| updated_at    | TIMESTAMP    | Last update timestamp                       |

### automation_rules

Stores automation rules for triggers, schedules, and actions.

| Column         | Type         | Description                                 |
|----------------|--------------|---------------------------------------------|
| id             | INT          | Primary Key                                 |
| name           | VARCHAR(100) | Rule name                                   |
| description    | TEXT         | Description                                 |
| trigger_type   | VARCHAR(50)  | Trigger type (sensor, schedule, manual, etc.)|
| trigger_config | JSON         | Trigger configuration                       |
| action_type    | VARCHAR(50)  | Action type (notification, device_control, etc.)|
| action_config  | JSON         | Action configuration                        |
| enabled        | BOOLEAN      | Whether rule is enabled                     |
| created_by     | INT          | Foreign Key to users.id                     |
| created_at     | TIMESTAMP    | Creation timestamp                          |
| updated_at     | TIMESTAMP    | Last update timestamp                       |

### audit_logs

Stores audit logs for compliance and traceability.

| Column      | Type         | Description                                 |
|-------------|--------------|---------------------------------------------|
| id          | BIGINT       | Primary Key                                 |
| user_id     | INT          | Foreign Key to users.id                     |
| action      | VARCHAR(100) | Action performed                            |
| entity_type | VARCHAR(50)  | Entity type (sensor, device, etc.)          |
| entity_id   | INT          | Entity ID                                   |
| details     | TEXT         | Additional details                          |
| timestamp   | TIMESTAMP    | When the action occurred                    |

## Performance Considerations

For optimal performance when working with the API, consider the following recommendations:

1. **Use Filtering**: Always use query parameters to filter data as needed to reduce response payload size.

2. **Pagination**: For endpoints that return multiple items, use the `limit` and `offset` parameters to implement pagination.

3. **Data Aggregation**: Use the aggregation parameter for sensor data queries spanning long periods to reduce data transfer and improve visualization performance.

4. **Caching**: Consider implementing client-side caching for frequently accessed data that doesn't change often, such as sensor metadata.

5. **Batch Operations**: When adding multiple sensor readings, batch them into a single request where possible to reduce HTTP overhead.

6. **Compression**: All API responses support GZIP compression. Ensure your client sends the appropriate `Accept-Encoding` header.

## Security Best Practices

When integrating with the IOT-Edge API, follow these security best practices:

1. **Token Security**: Store JWT tokens securely and never expose them in client-side code or URLs.

2. **HTTPS**: Always use HTTPS in production environments to protect data in transit.

3. **Token Refresh**: Implement proper token refresh flows to maintain sessions without requiring frequent re-authentication.

4. **Minimal Privileges**: Use accounts with minimal required privileges for different integration scenarios.

5. **Input Validation**: Always validate input on the client side before sending requests to reduce the risk of injection attacks.

6. **Error Handling**: Implement proper error handling to avoid exposing sensitive information to end users.

7. **Rate Limiting**: Respect API rate limits to avoid being throttled or blocked.

## Versioning Strategy

The IOT-Edge API follows Semantic Versioning (SemVer) principles:

1. **MAJOR** version increments indicate incompatible API changes
2. **MINOR** version increments indicate new functionality in a backward-compatible manner
3. **PATCH** version increments indicate backward-compatible bug fixes

The current API version can be checked via the health endpoint, which returns the version number in the response.

## Support and Troubleshooting

For support with API integration, please refer to the following resources:

1. Review the [API Integration Troubleshooting Guide](./docs/API_INTEGRATION.md)
2. Check server logs for detailed error information
3. Use the diagnostic endpoints to verify system status
4. Contact support at support@iot-edge.example.com
