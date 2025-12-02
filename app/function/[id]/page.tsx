'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FunctionMetadata, FunctionRunLog } from '@/types/function';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FunctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const functionId = params.id as string;

  const [functionData, setFunctionData] = useState<FunctionMetadata | null>(null);
  const [runLogs, setRunLogs] = useState<FunctionRunLog[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const loadFunctionData = async () => {
    try {
      const response = await fetch(`/api/functions/get?userId=test-user-123&functionId=${functionId}`);
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

  useEffect(() => {
    loadFunctionData();
    loadRunLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [functionId]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const response = await fetch('/api/functions/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionId }),
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
      const response = await fetch('/api/functions/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionId }),
      });
      
      if (response.ok) {
        alert('Function executed successfully!');
        loadRunLogs();
      } else {
        alert('Execution failed');
      }
    } catch (error) {
      console.error('Execution error:', error);
      alert('Execution error');
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
  const chartData = latestRun?.cpuUsage.map((cpu, index) => ({
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
            <div>
              <h1 className="text-3xl font-bold text-purple-600">{functionData.name}</h1>
              <p className="text-gray-600 mt-1">{functionData.description}</p>
            </div>
            <button
              onClick={() => router.push('/home')}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              ← Back to Home
            </button>
          </div>

          <div className="flex gap-4 mb-4">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              {functionData.runtime}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {functionData.status}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              /api/fn/{functionData.httpRoute}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isDeploying ? 'Deploying...' : '🚀 Deploy'}
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? 'Running...' : '▶ Test Run'}
            </button>
            <button
              onClick={() => router.push(`/function/${functionId}/edit`)}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              ✏️ Edit
            </button>
          </div>
        </div>

        {/* Observability Dashboard */}
        {latestRun && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-purple-600 mb-4">Latest Run Metrics</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Execution Time</div>
                <div className="text-2xl font-bold text-blue-600">{latestRun.executionTime}ms</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Status</div>
                <div className="text-2xl font-bold text-green-600">{latestRun.status}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Timestamp</div>
                <div className="text-lg font-bold text-purple-600">
                  {new Date(latestRun.startTime).toLocaleString()}
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} />
                <YAxis yAxisId="left" label={{ value: 'CPU (%)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Memory (MB)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="cpu" stroke="#8b5cf6" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Run History */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">Run History</h2>
          
          {runLogs.length === 0 ? (
            <p className="text-gray-500">No runs yet</p>
          ) : (
            <div className="space-y-3">
              {runLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`px-2 py-1 rounded text-sm font-semibold ${
                        log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                      <span className="ml-3 text-gray-600">
                        {new Date(log.startTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      ⏱️ {log.executionTime}ms
                    </div>
                  </div>
                  {log.errorMessage && (
                    <div className="mt-2 text-red-600 text-sm">{log.errorMessage}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
