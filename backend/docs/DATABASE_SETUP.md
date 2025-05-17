# Database Setup for IOT-Edge

This document explains how to set up and configure the database for the IOT-Edge application.

## Local Development Setup

### Prerequisites

- MySQL Server 8.0 or later
- Node.js 18.x or later
- npm 10.x or later

### Option 1: Using MySQL Server

1. **Install MySQL Server**

   Follow the installation instructions for your operating system:
   - [Windows](https://dev.mysql.com/downloads/installer/)
   - [macOS](https://dev.mysql.com/downloads/mysql/)
   - [Linux](https://dev.mysql.com/downloads/mysql/)

   For Ubuntu/Debian:
   ```bash
   sudo apt update
   sudo apt install mysql-server
   ```

2. **Secure MySQL Installation**

   ```bash
   sudo mysql_secure_installation
   ```

   This will prompt you to set a root password and other security settings.

3. **Create a Database User**

   ```bash
   sudo mysql -u root -p
   ```

   In the MySQL shell:
   ```sql
   CREATE USER 'iotedge'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON *.* TO 'iotedge'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

4. **Update Environment Variables**

   Create or edit the `.env` file in the `backend` directory:
   ```
   DB_HOST=localhost
   DB_USER=iotedge
   DB_PASSWORD=your_password
   DB_NAME=iotedge
   DB_PORT=3306
   ```

5. **Initialize the Database and User**

   You can use the provided SQL script to create the database and user:
   ```bash
   mysql -u root -p < backend/ff.sql
   ```
   This will:
   - Create the `iotedge` database if it doesn't exist
   - Create the `iotedge` user (if not present)
   - Grant all privileges on the database to the user
   - Flush privileges

   If you need to reset the user or fix authentication plugin issues, run:
   ```sql
   ALTER USER 'iotedge'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
   FLUSH PRIVILEGES;
   ```

### Option 2: Using Mock Data (No Database Required)

If you don't want to set up a MySQL server, you can use mock data:

1. **Generate Mock Data**

   ```bash
   cd backend
   npm run mock-data
   ```

2. **Configure to Use Mock Data**

   The application will automatically fall back to using mock data if it can't connect to the database.

## Database Schema

The IOT-Edge application uses the following tables:

### sensors

Stores information about all sensors in the system.

| Column        | Type         | Description                               |
|---------------|--------------|-------------------------------------------|
| id            | VARCHAR(20)  | Primary key                               |
| name          | VARCHAR(100) | Sensor name                               |
| type          | VARCHAR(50)  | Sensor type (temperature, humidity, etc.) |
| location      | VARCHAR(100) | Physical location of the sensor           |
| status        | VARCHAR(20)  | Current status (Online, Offline, etc.)    |
| last_reading  | FLOAT        | Most recent sensor reading                |
| last_updated  | DATETIME     | When the sensor was last updated          |
| created_at    | TIMESTAMP    | When the sensor was added to the system   |

### sensor_data

Stores historical readings from all sensors.

| Column      | Type        | Description                            |
|-------------|-------------|----------------------------------------|
| id          | INT         | Primary key (auto-increment)           |
| sensor_id   | VARCHAR(20) | Foreign key referencing sensors.id     |
| value       | FLOAT       | The sensor reading value               |
| unit        | VARCHAR(20) | Unit of measurement                    |
| timestamp   | DATETIME    | When the reading was taken             |

### Data Retention and Archiving Policy

To ensure optimal performance and regulatory compliance, the IOT-Edge platform implements a data retention and archiving policy for the `sensor_data` table:

- **Default Policy:** Sensor data older than 1 year is automatically deleted or archived, depending on your configuration.
- **Rationale:** IoT systems generate large volumes of data. Retaining only recent data keeps queries fast and storage requirements manageable, while still supporting compliance and audit needs.
- **How It Works:**
  - A scheduled backend job (Node.js script or MySQL event) runs periodically (e.g., weekly or monthly) to delete or move old records.
  - You can configure the retention period and archiving behavior in the backend scripts or environment variables.
- **Customizing Retention:**
  - Edit the backend data retention script in `backend/scripts/` to change the retention period or archiving logic.
  - For regulatory environments, you may choose to archive (move to a separate table or export) instead of delete.
- **Manual Purge:** You can also run the retention script manually for immediate cleanup.

**Example:**
- To keep only the last 12 months of data:
  - The script will delete or archive all `sensor_data` records where `timestamp` is older than 1 year from today.

**Note:**
- Always back up your database before running bulk delete or archive operations.
- For very large deployments, consider using table partitioning for even easier purging and archiving.

### Partitioning Strategy for Archived Sensor Data

To efficiently manage and query large volumes of historical sensor data, the `sensor_data_archive` table is partitioned by year using the `YEAR(timestamp)` value. This approach enables:
- Fast queries for specific time ranges
- Efficient purging or archiving of old data by simply dropping partitions
- Improved performance for analytics and compliance reporting

#### Implementation Details
- The main `sensor_data` table retains its foreign key for referential integrity and is not partitioned (MySQL does not support partitioning with foreign keys).
- The `sensor_data_archive` table is created as a copy of `sensor_data` but **without foreign keys**.
- The primary key is set to `(id, timestamp)` to satisfy MySQL's partitioning requirements.
- The table is partitioned by year:

```sql
ALTER TABLE sensor_data_archive PARTITION BY RANGE (YEAR(timestamp)) (
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

#### Maintenance Tips
- **Adding new partitions:** At the start of each year, add a new partition for the coming year.
- **Dropping old partitions:** To purge data older than a certain year, simply drop the corresponding partition:
  ```sql
  ALTER TABLE sensor_data_archive DROP PARTITION p2023;
  ```
- **Monitoring:** Use `SHOW TABLE STATUS` and `SELECT PARTITION_NAME FROM INFORMATION_SCHEMA.PARTITIONS WHERE TABLE_NAME = 'sensor_data_archive';` to monitor partition usage.
- **Archiving workflow:** Use the data retention script to move old data from `sensor_data` to `sensor_data_archive`.

#### Example Workflow
1. Data older than 1 year is moved from `sensor_data` to `sensor_data_archive`.
2. The archive table is partitioned by year for efficient storage and purging.
3. When data is no longer needed (e.g., after 5 years), drop the oldest partition.

**Note:** Always back up your data before dropping partitions or making schema changes.

### notifications

Stores system notifications and alerts.

| Column     | Type        | Description                               |
|------------|-------------|-------------------------------------------|
| id         | INT         | Primary key (auto-increment)              |
| title      | VARCHAR(100)| Notification title                        |
| message    | TEXT        | Notification message                      |
| type       | VARCHAR(20) | Type (info, warning, critical)            |
| read       | BOOLEAN     | Whether the notification has been read    |
| created_at | TIMESTAMP   | When the notification was created         |

### users

Stores user accounts for authentication.

| Column     | Type        | Description                               |
|------------|-------------|-------------------------------------------|
| id         | INT         | Primary key (auto-increment)              |
| username   | VARCHAR(50) | Unique username                           |
| password   | VARCHAR(100)| Hashed password                           |
| email      | VARCHAR(100)| Unique email address                      |
| role       | VARCHAR(20) | User role (admin, user)                   |
| last_login | DATETIME    | Last login timestamp                      |
| created_at | TIMESTAMP   | Account creation timestamp                |

### settings

Stores system configuration settings.

| Column      | Type        | Description                               |
|-------------|-------------|-------------------------------------------|
| id          | VARCHAR(50) | Primary key (setting name)                |
| value       | TEXT        | Setting value                             |
| description | TEXT        | Description of the setting                |
| updated_at  | TIMESTAMP   | When the setting was last updated         |

## Troubleshooting

### Connection Issues

If you encounter database connection issues:

1. **Check MySQL Service**

   ```bash
   sudo systemctl status mysql
   ```

   If MySQL is not running, start it:
   ```bash
   sudo systemctl start mysql
   ```

2. **Verify Credentials**

   Test your database credentials:
   ```bash
   mysql -u iotedge -p
   ```

3. **Check Environment Variables**

   Ensure your `.env` file has the correct database configuration.

4. **Use Mock Data**

   If database issues persist, the application will automatically fall back to using mock data. You can also force this behavior:

   ```javascript
   // In your code
   import db from '../utils/database';
   db.useMockData();
   ```

### Reset Database

To reset the database and start fresh:

```bash
cd backend
mysql -u iotedge -p
```

In the MySQL shell:
```sql
DROP DATABASE iotedge;
EXIT;
```

Then run the initialization script again:
```bash
npm run init-db
```

### MySQL Authentication Plugin Issues

If you see errors like `Access denied for user 'iotedge'@'localhost'` or plugin errors, ensure the user is set up with the correct authentication plugin:

```sql
ALTER USER 'iotedge'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
``` 