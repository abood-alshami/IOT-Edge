/**
 * Cold Room monitoring API route
 */
import { NextResponse } from 'next/server';
import { query } from '../../../../utils/database';

export async function GET() {
  try {
    // Try to get data from database first
    const coldRooms = await query(`
      SELECT * FROM cold_rooms 
      ORDER BY last_maintenance DESC
    `);

    if (coldRooms.length > 0) {
      return NextResponse.json({ data: coldRooms });
    }

    // Fallback to mock data if no database results
    const mockColdRooms = [
      {
        id: 1,
        name: 'Main Cold Storage',
        temperature: -18.5,
        humidity: 45,
        status: 'operational',
        lastMaintenance: new Date().toISOString(),
        location: 'Building A',
        capacity: '1000m³',
        currentLoad: '75%'
      },
      {
        id: 2,
        name: 'Secondary Cold Room',
        temperature: -20.2,
        humidity: 42,
        status: 'operational',
        lastMaintenance: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Building B',
        capacity: '500m³',
        currentLoad: '60%'
      }
    ];

    return NextResponse.json({ data: mockColdRooms });
  } catch (error) {
    console.error('Error fetching cold room data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cold room data' },
      { status: 500 }
    );
  }
} 