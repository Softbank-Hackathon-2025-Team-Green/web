'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RuntimeImage, EnvironmentVariable } from '@/types/function';
import CodeEditor from '@/components/CodeEditor';

function CreateFunctionForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const functionId = searchParams.get('id');
  const initialName = searchParams.get('name') || '';

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState('');
  const [runtime, setRuntime] = useState<RuntimeImage>('node-20');
  const [httpRoute, setHttpRoute] = useState('');
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const userId = 'test-user-123'; // TODO: Get from auth

  const runtimeOptions: { value: RuntimeImage; label: string }[] = [
    { value: 'node-18', label: 'Node.js 18' },
    { value: 'node-20', label: 'Node.js 20' },
    { value: 'python-3.9', label: 'Python 3.9' },
    { value: 'python-3.10', label: 'Python 3.10' },
    { value: 'python-3.11', label: 'Python 3.11' },
  ];

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '', sensitive: false }]);
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);
  };

  const toggleEnvVarSensitive = (index: number) => {
    const newEnvVars = [...envVars];
    newEnvVars[index].sensitive = !newEnvVars[index].sensitive;
    setEnvVars(newEnvVars);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get position from localStorage
      const positionStr = localStorage.getItem(`function_${functionId}_position`);
      const position = positionStr ? JSON.parse(positionStr) : { x: 100, y: 100 };

      // Create project directory in S3
      await fetch('/api/vscode/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: functionId,
          isDirectory: true,
          userId,
        }),
      });

      const functionData = {
        id: functionId,
        name,
        description,
        runtime,
        httpRoute,
        environmentVariables: envVars.filter(ev => ev.key && ev.value),
        sourceFiles: [functionId],
        position,
      };

      const response = await fetch('/api/functions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(functionData),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/function/${result.id}/edit`);
      } else {
        alert('Failed to save function');
      }
    } catch (error) {
      console.error('Error saving function:', error);
      alert('Error saving function');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-purple-600 mb-6">Create Function</h1>

          <div className="space-y-6">
            {/* Function Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Function Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                rows={3}
              />
            </div>

            {/* Runtime */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Runtime Image *
              </label>
              <select
                value={runtime}
                onChange={(e) => setRuntime(e.target.value as RuntimeImage)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              >
                {runtimeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* HTTP Route */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTTP Route *
              </label>
              <div className="flex items-center">
                <span className="px-4 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-gray-600">
                  /api/fn/
                </span>
                <input
                  type="text"
                  value={httpRoute}
                  onChange={(e) => setHttpRoute(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  placeholder="my-function"
                  required
                />
              </div>
            </div>

            {/* Environment Variables */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment Variables
              </label>
              {envVars.map((envVar, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={envVar.key}
                    onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                    placeholder="KEY"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  />
                  <input
                    type={envVar.sensitive ? 'password' : 'text'}
                    value={envVar.value}
                    onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                    placeholder="value"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  />
                  <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={envVar.sensitive || false}
                      onChange={() => toggleEnvVarSensitive(index)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">🔒</span>
                  </label>
                  <button
                    onClick={() => removeEnvVar(index)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={addEnvVar}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
              >
                + Add Variable
              </button>
            </div>

            {/* Code Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Editor
              </label>
              <div className="border border-gray-300 rounded-md overflow-hidden" style={{ height: '500px' }}>
                <CodeEditor
                  projectPath={functionId || ''}
                  userId={userId}
                  onSave={(files) => {
                    console.log('Files saved:', files);
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => router.push('/home')}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !name || !httpRoute}
                className="px-6 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Function'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateFunctionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-2xl text-purple-600">Loading...</div>
      </div>
    }>
      <CreateFunctionForm />
    </Suspense>
  );
}
