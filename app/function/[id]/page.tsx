'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FunctionMetadata, FunctionRunLog } from '@/types/function';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TabType = 'overview' | 'logs' | 'metrics' | 'deploy';

export default function FunctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const functionId = params.id as string;

  const [functionData, setFunctionData] = useState<FunctionMetadata | null>(null);
  const [runLogs, setRunLogs] = useState<FunctionRunLog[]>([]);
  const [deployLogs, setDeployLogs] = useState<string>('');
  const [buildStatus, setBuildStatus] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const loadFunctionData = async () => {
    try {
      const response = await fetch(`/api/functions/get?functionId=${functionId}`);
      const data = await response.json();
      setFunctionData(data);
    } catch (error) {
      console.error('Failed to load function:', error);
    }
  };

  const loadRunLogs = async () => {
    try {
      const response = await fetch(`/api/functions/logs?functionId=${functionId}`);
      const logs = await response.json();
      setRunLogs(logs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const loadDeployLogs = async () => {
    setIsLoadingLogs(true);
    try {
      // TODO: Implement actual deploy logs API
      // For now, simulate with CloudWatch or CodeBuild logs
      const response = await fetch(`/api/functions/deploy-logs?functionId=${functionId}`);
      if (response.ok) {
        const data = await response.json();
        setDeployLogs(data.logs || 'No deploy logs available');
        setBuildStatus(data.status || 'unknown');
      }
    } catch (error) {
      console.error('Failed to load deploy logs:', error);
      setDeployLogs('Failed to load deploy logs');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadFunctionData();
    loadRunLogs();
    if (activeTab === 'deploy') {
      loadDeployLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [functionId, activeTab]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const response = await fetch('/api/functions/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          functionId,
        }),
      });
      
      if (response.ok) {
        alert('Function deployed successfully!');
        loadFunctionData();
      } else {
        alert('Deployment failed');
      }
    } catch (error) {
      console.error('Deployment error:', error);
      alert('Deployment error');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    try {
      // Get the authenticated user ID
      const authResponse = await fetch('/api/auth/me');
      if (!authResponse.ok) {
        alert('Authentication failed');
        return;
      }
      const { userId } = await authResponse.json();

      // Check if httpRoute is configured
      if (!functionData?.httpRoute) {
        alert('Function does not have a custom route configured');
        return;
      }

      // Construct the function URL
      const functionUrl = `http://functions.cuttyx.oriduckduck.site/${userId}/${functionData.httpRoute}`;
      
      // Call the function directly
      const response = await fetch(functionUrl, {
        method: 'GET',
      });
      
      if (response.ok) {
        const result = await response.text();
        alert(`Function executed successfully!\nResponse: ${result}`);
        loadRunLogs();
      } else {
        const error = await response.text();
        alert(`Execution failed: ${error}`);
      }
    } catch (error) {
      console.error('Execution error:', error);
      alert(`Execution error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (!functionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-2xl text-purple-600">Loading...</div>
      </div>
    );
  }

  // Prepare chart data from the latest run
  const latestRun = runLogs[0];
  const chartData = latestRun?.cpuUsage?.map((cpu, index) => ({
    time: index,
    cpu,
    memory: latestRun.memoryUsage[index],
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-purple-600">{functionData.name}</h1>
              <p className="text-gray-600 mt-1">{functionData.description || 'No description'}</p>
            </div>
            <button
              onClick={() => router.push('/home')}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              ← Back
            </button>
          </div>

          <div className="flex gap-3 mb-4 flex-wrap">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {functionData.runtime}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              functionData.status === 'idle' ? 'bg-green-100 text-green-700' :
              functionData.status === 'running' ? 'bg-blue-100 text-blue-700' :
              functionData.status === 'error' ? 'bg-red-100 text-red-700' :
              functionData.status === 'not-deployed' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {functionData.status}
            </span>
            {functionData.httpRoute && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                /{functionData.httpRoute}
              </span>
            )}
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              Rev: {functionData.currentRevision || 'N/A'}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeploying ? 'Deploying...' : '🚀 Deploy'}
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? 'Running...' : '▶ Test Run'}
            </button>
            <button
              onClick={() => router.push(`/function/${functionId}/edit`)}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              ✏️ Edit
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'overview', label: '📊 Overview' },
                { id: 'deploy', label: '🚀 Deploy Status' },
                { id: 'logs', label: '📝 Run Logs' },
                { id: 'metrics', label: '📈 Metrics' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Function Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Function ID</div>
                      <div className="text-sm font-mono text-gray-900 truncate">{functionData.functionId}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created</div>
                      <div className="text-sm text-gray-900">{new Date(functionData.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Updated</div>
                      <div className="text-sm text-gray-900">{new Date(functionData.updatedAt).toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Environment Variables</div>
                      <div className="text-sm font-medium text-gray-900">{functionData.environmentVariables?.length || 0} variables</div>
                    </div>
                  </div>
                </div>

                {functionData.environmentVariables && functionData.environmentVariables.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Variables</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                      {functionData.environmentVariables.map((env, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm py-2 border-b border-gray-200 last:border-0">
                          <span className="font-mono font-medium text-purple-600 min-w-[120px]">{env.key}</span>
                          <span className="text-gray-400">=</span>
                          <span className="font-mono text-gray-700 flex-1">
                            {env.sensitive ? '••••••••' : env.value}
                          </span>
                          {env.sensitive && <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">🔒 Sensitive</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Deploy Status Tab */}
            {activeTab === 'deploy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Deployment</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-600 font-medium mb-2">Function Status</div>
                      <div className="text-2xl font-bold text-blue-700">{functionData.status}</div>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <div className="text-sm text-purple-600 font-medium mb-2">Build Status</div>
                      <div className="text-2xl font-bold text-purple-700">{buildStatus || 'N/A'}</div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <div className="text-sm text-green-600 font-medium mb-2">Current Revision</div>
                      <div className="text-2xl font-bold text-green-700">{functionData.currentRevision || '0'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Logs</h3>
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs max-h-[500px] overflow-y-auto border border-gray-700">
                    {isLoadingLogs ? (
                      <div className="text-gray-400 flex items-center gap-2">
                        <span className="animate-spin">⚙</span>
                        Loading logs...
                      </div>
                    ) : deployLogs ? (
                      <pre className="whitespace-pre-wrap">{deployLogs}</pre>
                    ) : (
                      <div className="text-gray-400 text-center py-8">
                        <p>No deployment logs available</p>
                        <p className="text-xs mt-2">Deploy the function to see build logs</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Run Logs Tab */}
            {activeTab === 'logs' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution History</h3>
                {runLogs.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-lg mb-2">No execution logs yet</p>
                    <p className="text-sm text-gray-400">Run the function to see execution logs</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {runLogs.map((log) => (
                      <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {log.status}
                            </span>
                            <span className="text-gray-600 text-sm">
                              {new Date(log.startTime).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>⏱️ {log.executionTime}ms</span>
                            {log.cpuUsage && log.cpuUsage.length > 0 && (
                              <span>💻 CPU: {Math.max(...log.cpuUsage).toFixed(1)}%</span>
                            )}
                            {log.memoryUsage && log.memoryUsage.length > 0 && (
                              <span>🧠 Mem: {Math.max(...log.memoryUsage).toFixed(0)}MB</span>
                            )}
                          </div>
                        </div>
                        {log.errorMessage && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm font-mono">
                            {log.errorMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
              <div>
                {latestRun ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Execution Metrics</h3>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                          <div className="text-sm text-blue-600 font-medium mb-2">Execution Time</div>
                          <div className="text-3xl font-bold text-blue-700">{latestRun.executionTime}<span className="text-lg">ms</span></div>
                        </div>
                        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                          <div className="text-sm text-green-600 font-medium mb-2">Status</div>
                          <div className="text-3xl font-bold text-green-700 capitalize">{latestRun.status}</div>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                          <div className="text-sm text-purple-600 font-medium mb-2">Executed At</div>
                          <div className="text-lg font-bold text-purple-700">
                            {new Date(latestRun.startTime).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {chartData.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Usage Timeline</h3>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="time" 
                                label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
                                stroke="#6b7280"
                              />
                              <YAxis 
                                yAxisId="left" 
                                label={{ value: 'CPU (%)', angle: -90, position: 'insideLeft' }}
                                stroke="#8b5cf6"
                              />
                              <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                label={{ value: 'Memory (MB)', angle: 90, position: 'insideRight' }}
                                stroke="#10b981"
                              />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                              />
                              <Legend />
                              <Line 
                                yAxisId="left" 
                                type="monotone" 
                                dataKey="cpu" 
                                stroke="#8b5cf6" 
                                strokeWidth={2} 
                                name="CPU Usage (%)"
                                dot={false}
                              />
                              <Line 
                                yAxisId="right" 
                                type="monotone" 
                                dataKey="memory" 
                                stroke="#10b981" 
                                strokeWidth={2} 
                                name="Memory (MB)"
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-500 text-lg mb-2">No metrics available yet</p>
                    <p className="text-sm text-gray-400">Execute the function to generate performance metrics</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
