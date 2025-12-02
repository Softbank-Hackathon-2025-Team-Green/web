'use client';

import { Handle, Position } from '@xyflow/react';
import { FunctionMetadata, FunctionStatus } from '@/types/function';
import { useRouter } from 'next/navigation';

interface FunctionNodeProps {
  data: {
    label: string;
    status: FunctionStatus;
    functionData: FunctionMetadata;
  };
}

const statusColors = {
  idle: 'bg-green-100 border-green-500 text-green-800',
  running: 'bg-blue-100 border-blue-500 text-blue-800 animate-pulse',
  error: 'bg-red-100 border-red-500 text-red-800',
  'not-deployed': 'bg-yellow-100 border-yellow-500 text-yellow-800',
  unavailable: 'bg-gray-100 border-gray-500 text-gray-800',
  uninitialized: 'bg-gray-100 border-gray-500 text-gray-800',
};

const statusIcons = {
  idle: '✓',
  running: '▶',
  error: '⚠',
  'not-deployed': '⚡',
  unavailable: '⊗',
    uninitialized: '-',
};

export default function FunctionNode({ data }: FunctionNodeProps) {
  const router = useRouter();
  const { label, status, functionData } = data;
  const colorClass = statusColors[status] || statusColors.unavailable;

  const handleClick = () => {
    router.push(`/function/${functionData.functionId}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`px-4 py-3 shadow-lg rounded-lg border-2 min-w-[180px] cursor-pointer transition-all hover:scale-105 ${colorClass}`}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center justify-between mb-1">
        <span className="text-lg font-semibold">{label}</span>
        <span className="text-xl">{statusIcons[status]}</span>
      </div>
      
      <div className="text-xs opacity-75">
        {functionData.runtime}
      </div>
      
      <div className="text-xs mt-1 font-medium">
        {status.replace('-', ' ').toUpperCase()}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
