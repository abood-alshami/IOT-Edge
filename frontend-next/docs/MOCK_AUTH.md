# Mock Authentication Documentation

## Overview

This document explains the mock authentication system implemented in the IOT-Edge platform for development purposes. The mock authentication system is designed to work when the backend server is not available, allowing frontend development to proceed independently.

## How It Works

The mock authentication system is implemented in the login page (`pages/login.js`) and the Axios configuration (`api/axiosConfig.js`). When the backend server is not available, the system uses predefined user credentials to authenticate users and create mock tokens.

## Mock User Credentials

The following mock user credentials are available for development:

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin123 | admin |
| user     | user123  | user  |

## Implementation Details

### Login Flow

1. When a user attempts to log in, the system first checks if the backend server is available.
2. If the backend server is not available, the system falls back to mock authentication:
   - It checks the provided credentials against the predefined mock users.
   - If a match is found, it creates a mock token and stores it in localStorage.
   - The user is then redirected to the dashboard.

### Axios Configuration

The Axios interceptors have been modified to:
- Detect network errors and provide better error messages
- Preserve mock authentication sessions even when API calls fail
- Prevent automatic logout when using mock tokens

## Using Mock Authentication

To use mock authentication in development:

1. Ensure the backend server is not running (or is inaccessible).
2. Navigate to the login page.
3. Enter one of the mock user credentials listed above.
4. You will be logged in and redirected to the dashboard.

## Switching to Real Authentication

To switch back to real authentication:

1. Start the backend server.
2. Clear your browser's localStorage (to remove any existing mock tokens).
3. Reload the application.
4. The system will automatically use the real authentication flow when the backend is available.

## Security Notice

The mock authentication system is intended for development purposes only and should never be enabled in production. In production environments:

1. Ensure the `MOCK_USERS` array is removed or disabled.
2. Verify that the commented-out real authentication code is uncommented.
3. Confirm that the backend server is properly secured.

## Troubleshooting

### "Failed to login" Error

If you receive a "Failed to login" error when using mock authentication:
- Verify that you're using the correct mock credentials.
- Check the browser console for any additional error messages.
- Ensure that localStorage is available and functioning in your browser.

### Mock Token Validation

Mock tokens follow the format `mock-token-{userId}-{timestamp}`. If you encounter issues with token validation:
- Check if the token format has been accidentally modified.
- Verify that the Axios interceptors are correctly handling mock tokens. 