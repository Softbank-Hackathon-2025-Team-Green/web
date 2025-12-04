import Link from "next/link";
import { use } from "react";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = use(searchParams);
  const error = params.error as string | undefined;
  
  const errorMessages: Record<string, string> = {
    auth_failed: 'Authentication failed. Please try again.',
    no_code: 'Authentication code not received.',
    token_exchange_failed: 'Failed to exchange authentication token.',
    callback_failed: 'Authentication callback failed.',
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-12 py-32 px-16 bg-white dark:bg-black rounded-lg shadow-2xl">
        <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          cutty-x
        </div>
        
        {error && (
          <div className="w-full max-w-md p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">
              ⚠️ {errorMessages[error] || 'An authentication error occurred.'}
            </p>
          </div>
        )}
        
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-purple-900 dark:text-zinc-50">
            Function as a Service Platform
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-gray-600 dark:text-zinc-400">
            Create, deploy, and manage serverless functions with ease. Visual canvas, code editor, and real-time observability.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full max-w-md">
            <Link
              href="/home"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center font-medium shadow-lg"
            >
              🚀 Launch Platform
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-2xl">
            <div className="p-4 bg-purple-50 dark:bg-zinc-900 rounded-lg border-2 border-purple-200">
              <div className="text-2xl mb-2">🎨</div>
              <h3 className="font-semibold text-purple-900 dark:text-white mb-1">Visual Canvas</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400">Drag and arrange functions visually</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-zinc-900 rounded-lg border-2 border-purple-200">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-purple-900 dark:text-white mb-1">Observability</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400">Real-time metrics and logs</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-zinc-900 rounded-lg border-2 border-purple-200">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-semibold text-purple-900 dark:text-white mb-1">Security</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400">AI-powered vulnerability checks</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
