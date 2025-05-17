# IOT-Edge Backend Scripts

This directory contains utility scripts for the IOT-Edge backend.

## Database Initialization Script

**File:** `init-db.js`

This script initializes the MySQL database for the IOT-Edge application:

- Creates the database if it doesn't exist
- Creates all required tables
- Populates tables with sample data for development

### Usage

```bash
npm run init-db
# or directly:
node scripts/init-db.js
```

## Mock Data Generation Script

**File:** `generate-mock-data.js`

This script generates mock data for development and testing without requiring a database connection. It creates JSON files with mock data that can be used when the database is unavailable.

### Usage

```bash
npm run mock-data
# or directly:
node scripts/generate-mock-data.js
```

### Generated Data

The script generates the following mock data files in the `mock-data` directory:

- `sensors.json` - List of sensors with their properties
- `sensor-readings-SNS-XXXX.json` - Historical readings for specific sensors
- `latest-sensor-data.json` - Latest readings from all sensors
- `notifications.json` - System notifications
- `monitoring.json` - Monitoring dashboard data
- `reports.json` - Report data for different sensor types and time intervals

## How Mock Data Works

The application uses a fallback mechanism to use mock data when the database connection fails:

1. The database utility first attempts to connect to MySQL
2. If the connection fails, it sets `usingMockData` to true
3. API handlers check this flag and use mock data instead of querying the database

You can also force the use of mock data in your code:

```javascript
import db from '../utils/database';
db.useMockData();
```

This is useful for development when you don't want to set up a MySQL server.

## Data Retention and Archiving Script

This script helps maintain optimal database performance and compliance by automatically deleting or archiving old sensor data from the `sensor_data` table.

### Purpose
- Remove or archive sensor data older than a configurable retention period (default: 1 year).
- Keep the database performant and storage requirements manageable.
- Support regulatory and audit requirements by optionally archiving instead of deleting.

### Usage
- Run manually:
  ```bash
  node backend/scripts/data-retention.js
  ```
- Or schedule with cron for regular cleanup.

### Configuration
- Edit the script to set the retention period (e.g., 12 months).
- Choose between delete or archive mode.
- Optionally, configure archiving to move old records to a separate table or export to a file.

**Warning:** Always back up your database before running bulk delete/archive operations. 