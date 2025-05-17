import { NextResponse } from 'next/server';
import recoveryService from '@/utils/queueRecovery';
import { getUserFromRequest } from '@/utils/tokenUtils';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin access required' },
        { status: 401 }
      );
    }

    const stats = await recoveryService.getRecoveryStats();
    return NextResponse.json({
      status: 'ok',
      ...stats
    });
  } catch (error) {
    console.error('Error getting recovery stats:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to get recovery statistics'
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        await recoveryService.startRecovery();
        break;
      case 'stop':
        await recoveryService.stopRecovery();
        break;
      default:
        return NextResponse.json(
          { error: 'INVALID_ACTION', message: 'Invalid action specified' },
          { status: 400 }
        );
    }

    const stats = await recoveryService.getRecoveryStats();
    return NextResponse.json({
      status: 'ok',
      message: `Recovery ${action}ed successfully`,
      ...stats
    });
  } catch (error) {
    console.error('Error managing recovery service:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to manage recovery service'
      },
      { status: 500 }
    );
  }
}