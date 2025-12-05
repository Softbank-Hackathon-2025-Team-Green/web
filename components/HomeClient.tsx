'use client';

import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  type Node,
  type Edge,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FunctionNode from '@/components/FunctionNode';
import TextNode from '@/components/TextNode';
import BorderNode from '@/components/BorderNode';
import CreateFunctionDialog from '@/components/CreateFunctionDialog';
import { FunctionMetadata } from '@/types/function';
import { useRouter } from 'next/navigation';

const nodeTypes = {
  functionNode: FunctionNode,
  textNode: TextNode,
  borderNode: BorderNode,
};

type DrawMode = 'function' | 'text' | 'border' | null;

interface HomeClientProps {
  userId: string;
  userEmail?: string;
  initialFunctions: FunctionMetadata[];
  initialWorkspace: {
    nodes: Node[];
    edges: Edge[];
    viewport: { x: number; y: number; zoom: number };
  } | null;
}

export default function HomeClient({ userId, userEmail, initialFunctions, initialWorkspace }: HomeClientProps) {
  const router = useRouter();
  const { screenToFlowPosition, setViewport, getViewport } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialWorkspace?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialWorkspace?.edges || []);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [functions, setFunctions] = useState<FunctionMetadata[]>(initialFunctions);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewportState, setViewportState] = useState(initialWorkspace?.viewport || { x: 0, y: 0, zoom: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter functions based on search and status
  const filteredFunctions = functions.filter((func) => {
    const matchesSearch = func.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         func.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         func.httpRoute?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || func.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Set initial viewport
  useEffect(() => {
    if (initialWorkspace?.viewport) {
      setViewport(initialWorkspace.viewport, { duration: 0 });
    }
  }, [initialWorkspace?.viewport, setViewport]);

  // Save workspace state to DynamoDB
  const saveWorkspace = useCallback(async () => {
    try {
      const viewport = getViewport();
      await fetch('/api/workspace/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nodes,
          edges,
          viewport,
        }),
      });
      console.log('Workspace saved with viewport:', viewport);
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  }, [nodes, edges, getViewport, userId]);

  // Handle delete key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      if (event.key === 'Delete' || event.key === 'Backspace') {
        setNodes((nds) => nds.filter((node) => !node.selected));
        setEdges((eds) => eds.filter((edge: Edge) => !edge.selected));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setNodes, setEdges]);

  // Auto-save workspace state when nodes, edges, or viewport change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (nodes.length > 0 || edges.length > 0) {
        saveWorkspace();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, viewportState, saveWorkspace]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('react-flow__pane')) {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      
      if (drawMode === 'function') {
        setClickPosition(position);
        setIsCreateDialogOpen(true);
      } else if (drawMode === 'text') {
        const newNode = {
          id: `text_${Date.now()}`,
          type: 'textNode',
          position,
          data: { label: 'Double-click to edit' },
          draggable: true,
          style: {
            width: 150,
            height: 40,
          },
        };
        setNodes((nds) => [...nds, newNode]);
        setDrawMode(null);
      } else if (drawMode === 'border') {
        const newNode = {
          id: `border_${Date.now()}`,
          type: 'borderNode',
          position,
          data: { label: '' },
          draggable: true,
          style: {
            width: 200,
            height: 150,
          },
          zIndex: -1,
        };
        setNodes((nds) => [...nds, newNode]);
        setDrawMode(null);
      }
    }
  }, [drawMode, setNodes, screenToFlowPosition]);

  const handleCreateFunction = async (name: string) => {
    if (!clickPosition) return;

    try {
      const functionId = crypto.randomUUID();
      
      const functionData: FunctionMetadata = {
        functionId,
        name,
        description: '',
        runtime: 'node-20' as const,
        environmentVariables: [],
        httpRoute: '',
        sourceFiles: [functionId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'uninitialized' as const,
        currentRevision: '0',
        userId,
        position: clickPosition,
      };

      const createResponse = await fetch('/api/functions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(functionData),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create function in database');
      }

      await fetch('/api/vscode/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: functionId,
          isDirectory: true,
          userId,
        }),
      });

      const newNode: Node = {
        id: functionId,
        type: 'functionNode',
        position: clickPosition,
        data: {
          label: name,
          status: 'uninitialized',
          functionData: functionData,
        },
      };
      
      setNodes((nds) => [...nds, newNode]);
      setFunctions((fns) => [...fns, functionData]);
      setDrawMode(null);
      
      // Immediately save workspace with the new function node
      const viewport = getViewport();
      await fetch('/api/workspace/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nodes: [...nodes, newNode],
          edges,
          viewport,
        }),
      });
      
      console.log('Function node created on canvas:', functionId);
    } catch (error) {
      console.error('Failed to create function:', error);
      alert('Failed to create function');
    }
  };

  async function handleSignOut() {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  return (
    <div className="w-screen h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            cutty-x
          </h1>
          <span className="text-sm text-gray-500">FaaS Platform</span>
        </div>
        
        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="text-sm text-gray-600">{userEmail}</span>
          )}
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Sign Out
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
            Deploy All
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Draw Tools */}
        <aside className="w-64 bg-white border-r border-gray-200 z-10">
          <div className="p-4 h-full flex flex-col">
            <h2 className="font-semibold text-gray-700 mb-4">Draw Tools</h2>

            {/* Draw Tools */}
            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-600 mb-2">Add Elements</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setDrawMode('function')}
                  className={`px-3 py-2 text-sm rounded ${
                    drawMode === 'function'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-purple-100'
                  }`}
                >
                  ⚡ Function
                </button>
                <button
                  onClick={() => setDrawMode('text')}
                  className={`px-3 py-2 text-sm rounded ${
                    drawMode === 'text'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-purple-100'
                  }`}
                >
                  📝 Text
                </button>
                <button
                  onClick={() => setDrawMode('border')}
                  className={`px-3 py-2 text-sm rounded ${
                    drawMode === 'border'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-purple-100'
                  }`}
                >
                  ▢ Border
                </button>
                {drawMode && (
                  <button
                    onClick={() => setDrawMode(null)}
                    className="px-3 py-2 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    ✕ Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Info Panel */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-600 mb-2">💡 Quick Tips</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Delete: Press Delete/Backspace</li>
                <li>• Move: Drag nodes around</li>
                <li>• Zoom: Use mouse wheel</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            onMoveEnd={(event, viewport) => setViewportState(viewport)}
            nodeTypes={nodeTypes}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            className="bg-gradient-to-br from-purple-50 to-pink-50"
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            
            {/* Instructions Panel */}
            {drawMode && (
              <Panel position="top-center" className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
                <p className="text-sm font-medium">
                  {drawMode === 'function' && '⚡ Click on canvas to place a function'}
                  {drawMode === 'text' && '📝 Click on canvas to add text'}
                  {drawMode === 'border' && '▢ Click on canvas to add a border'}
                </p>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Right Sidebar - Function List */}
        <aside
          className={`bg-white border-l border-gray-200 transition-all duration-300 ${
            isSidebarOpen ? 'w-80' : 'w-0'
          } overflow-hidden z-10`}
        >
          <div className="p-4 h-full flex flex-col w-80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Functions</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                →
              </button>
            </div>

            {/* Search and Filter */}
            <div className="mb-4 space-y-2">
              <input
                type="text"
                placeholder="Search functions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="idle">Idle</option>
                <option value="running">Running</option>
                <option value="error">Error</option>
                <option value="not-deployed">Not Deployed</option>
                <option value="uninitialized">Uninitialized</option>
              </select>
            </div>

            {/* Function Stats */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Total:</span>
                  <span className="ml-2 font-semibold text-gray-900">{functions.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Filtered:</span>
                  <span className="ml-2 font-semibold text-gray-900">{filteredFunctions.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">On Canvas:</span>
                  <span className="ml-2 font-semibold text-gray-900">{nodes.filter(n => n.type === 'functionNode').length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Deployed:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {functions.filter(f => f.status === 'idle' || f.status === 'running').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Function List */}
            <div className="flex-1 overflow-y-auto">
              {filteredFunctions.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center mt-4">
                  {searchQuery || statusFilter !== 'all' ? 'No functions match filters' : 'No functions yet'}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredFunctions.map((func) => (
                    <button
                      key={func.functionId}
                      onClick={() => router.push(`/function/${func.functionId}`)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900 truncate">{func.name}</div>
                      {func.description && (
                        <div className="text-xs text-gray-500 mt-1 truncate">{func.description}</div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">{func.runtime}</span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            func.status === 'idle'
                              ? 'bg-green-100 text-green-800'
                              : func.status === 'running'
                              ? 'bg-blue-100 text-blue-800'
                              : func.status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : func.status === 'not-deployed'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {func.status}
                        </span>
                      </div>
                      {func.httpRoute && (
                        <div className="text-xs text-purple-600 mt-1 truncate">/{func.httpRoute}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Sidebar Toggle Button (when closed) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute right-0 top-20 bg-white border border-gray-200 rounded-l-lg px-2 py-3 z-10 hover:bg-gray-50"
          >
            ←
          </button>
        )}
      </div>

      <CreateFunctionDialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setDrawMode(null);
        }}
        onSubmit={handleCreateFunction}
      />
    </div>
  );
}
