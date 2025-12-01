'use client';

import { useEffect } from 'react';

interface CodeReviewDialogProps {
  isOpen: boolean;
  modifiedCode: string;
  hasIssues: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CodeReviewDialog({
  isOpen,
  modifiedCode,
  hasIssues,
  onConfirm,
  onCancel,
}: CodeReviewDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {hasIssues ? '⚠️ Security Issues Found' : '✅ No Issues Detected'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {hasIssues
              ? 'AI has identified potential security vulnerabilities and added comments to the code.'
              : 'No security issues were detected in your code.'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
            <pre className="text-gray-300 whitespace-pre-wrap overflow-x-auto">
              {modifiedCode}
            </pre>
          </div>

          {hasIssues && (
            <div className="mt-4 p-4 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
              <p className="text-yellow-300 text-sm">
                <strong>Note:</strong> Comments starting with <code className="bg-gray-800 px-1 py-0.5 rounded">{"// SECURITY:"}</code> indicate potential issues.
                Review these carefully before accepting changes.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          {hasIssues && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
            >
              Apply Changes
            </button>
          )}
          {!hasIssues && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
