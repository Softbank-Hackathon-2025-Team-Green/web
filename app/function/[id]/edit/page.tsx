'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RuntimeImage, EnvironmentVariable, FunctionMetadata } from '@/types/function';
import CodeEditor from '@/components/CodeEditor';
import { apiFetch } from '@/lib/api-client';

export default function EditFunctionPage() {
  const params = useParams();
  const router = useRouter();
  const functionId = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [runtime, setRuntime] = useState<RuntimeImage>('node-20');
  const [httpRoute, setHttpRoute] = useState('');
  const [originalHttpRoute, setOriginalHttpRoute] = useState('');
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [modifiedFiles, setModifiedFiles] = useState<{ path: string; content: string }[]>([]);

  // Set page title
  useEffect(() => {
    if (name) {
      document.title = `Edit ${name} | cutty-x`;
    } else {
      document.title = 'Edit Function | cutty-x';
    }
  }, [name]);

  const runtimeOptions: { value: RuntimeImage; label: string }[] = [
    { value: 'node-18', label: 'Node.js 18' },
    { value: 'node-20', label: 'Node.js 20' },
    { value: 'python-3.9', label: 'Python 3.9' },
    { value: 'python-3.10', label: 'Python 3.10' },
    { value: 'python-3.11', label: 'Python 3.11' },
  ];

  useEffect(() => {
    loadFunctionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [functionId]);

  const loadFunctionData = async () => {
    try {
      const response = await fetch(`/api/functions/get?functionId=${functionId}`);
      if (!response.ok) {
        throw new Error('Failed to load function');
      }
      const data: FunctionMetadata = await response.json();
      
      setName(data.name);
      setDescription(data.description);
      setRuntime(data.runtime);
      setHttpRoute(data.httpRoute);
      setOriginalHttpRoute(data.httpRoute);
      setEnvVars(data.environmentVariables || []);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading function:', error);
      alert('Failed to load function');
      setIsLoading(false);
    }
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
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
      // Save all modified files first
      for (const file of modifiedFiles) {
        const response = await apiFetch('/api/vscode/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: file.path,
            content: file.content,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save file: ${file.path}`);
        }
      }

      // Then update function metadata
      const updateData = {
        functionId,
        name,
        description,
        runtime,
        httpRoute,
        environmentVariables: envVars.filter(ev => ev.key && ev.value),
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/functions/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        router.push('/function/' + functionId);
      } else {
        alert('Failed to update function');
      }
    } catch (error) {
      console.error('Error updating function:', error);
      alert('Error updating function');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-2xl text-purple-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-purple-600 mb-6">Edit Function</h1>

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
                <input
                  type="text"
                  value={httpRoute}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[\s\/]/g, '');
                    setHttpRoute(value);
                  }}
                  disabled={!!originalHttpRoute}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="my-function"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">HTTP route cannot be changed after creation</p>
              
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
                  projectPath={functionId}
                  onSave={(files) => {
                    setModifiedFiles(files);
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => router.push('/function/' + functionId)}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !name || !httpRoute}
                className="px-6 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : `Save Changes${modifiedFiles.length > 0 ? ` (${modifiedFiles.length} file${modifiedFiles.length !== 1 ? 's' : ''} modified)` : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
