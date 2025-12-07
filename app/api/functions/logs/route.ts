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
        executionTime: 2,
        cpuUsage: [4, 5, 6, 5, 5, 4, 5, 6, 5, 5],
        memoryUsage: [120, 122, 124, 123, 123, 124, 122, 123, 124, 123],
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
