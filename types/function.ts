export type RuntimeImage = 'node-18' | 'node-20' | 'python-3.9' | 'python-3.10' | 'python-3.11';

export type FunctionStatus = 'idle' | 'running' | 'error' | 'not-deployed' | 'unavailable' | 'uninitialized';

export interface EnvironmentVariable {
  key: string;
  value: string;
  sensitive?: boolean;
}

export interface FunctionMetadata {
  functionId: string;
  name: string;
  description: string;
  runtime: RuntimeImage;
  environmentVariables: EnvironmentVariable[];
  httpRoute: string;
  sourceFiles: string[]; // S3 paths
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  status: FunctionStatus;
  currentRevision: string;
  userId: string;
  position?: {
    x: number;
    y: number;
  };
}

export interface FunctionRunLog {
  id: string;
  functionId: string;
  startTime: string;
  endTime: string;
  executionTime: number; // milliseconds
  cpuUsage: number[]; // array of CPU usage percentages over time
  memoryUsage: number[]; // array of memory usage in MB over time
  status: 'success' | 'running' | 'error';
  errorMessage?: string;
  logs: string;
}

export interface VulnerabilityCheckResult {
  safe: boolean;
  issues: {
    type: 'infinite-loop' | 'filesystem-access' | 'ddos-risk' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    line?: number;
  }[];
  timestamp: string;
}
