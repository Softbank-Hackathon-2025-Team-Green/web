import { NextRequest, NextResponse } from 'next/server';
import { FunctionRunLog } from '@/types/function';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const functionId = searchParams.get('functionId');

    if (!functionId) {
      return NextResponse.json({ error: 'Function ID is required' }, { status: 400 });
    }

    // In production, fetch from DynamoDB
    // For now, return mock data
    const logs: FunctionRunLog[] = [
      {
        id: 'run_1',
        functionId,
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 3599500).toISOString(),
        executionTime: 500,
        cpuUsage: [25, 30, 35, 40, 38, 35, 32, 28, 25, 22],
        memoryUsage: [60, 65, 70, 75, 78, 75, 70, 65, 60, 58],
        status: 'success',
        logs: 'Function executed successfully',
      },
    ];

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error getting logs:', error);
    return NextResponse.json({ error: 'Failed to get logs' }, { status: 500 });
  }
}
