import { NextRequest, NextResponse } from 'next/server';
import { startCodeBuild, getBuildStatus, StartBuildParams, BuildInfo } from '@/lib/codebuild-utils';
import { getAuthenticatedUserId } from '@/lib/auth-server';
import { updateFunction, getFunction } from '@/lib/actions/functions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      functionId, 
      // projectName,
      // sourceVersion,
      // buildspecOverride,
      waitForCompletion = false
    } = body;

    if (!functionId) {
      return NextResponse.json({ error: 'Function ID is required' }, { status: 400 });
    }

    // Get authenticated user ID
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get current function to retrieve its data
    const currentFunction = await getFunction(functionId, userId);
    if (!currentFunction) {
      return NextResponse.json({ error: 'Function not found' }, { status: 404 });
    }

    if (!currentFunction.httpRoute) {
      return NextResponse.json({ error: 'Function does not have a custom route configured' }, { status: 400 });
    }

    console.log('Deploying function:', functionId, 'for user:', userId, 'via CodeBuild project');

    // Prepare environment variables for the build
    const envVars: Record<string, string> = {
      FUNCTION_ID: functionId,
      USER_ID: userId,
      CUSTOM_ROUTES: currentFunction.httpRoute ? currentFunction.httpRoute.replace(/[\s\/]+/g, '') : '', // Remove whitespace/newlines/slashes
      CUSTOM_ENV: JSON.stringify(currentFunction.environmentVariables || []),
    };

    const buildParams: StartBuildParams = {
      //projectName,
      projectName: process.env.NEXT_PUBLIC_CODEBUILD_PROJECT_NAME || 'my-codebuild-project',
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
    
    // Calculate new revision
    const currentRevision = currentFunction.currentRevision ? parseInt(currentFunction.currentRevision) : 0;
    const newRevision = currentRevision + 1;
    
    // Update Function's dynamoDB entry to 'deploying' status and increment revision
    await updateFunction(functionId, { 
      status: 'deploying',
      currentRevision: newRevision.toString()
    }, userId);
    
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
