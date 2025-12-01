'use client';

import { useState } from 'react';

interface CreateFunctionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function CreateFunctionDialog({
  isOpen,
  onClose,
  onSubmit,
}: CreateFunctionDialogProps) {
  const [functionName, setFunctionName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (functionName.trim()) {
      onSubmit(functionName.trim());
      setFunctionName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 transform transition-all">
        <h2 className="text-2xl font-bold mb-4 text-purple-600">Create New Function</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="functionName" className="block text-sm font-medium text-gray-700 mb-2">
              Function Name
            </label>
            <input
              type="text"
              id="functionName"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="my-awesome-function"
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
