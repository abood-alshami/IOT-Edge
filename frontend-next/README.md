# IOT-Edge Next.js Frontend

This is the Next.js frontend for the IOT-Edge platform, providing a modern, server-rendered React application with improved performance and SEO benefits.

## Features

- Server-side rendering with Next.js
- Internationalization support (English and Arabic)
- Real-time data updates via WebSockets
- Monitoring dashboards for various systems (HVAC, LNG, Solar, etc.)
- API key management
- Responsive material design with MUI
- Mock authentication for development without backend

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 7.x or higher

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The application will be available at http://localhost:3000.

### Mock Authentication

For development without the backend server, the application includes a mock authentication system:

- Username: `admin`, Password: `admin123` (Admin role)
- Username: `user`, Password: `user123` (User role)

For more details, see [Mock Authentication Documentation](./docs/MOCK_AUTH.md).

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend-next/
├── api/              # API service files
├── components/       # Reusable React components
├── context/          # React context providers
├── docs/             # Documentation files
├── hooks/            # Custom React hooks
├── pages/            # Next.js pages (with routing based on file structure)
├── public/           # Static assets
├── styles/           # Global styles
├── utils/            # Utility functions
├── next.config.js    # Next.js configuration
├── package.json      # Package configuration
└── README.md         # Project documentation
```

## Key Improvements Over Previous Frontend

1. **Server-Side Rendering**: Pages are pre-rendered on the server for faster loading and improved SEO.
2. **Efficient Routing**: Next.js file-based routing for simpler navigation and code organization.
3. **Built-in API Routes**: API endpoints can be created within the Next.js app.
4. **Improved Internationalization**: Built-in i18n support integrated with our language context.
5. **Static File Optimization**: Automatic static optimization for improved performance.
6. **Development Mode**: Mock authentication and API handlers for frontend development without backend.

## Development Guidelines

- Follow the existing component patterns
- Keep components modular and reusable
- Use the provided hooks for data fetching
- Update translations when adding new text
- Ensure RTL support for Arabic language users 