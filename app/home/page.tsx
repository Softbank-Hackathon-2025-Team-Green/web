import { ReactFlowProvider } from '@xyflow/react';
import { getUserInfo } from '@/lib/auth-server';
import { type Node } from '@xyflow/react';
import AuthButton from '@/components/AuthButton';
import HomeClient from '@/components/HomeClient';
import { listFunctions } from '@/lib/actions/functions';
import { loadWorkspace } from '@/lib/actions/workspace';

// Force dynamic rendering since we use authentication
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Home | cutty-x',
  description: 'Manage your serverless functions',
};

export default async function HomePage() {
  const userInfo = await getUserInfo();

  // If not authenticated, show login page
  if (!userInfo) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center gap-6 p-4">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            cutty-x
          </h1>
          <p className="text-lg text-gray-600">FaaS Platform</p>
          <p className="text-gray-500 mt-4">
            Please sign in to create and manage your functions
          </p>
        </div>
        <AuthButton />
      </div>
    );
  }

  // Load initial data server-side using server actions
  const [functions, workspace] = await Promise.all([
    listFunctions(userInfo.userId),
    loadWorkspace(userInfo.userId),
  ]);

  // Enrich workspace nodes with latest function metadata
  let enrichedWorkspace = workspace;
  if (workspace?.nodes && functions.length > 0) {
    const functionsMap = new Map(functions.map(f => [f.functionId, f]));
    const enrichedNodes = workspace.nodes.map((node: Node) => {
      if (node.type === 'functionNode' && functionsMap.has(node.id)) {
        const funcData = functionsMap.get(node.id)!;
        return {
          ...node,
          data: {
            label: funcData.name,
            status: funcData.status,
            functionData: funcData,
          },
        };
      }
      return node;
    });
    enrichedWorkspace = { ...workspace, nodes: enrichedNodes };
  } else if (!workspace && functions.length > 0) {
    // Create initial workspace from functions
    enrichedWorkspace = {
      nodes: functions.map((func) => ({
        id: func.functionId,
        type: 'functionNode',
        position: func.position || { x: 100, y: 100 },
        data: {
          label: func.name,
          status: func.status,
          functionData: func,
        },
      })),
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };
  }

  return (
    <ReactFlowProvider>
      <HomeClient
        userId={userInfo.userId}
        userEmail={userInfo.email}
        initialFunctions={functions}
        initialWorkspace={enrichedWorkspace}
      />
    </ReactFlowProvider>
  );
}
