# IOT-Edge

## Overview
This project implements an IoT Edge solution for collecting, processing, and analyzing data from various IoT devices. It provides a scalable architecture for edge computing, enabling real-time data processing and decision-making at the network edge.

## Features
- Real-time data collection from IoT sensors and devices
- Edge-based data processing and filtering
- Local storage with cloud synchronization
- Secure device communication and authentication
- Configurable alert and notification system
- Dashboard for monitoring device status and data visualization
- Cold room and electrical systems monitoring
- Server-side rendering with Next.js frontend
- Internationalization support (English and Arabic)
- RESTful API for accessing and managing IoT systems

## System Architecture
The system consists of the following components:
- **Backend**: Express.js + Next.js server providing RESTful APIs and server-side rendering
- **Frontend**: Next.js frontend with MUI components and responsive design
- **Database**: MySQL for structured data storage
- **Authentication**: JWT-based user authentication and role management
- **Real-time Communication**: WebSocket and Server-Sent Events (SSE) for live updates

## Repository Structure
```
IOT-Edge-2/
├── backend/            # Express/Next.js backend server
│   ├── api/            # API endpoints and handlers
│   ├── components/     # Reusable server components
│   ├── config/         # Configuration files
│   ├── docs/           # API and system documentation
│   ├── middleware/     # Express middleware
│   ├── pages/          # Next.js pages and API routes
│   └── utils/          # Utility functions
├── frontend-next/      # Next.js frontend application
│   ├── api/            # API service files
│   ├── components/     # React components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Next.js pages
│   └── styles/         # CSS and styling
└── README.md           # Project documentation
```

## Getting Started
### Prerequisites
- Docker and Docker Compose
- Node.js (v14 or later)
- MySQL database
- npm 7.x or higher

### Installation
1. Clone the repository
   ```
   git clone https://github.com/abood-alshami/IOT-Edge.git
   cd IOT-Edge-2
   ```

2. Configure environment variables
   ```
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. Install dependencies and start the backend
   ```
   cd backend
   npm install
   npm run dev
   ```

4. Install dependencies and start the frontend
   ```
   cd frontend-next
   npm install
   npm run dev
   ```

5. Or use Docker for all services
   ```
   docker-compose up -d
   ```

## API Documentation
The backend provides a comprehensive RESTful API for accessing and managing IoT sensors, sensor data, monitoring systems, and notifications. Main endpoints include:

- **Authentication**: `/api/auth/login`, `/api/auth/logout`
- **Devices**: `/api/devices`, `/api/devices/:deviceId/twin`
- **Sensor Data**: `/api/sensor-data`, `/api/sensor-data/latest`
- **Health**: `/api/health`, `/api/health/database`
- **Real-time**: WebSocket at `/api/socket` and SSE at `/api/stream`

For complete API documentation, see the [API Documentation](./backend/API_DOCUMENTATION.md) file.

## Database Schema
The system uses a MySQL database with tables for:
- `sensors`: Sensor metadata and status
- `sensor_data`: Individual sensor readings
- `users`: User accounts and authentication
- `notifications`: System alerts and messages
- `electrical_systems`: Electrical monitoring data
- `cold_rooms`: Cold storage monitoring data

For the complete database schema, refer to [schema.sql](./backend/schema.sql).

## Mock Authentication
For development without the backend server, the frontend includes a mock authentication system:

- Username: `admin`, Password: `admin123` (Admin role)
- Username: `user`, Password: `user123` (User role)

## Documentation
For detailed documentation, please refer to:
- [API Documentation](./backend/API_DOCUMENTATION.md): Complete API reference
- [System Documentation](./backend/SYSTEM_DOCUMENTATION.md): System architecture and development guidelines
- [Frontend Documentation](./frontend-next/README.md): Frontend implementation details

## License
This project is licensed under the MIT License - see the LICENSE file for details.