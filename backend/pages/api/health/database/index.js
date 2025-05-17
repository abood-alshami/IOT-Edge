import { NextResponse } from 'next/server';
import { isConnected } from '../../../../utils/database';

export async function GET() {
  try {
    const isDbConnected = await isConnected();
    
    return NextResponse.json({
      status: isDbConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: isDbConnected,
        message: isDbConnected ? 'Database connection is active' : 'Database connection failed'
      }
    });
  } catch (error) {
    console.error('Error checking database health:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          message: 'Error checking database connection'
        }
      },
      { status: 500 }
    );
  }
} 