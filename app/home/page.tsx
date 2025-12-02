'use client';

import React, { useCallback, useState } from 'react';
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
  ReactFlowProvider,
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

function HomePageContent() {
  const router = useRouter();
  const { screenToFlowPosition, setViewport, getViewport } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [functions, setFunctions] = useState<FunctionMetadata[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewportState, setViewportState] = useState({ x: 0, y: 0, zoom: 1 });

  const userId = 'test-user-123';

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
  }, [nodes, edges, getViewport]);

  // Handle delete key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't delete nodes if user is typing in an input or textarea
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
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (nodes.length > 0 || edges.length > 0) {
        saveWorkspace();
      }
    }, 1000); // Debounce for 1 second

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
        // Add text node
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
        // Add border/rectangle node
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
      // Generate UUID for function ID
      const functionId = crypto.randomUUID();
      const userId = 'test-user-123';
      
      // Create function metadata in DynamoDB
      const functionData = {
        functionId,
        name,
        description: '',
        runtime: 'node-20' as const,
        environmentVariables: [],
        httpRoute: `/${name.toLowerCase().replace(/\s+/g, '-')}`,
        sourceFiles: [functionId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRunAt: null,
        status: 'uninitialized' as const,
        currentRevision: '0',
        userId,
        position: clickPosition,
      };

      // Create DynamoDB entry
      const createResponse = await fetch('/api/functions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(functionData),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create function in database');
      }

      // Create S3 directory
      await fetch('/api/vscode/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: functionId,
          isDirectory: true,
          userId,
        }),
      });

      // Redirect to function edit page
      router.push(`/function/${functionId}/edit`);
    } catch (error) {
      console.error('Failed to create function:', error);
      alert('Failed to create function');
    }
  };

  // Load functions and workspace state
  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Load workspace state from DynamoDB
        const workspaceResponse = await fetch(`/api/workspace/load?userId=${userId}`);
        const workspaceData = await workspaceResponse.json();
        
        // Load functions metadata
        const functionsResponse = await fetch('/api/functions/list');
        const functionsData: FunctionMetadata[] = await functionsResponse.json();
        setFunctions(functionsData);

        // If workspace has saved state, use it
        if (workspaceData.nodes && workspaceData.nodes.length > 0) {
          setNodes(workspaceData.nodes);
          setEdges(workspaceData.edges || []);
          if (workspaceData.viewport) {
            setViewport(workspaceData.viewport, { duration: 0 });
            setViewportState(workspaceData.viewport);
          }
          console.log('Loaded workspace from DynamoDB with viewport:', workspaceData.viewport);
        } else {
          // Otherwise, create nodes from function metadata (backward compatibility)
          const functionNodes = functionsData.map((func) => ({
            id: func.functionId,
            type: 'functionNode',
            position: func.position || { x: 100, y: 100 },
            data: {
              label: func.name,
              status: func.status,
              functionData: func,
            },
          }));
          setNodes(functionNodes);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [setNodes, setEdges, setViewport]);

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
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
            Deploy All
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0'} overflow-hidden z-10`}>
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Functions</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ←
              </button>
            </div>

            {/* Draw Tools */}
            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-600 mb-2">Draw Mode</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setDrawMode('function')}
                  className={`px-3 py-2 text-sm rounded ${drawMode === 'function' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-purple-100'}`}
                >
                  ⚡ Function
                </button>
                <button
                  onClick={() => setDrawMode('text')}
                  className={`px-3 py-2 text-sm rounded ${drawMode === 'text' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-purple-100'}`}
                >
                  📝 Text
                </button>
                <button
                  onClick={() => setDrawMode('border')}
                  className={`px-3 py-2 text-sm rounded ${drawMode === 'border' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-purple-100'}`}
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

            {/* Function List */}
            <div className="flex-1 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-600 mb-2">Your Functions ({functions.length})</p>
              {functions.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No functions yet</p>
              ) : (
                <div className="space-y-2">
                  {functions.map((func) => (
                    <button
                      key={func.functionId}
                      onClick={() => router.push(`/function/${func.functionId}`)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900">{func.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{func.runtime}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          func.status === 'idle' ? 'bg-green-100 text-green-800' :
                          func.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          func.status === 'error' ? 'bg-red-100 text-red-800' :
                          func.status === 'not-deployed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {func.status}
                        </span>
                      </div>
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
            className="absolute left-0 top-20 bg-white border border-gray-200 rounded-r-lg px-2 py-3 z-10 hover:bg-gray-50"
          >
            →
          </button>
        )}

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

export default function HomePage() {
  return (
    <ReactFlowProvider>
      <HomePageContent />
    </ReactFlowProvider>
  );
}
