import { NextRequest, NextResponse } from 'next/server';
import { getDeployLogs } from '@/lib/actions/functions';
import { getBuildLogs } from '@/lib/codebuild-utils';
import { requireAuth, TokenExpiredError } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const searchParams = request.nextUrl.searchParams;
    const functionId = searchParams.get('functionId');
    
    if (!functionId) {
      return NextResponse.json({ error: 'Function ID is required' }, { status: 400 });
    }

    // Get buildId from function metadata
    const deployLogsInfo = await getDeployLogs(functionId);

    if (!deployLogsInfo.success || !deployLogsInfo.buildId) {
      return NextResponse.json(
        { error: deployLogsInfo.buildId ? 'Failed to get deploy logs' : 'No build information found' },
        { status: 404 }
      );
    }

    // Get build information from CodeBuild
    const buildResult = await getBuildLogs(deployLogsInfo.buildId);

    if (!buildResult.success) {
      return NextResponse.json(
        { error: buildResult.message, details: buildResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      build: buildResult.data,
      buildId: deployLogsInfo.buildId,
      lastBuildId: deployLogsInfo.lastBuildId,
    });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 });
    }
    console.error('Error getting deploy logs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get deploy logs' },
      { status: 500 }
    );
  }
}
