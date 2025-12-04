import { NextRequest, NextResponse } from 'next/server';
import { startCodeBuild, getBuildStatus, StartBuildParams, BuildInfo } from '@/lib/codebuild-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      functionId, 
      // projectName,
      // environmentVariables, 
      // sourceVersion,
      // buildspecOverride,
      // waitForCompletion = false 
      waitForCompletion = false
    } = body;

    if (!functionId) {
      return NextResponse.json({ error: 'Function ID is required' }, { status: 400 });
    }

    console.log('Deploying function:', functionId, 'via CodeBuild project');

    // Prepare environment variables for the build
    const envVars: Record<string, string> = {
      FUNCTION_ID: functionId,
      // ...environmentVariables,
    };

    const buildParams: StartBuildParams = {
      //projectName,
      projectName: 'cutty-x-infra-dev-build',
      environmentVariables: envVars,
      //sourceVersion,
      //buildspecOverride,
    };

    // Start the CodeBuild project
    const buildResult = await startCodeBuild(buildParams);

    if (!buildResult.success) {
      return NextResponse.json(
        { error: buildResult.message, details: buildResult.error },
        { status: 500 }
      );
    }

    const buildData = buildResult.data as BuildInfo;
    
    // If waitForCompletion is true, poll for build status
    if (waitForCompletion && buildData?.id) {
      console.log('Waiting for build completion:', buildData.id);
      // Note: This might timeout for long builds. Consider using webhooks or async polling instead.
      const completionResult = await getBuildStatus([buildData.id]);
      
      return NextResponse.json({
        success: true,
        message: 'Function deployed',
        build: completionResult.data,
        functionId,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Build started successfully',
      build: buildData,
      functionId,
    });
  } catch (error) {
    console.error('Error deploying function:', error);
    return NextResponse.json(
      { 
        error: 'Failed to deploy function',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
