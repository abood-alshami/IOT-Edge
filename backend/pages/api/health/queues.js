import { NextResponse } from 'next/server';
import queueService from '../../../utils/queueService';

export async function GET() {
  try {
    const stats = await queueService.getQueueStats();
    
    return NextResponse.json({
      status: 'ok',
      queues: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to get queue statistics'
      },
      { status: 503 }
    );
  }
}