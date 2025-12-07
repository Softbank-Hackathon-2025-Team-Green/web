'use server';

import { queryFunctionLogs } from '../athena-utils';

export interface LogEntry {
  timestamp: string;
  log: string;
  requestId: string;
  isInternal: boolean;
  isStart?: boolean;
  isFinished?: boolean;
  status?: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}

export interface RequestLog {
  requestId: string;
  startTime?: string;
  endTime?: string;
  duration?: number; // in milliseconds
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  userLogs: string[];
  errorMessage?: string;
}

/**
 * Parse request ID from log entry
 */
function parseRequestId(log: string): string | null {
  const match = log.match(/^\[([a-f0-9]+)\]/);
  return match ? match[1] : null;
}

/**
 * Parse log entry and extract metadata
 */
function parseLogEntry(rawLog: string, timestamp: string): LogEntry | null {
  const requestId = parseRequestId(rawLog);
  if (!requestId) {
    return null; // Ignore logs without request ID
  }

  const isInternal = rawLog.includes('[INTERNAL]');
  const isStart = rawLog.includes('[START]');
  const isFinished = rawLog.includes('[FINISHED]');

  let status: 'SUCCESS' | 'FAILED' | undefined;
  let errorMessage: string | undefined;

  if (isFinished) {
    if (rawLog.includes('SUCCESS')) {
      status = 'SUCCESS';
    } else if (rawLog.includes('FAILED:')) {
      status = 'FAILED';
      const failedMatch = rawLog.match(/FAILED:(.+)$/);
      errorMessage = failedMatch ? failedMatch[1].trim() : 'Unknown error';
    }
  }

  return {
    timestamp,
    log: rawLog,
    requestId,
    isInternal,
    isStart,
    isFinished,
    status,
    errorMessage,
  };
}

/**
 * Group logs by request ID and calculate execution times
 */
function groupLogsByRequest(logs: LogEntry[]): RequestLog[] {
  const requestMap = new Map<string, RequestLog>();

  // Process logs in reverse order (oldest first) for correct time calculation
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const log of sortedLogs) {
    if (!requestMap.has(log.requestId)) {
      requestMap.set(log.requestId, {
        requestId: log.requestId,
        status: 'RUNNING',
        userLogs: [],
      });
    }

    const request = requestMap.get(log.requestId)!;

    if (log.isInternal) {
      if (log.isStart) {
        request.startTime = log.timestamp;
      } else if (log.isFinished && log.status) {
        request.endTime = log.timestamp;
        request.status = log.status;
        if (log.errorMessage) {
          request.errorMessage = log.errorMessage;
        }
        
        // Calculate duration
        if (request.startTime) {
          const start = new Date(request.startTime).getTime();
          const end = new Date(log.timestamp).getTime();
          request.duration = end - start;
        }
      }
    } else {
      // User log - remove request ID prefix
      const userLog = log.log.replace(/^\[[a-f0-9]+\]\s*/, '');
      request.userLogs.push(userLog);
    }
  }

  // Convert to array and sort by start time (most recent first)
  const result = Array.from(requestMap.values()).sort((a, b) => {
    const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return timeB - timeA; // Most recent first
  });
  
  return result;
}

/**
 * Fetch and parse function logs from Athena
 */
export async function fetchFunctionLogs(functionId: string): Promise<{ 
  success: boolean; 
  requests?: RequestLog[]; 
  error?: string;
}> {
  try {
    const result = await queryFunctionLogs(functionId, 3);

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to fetch logs' };
    }

    // Parse raw logs
    const parsedLogs: LogEntry[] = [];
    for (const row of result.data) {
      const parsed = parseLogEntry(row.log, row.timestamp);
      if (parsed) {
        parsedLogs.push(parsed);
      }
    }

    // Group by request ID
    const requests = groupLogsByRequest(parsedLogs);

    return { success: true, requests };
  } catch (error) {
    console.error('Error fetching function logs:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
