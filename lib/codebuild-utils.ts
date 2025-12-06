import { 
  StartBuildCommand,
  BatchGetBuildsCommand,
  StopBuildCommand,
  ListProjectsCommand,
  BatchGetProjectsCommand,
  EnvironmentVariable,
  StartBuildCommandInput,
  StartBuildCommandOutput,
  Build,
} from '@aws-sdk/client-codebuild';
import { GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { getCodeBuildClient, getCloudWatchLogsClient } from './aws-clients';

export interface CodeBuildResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

export interface StartBuildParams {
  projectName: string;
  environmentVariables?: Record<string, string>;
  sourceVersion?: string;
  buildspecOverride?: string;
}

export interface BuildInfo {
  id: string;
  projectName: string;
  status: string;
  startTime?: Date;
  endTime?: Date;
  currentPhase?: string;
  sourceVersion?: string;
  logs?: {
    groupName?: string;
    streamName?: string;
    deepLink?: string;
  };
  logContent?: string; // Actual log content from CloudWatch
}

/**
 * Start a CodeBuild project with optional environment variables
 */
export async function startCodeBuild(
  params: StartBuildParams
): Promise<CodeBuildResult> {
  try {
    const client = getCodeBuildClient();

    // Prepare environment variables
    const environmentVariablesOverride: EnvironmentVariable[] | undefined = 
      params.environmentVariables
        ? Object.entries(params.environmentVariables).map(([name, value]) => ({
            name,
            value,
            type: 'PLAINTEXT',
          }))
        : undefined;

    const input: StartBuildCommandInput = {
      projectName: params.projectName,
      environmentVariablesOverride,
      sourceVersion: params.sourceVersion,
      buildspecOverride: params.buildspecOverride,
    };

    const command = new StartBuildCommand(input);
    const response: StartBuildCommandOutput = await client.send(command);

    if (!response.build) {
      return {
        success: false,
        message: 'Failed to start build',
        error: 'No build information returned',
      };
    }

    const buildInfo: BuildInfo = {
      id: response.build.id || '',
      projectName: response.build.projectName || params.projectName,
      status: response.build.buildStatus || 'UNKNOWN',
      startTime: response.build.startTime,
      currentPhase: response.build.currentPhase,
      sourceVersion: response.build.sourceVersion,
      logs: response.build.logs ? {
        groupName: response.build.logs.groupName,
        streamName: response.build.logs.streamName,
        deepLink: response.build.logs.deepLink,
      } : undefined,
    };

    return {
      success: true,
      message: `Build started successfully: ${buildInfo.id}`,
      data: buildInfo,
    };
  } catch (error) {
    console.error('Error starting CodeBuild:', error);
    return {
      success: false,
      message: 'Failed to start CodeBuild',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get the status of one or more builds
 */
export async function getBuildStatus(
  buildIds: string[]
): Promise<CodeBuildResult> {
  try {
    const client = getCodeBuildClient();
    const command = new BatchGetBuildsCommand({ ids: buildIds });
    const response = await client.send(command);

    if (!response.builds || response.builds.length === 0) {
      return {
        success: false,
        message: 'No builds found',
        error: 'Build IDs not found',
      };
    }

    const builds: BuildInfo[] = response.builds.map((build: Build) => ({
      id: build.id || '',
      projectName: build.projectName || '',
      status: build.buildStatus || 'UNKNOWN',
      startTime: build.startTime,
      endTime: build.endTime,
      currentPhase: build.currentPhase,
      sourceVersion: build.sourceVersion,
      logs: build.logs ? {
        groupName: build.logs.groupName,
        streamName: build.logs.streamName,
        deepLink: build.logs.deepLink,
      } : undefined,
    }));

    return {
      success: true,
      message: 'Build status retrieved successfully',
      data: builds,
    };
  } catch (error) {
    console.error('Error getting build status:', error);
    return {
      success: false,
      message: 'Failed to get build status',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Stop a running build
 */
export async function stopBuild(buildId: string): Promise<CodeBuildResult> {
  try {
    const client = getCodeBuildClient();
    const command = new StopBuildCommand({ id: buildId });
    const response = await client.send(command);

    if (!response.build) {
      return {
        success: false,
        message: 'Failed to stop build',
        error: 'No build information returned',
      };
    }

    return {
      success: true,
      message: `Build stopped: ${buildId}`,
      data: {
        id: response.build.id,
        status: response.build.buildStatus,
      },
    };
  } catch (error) {
    console.error('Error stopping build:', error);
    return {
      success: false,
      message: 'Failed to stop build',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * List all CodeBuild projects
 */
export async function listCodeBuildProjects(): Promise<CodeBuildResult> {
  try {
    const client = getCodeBuildClient();
    const command = new ListProjectsCommand({});
    const response = await client.send(command);

    return {
      success: true,
      message: 'Projects listed successfully',
      data: {
        projects: response.projects || [],
        nextToken: response.nextToken,
      },
    };
  } catch (error) {
    console.error('Error listing projects:', error);
    return {
      success: false,
      message: 'Failed to list projects',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get detailed information about CodeBuild projects
 */
export async function getProjectDetails(
  projectNames: string[]
): Promise<CodeBuildResult> {
  try {
    const client = getCodeBuildClient();
    const command = new BatchGetProjectsCommand({ names: projectNames });
    const response = await client.send(command);

    if (!response.projects || response.projects.length === 0) {
      return {
        success: false,
        message: 'No projects found',
        error: 'Project names not found',
      };
    }

    return {
      success: true,
      message: 'Project details retrieved successfully',
      data: {
        projects: response.projects,
        projectsNotFound: response.projectsNotFound || [],
      },
    };
  } catch (error) {
    console.error('Error getting project details:', error);
    return {
      success: false,
      message: 'Failed to get project details',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get build logs and information for a specific build
 */
export async function getBuildLogs(
  buildId: string
): Promise<CodeBuildResult> {
  try {
    const client = getCodeBuildClient();
    const command = new BatchGetBuildsCommand({ ids: [buildId] });
    const response = await client.send(command);

    if (!response.builds || response.builds.length === 0) {
      return {
        success: false,
        message: 'Build not found',
        error: `Build ID ${buildId} not found`,
      };
    }

    const build = response.builds[0];
    const buildInfo: BuildInfo = {
      id: build.id || '',
      projectName: build.projectName || '',
      status: build.buildStatus || 'UNKNOWN',
      startTime: build.startTime,
      endTime: build.endTime,
      currentPhase: build.currentPhase,
      sourceVersion: build.sourceVersion,
      logs: build.logs ? {
        groupName: build.logs.groupName,
        streamName: build.logs.streamName,
        deepLink: build.logs.deepLink,
      } : undefined,
    };

    // Fetch actual log content from CloudWatch if available
    if (build.logs?.groupName && build.logs?.streamName) {
      try {
        const logsClient = getCloudWatchLogsClient();
        const logCommand = new GetLogEventsCommand({
          logGroupName: build.logs.groupName,
          logStreamName: build.logs.streamName,
          startFromHead: true,
          limit: 1000, // Get up to 1000 log events
        });
        
        const logResponse = await logsClient.send(logCommand);
        
        if (logResponse.events && logResponse.events.length > 0) {
          buildInfo.logContent = logResponse.events
            .map(event => event.message || '')
            .join('');
        } else {
          buildInfo.logContent = 'No log content available yet. Build may still be initializing.';
        }
      } catch (logError) {
        console.error('Error fetching CloudWatch logs:', logError);
        buildInfo.logContent = `Error fetching logs: ${logError instanceof Error ? logError.message : String(logError)}`;
      }
    } else {
      buildInfo.logContent = 'Log information not yet available. Build may be in queue or starting.';
    }

    return {
      success: true,
      message: 'Build logs retrieved successfully',
      data: buildInfo,
    };
  } catch (error) {
    console.error('Error getting build logs:', error);
    return {
      success: false,
      message: 'Failed to get build logs',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Wait for a build to complete (polling)
 */
export async function waitForBuildCompletion(
  buildId: string,
  maxWaitTimeMs: number = 300000, // 5 minutes default
  pollIntervalMs: number = 5000 // 5 seconds default
): Promise<CodeBuildResult> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTimeMs) {
    const statusResult = await getBuildStatus([buildId]);
    
    if (!statusResult.success) {
      return statusResult;
    }

    const builds = statusResult.data as BuildInfo[];
    const build = builds[0];

    if (build.status === 'SUCCEEDED') {
      return {
        success: true,
        message: 'Build completed successfully',
        data: build,
      };
    }

    if (build.status === 'FAILED' || build.status === 'FAULT' || 
        build.status === 'TIMED_OUT' || build.status === 'STOPPED') {
      return {
        success: false,
        message: `Build ${build.status.toLowerCase()}`,
        data: build,
        error: `Build ended with status: ${build.status}`,
      };
    }

    // Still in progress, wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  return {
    success: false,
    message: 'Build timeout',
    error: `Build did not complete within ${maxWaitTimeMs}ms`,
  };
}
