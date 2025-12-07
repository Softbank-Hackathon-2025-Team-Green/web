'use client';

import { useState } from 'react';

export interface RequestLog {
  requestId: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  userLogs: string[];
  errorMessage?: string;
}

interface AthenaLogsViewerProps {
  requests: RequestLog[];
  onRefresh: () => void;
  isLoading: boolean;
}

export default function AthenaLogsViewer({ requests, onRefresh, isLoading }: AthenaLogsViewerProps) {
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  const toggleRequest = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Execution Logs (Last 3 Hours)</h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? '⚙ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg mb-2">No execution logs found</p>
          <p className="text-sm text-gray-400">Logs from the last 3 hours will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...requests]
            .sort((a, b) => {
                console.log('Sorting requests:', a.startTime, b.startTime);
              const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
              const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
              return timeB - timeA; // Most recent first
            })
            .map((request) => {
            const isExpanded = expandedRequests.has(request.requestId);
            
            return (
              <div
                key={request.requestId}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
              >
                {/* Collapsed View - Header */}
                <button
                  onClick={() => toggleRequest(request.requestId)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          request.status === 'SUCCESS'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {request.status}
                      </span>
                      <span className="text-sm font-mono text-gray-600">
                        {request.requestId.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>⏱️ {formatDuration(request.duration)}</span>
                    <span>🕐 {formatTime(request.startTime)}</span>
                  </div>
                </button>

                {/* Expanded View - Details */}
                {isExpanded && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="space-y-4">
                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-200">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Request ID</div>
                          <div className="text-sm font-mono text-gray-900">{request.requestId}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Duration</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {formatDuration(request.duration)}
                          </div>
                        </div>
                        {request.startTime && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Start Time</div>
                            <div className="text-sm text-gray-900">
                              {new Date(request.startTime).toLocaleString()}
                            </div>
                          </div>
                        )}
                        {request.endTime && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">End Time</div>
                            <div className="text-sm text-gray-900">
                              {new Date(request.endTime).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Error Message */}
                      {request.errorMessage && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="text-xs text-red-600 font-semibold mb-1">Error</div>
                          <div className="text-sm text-red-700 font-mono">{request.errorMessage}</div>
                        </div>
                      )}

                      {/* User Logs */}
                      {request.userLogs.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 font-semibold mb-2">
                            User Logs ({request.userLogs.length})
                          </div>
                          <div className="bg-gray-900 text-gray-100 rounded-lg p-3 font-mono text-xs max-h-64 overflow-y-auto">
                            {request.userLogs.map((log, index) => (
                              <div key={index} className="py-1">
                                {log}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {request.userLogs.length === 0 && !request.errorMessage && (
                        <div className="text-sm text-gray-400 italic text-center py-4">
                          No user logs for this request
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
