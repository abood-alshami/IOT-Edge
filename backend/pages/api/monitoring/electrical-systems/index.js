/**
 * Electrical Systems monitoring API route
 */
import { NextResponse } from 'next/server';
import { query } from '../../../../utils/database';

export async function GET() {
  try {
    // Try to get data from database first
    const systems = await query(`
      SELECT * FROM electrical_systems 
      ORDER BY last_maintenance DESC
    `);

    if (systems.length > 0) {
      return NextResponse.json({ data: systems });
    }

    // Fallback to mock data if no database results
    const mockSystems = [
      {
        id: 1,
        name: 'Main Power Grid',
        status: 'operational',
        currentPowerUsage: 850,
        maxCapacity: 1000,
        voltage: 220,
        lastMaintenance: new Date().toISOString(),
        location: 'Building A'
      },
      {
        id: 2,
        name: 'Backup Generator',
        status: 'standby',
        currentPowerUsage: 0,
        maxCapacity: 500,
        voltage: 220,
        lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Building B'
      }
    ];

    return NextResponse.json({ data: mockSystems });
  } catch (error) {
    console.error('Error fetching electrical systems:', error);
    return NextResponse.json(
      { error: 'Failed to fetch electrical systems data' },
      { status: 500 }
    );
  }
} 