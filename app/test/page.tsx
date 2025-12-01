'use client';

import { useEffect, useState } from 'react';
import { configureAmplify, ASSUMED_USER_ID } from '@/lib/amplify-config';
import {
  uploadFileToS3,
  getS3FileUrl,
  listS3Files,
  deleteS3File,
} from '@/lib/s3-utils';
import {
  putDynamoDBItem,
  getDynamoDBItem,
  scanDynamoDBItems,
  deleteDynamoDBItem,
} from '@/lib/dynamodb-utils';
import { invokeLambdaFunction, testApiGateway } from '@/lib/lambda-utils';

type TestResult = {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
};

export default function TestPage() {
  const [activeTab, setActiveTab] = useState<'s3' | 'dynamodb' | 'lambda'>('s3');
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  // S3 state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [s3Key, setS3Key] = useState('');
  const [s3Files, setS3Files] = useState<unknown[]>([]);

  // DynamoDB state
  const [dynamoId, setDynamoId] = useState('');
  const [dynamoData, setDynamoData] = useState('{"id": "test-1", "name": "Test Item"}');
  const [dynamoItems, setDynamoItems] = useState<unknown[]>([]);

  // Lambda state
  const [lambdaFunction, setLambdaFunction] = useState('');
  const [lambdaPayload, setLambdaPayload] = useState('{}');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [useIAM, setUseIAM] = useState(true);

  useEffect(() => {
    configureAmplify();
  }, []);

  const handleTest = async (testFn: () => Promise<TestResult>) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await testFn();
      setResult(res);
    } catch (error) {
      setResult({
        success: false,
        message: 'Test failed',
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">AWS Amplify Service Tests</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800"><strong>Assumed User ID:</strong> {ASSUMED_USER_ID}</p>
          </div>
        </div>
        <div className="flex gap-2 mb-6 border-b">
          {(['s3', 'dynamodb', 'lambda'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* S3 Tab */}
        {activeTab === 's3' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">S3 Storage Tests</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <button
                  onClick={() => selectedFile && handleTest(() => uploadFileToS3(selectedFile))}
                  disabled={loading || !selectedFile}
                  className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  Upload to S3
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Get File URL
                </label>
                <input
                  type="text"
                  value={s3Key}
                  onChange={(e) => setS3Key(e.target.value)}
                  placeholder="Enter S3 key/path"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-gray-900"
                />
                <button
                  onClick={() => handleTest(() => getS3FileUrl(s3Key))}
                  disabled={loading || !s3Key}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  Get URL
                </button>
              </div>

              <button
                onClick={async () => {
                  const res = await listS3Files();
                  if (res.success && res.data && typeof res.data === 'object' && 'items' in res.data) {
                    setS3Files((res.data as { items: unknown[] }).items || []);
                  }
                  handleTest(() => Promise.resolve(res));
                }}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                List Files
              </button>

              {s3Files.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Files:</h3>
                  <div className="bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
                    <pre className="text-xs text-gray-800">{JSON.stringify(s3Files, null, 2)}</pre>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delete File
                </label>
                <input
                  type="text"
                  value={s3Key}
                  onChange={(e) => setS3Key(e.target.value)}
                  placeholder="Enter S3 key/path to delete"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-gray-900"
                />
                <button
                  onClick={() => handleTest(() => deleteS3File(s3Key))}
                  disabled={loading || !s3Key}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DynamoDB Tab */}
        {activeTab === 'dynamodb' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">DynamoDB Tests</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Put Item (JSON)
                </label>
                <textarea
                  value={dynamoData}
                  onChange={(e) => setDynamoData(e.target.value)}
                  placeholder='{"id": "test-1", "name": "Test"}'
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 font-mono text-sm text-gray-900"
                  rows={4}
                />
                <button
                  onClick={() => handleTest(() => putDynamoDBItem(JSON.parse(dynamoData)))}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  Put Item
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Get Item by ID
                </label>
                <input
                  type="text"
                  value={dynamoId}
                  onChange={(e) => setDynamoId(e.target.value)}
                  placeholder="Enter item ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-gray-900"
                />
                <button
                  onClick={() => handleTest(() => getDynamoDBItem({ id: dynamoId }))}
                  disabled={loading || !dynamoId}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  Get Item
                </button>
              </div>

              <button
                onClick={async () => {
                  const res = await scanDynamoDBItems(10);
                  if (res.success && res.data) {
                    setDynamoItems(Array.isArray(res.data) ? res.data : []);
                  }
                  handleTest(() => Promise.resolve(res));
                }}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                Scan Items (Limit 10)
              </button>

              {dynamoItems.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Items:</h3>
                  <div className="bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
                    <pre className="text-xs text-gray-800">{JSON.stringify(dynamoItems, null, 2)}</pre>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delete Item by ID
                </label>
                <input
                  type="text"
                  value={dynamoId}
                  onChange={(e) => setDynamoId(e.target.value)}
                  placeholder="Enter item ID to delete"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-gray-900"
                />
                <button
                  onClick={() => handleTest(() => deleteDynamoDBItem({ id: dynamoId }))}
                  disabled={loading || !dynamoId}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                >
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lambda Tab */}
        {activeTab === 'lambda' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Lambda Function Tests</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <input
                  type="checkbox"
                  id="useIAM"
                  checked={useIAM}
                  onChange={(e) => setUseIAM(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="useIAM" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Use IAM credentials (direct Lambda invocation)
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {useIAM ? 'Function Name (ARN or name)' : 'Function Path'}
                </label>
                <input
                  type="text"
                  value={lambdaFunction}
                  onChange={(e) => setLambdaFunction(e.target.value)}
                  placeholder={useIAM ? 'e.g., my-function or arn:aws:lambda:region:account:function:name' : 'e.g., /prod/hello'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payload (JSON)
                </label>
                <textarea
                  value={lambdaPayload}
                  onChange={(e) => setLambdaPayload(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 font-mono text-sm text-gray-900"
                  rows={4}
                />
              </div>

              <button
                onClick={() =>
                  handleTest(() =>
                    invokeLambdaFunction(lambdaFunction, JSON.parse(lambdaPayload), useIAM)
                  )
                }
                disabled={loading || !lambdaFunction}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                {useIAM ? 'Invoke Lambda with IAM' : 'Invoke Lambda via API Gateway'}
              </button>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Direct API Gateway Test</h3>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Endpoint URL
                </label>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://your-api-id.execute-api.region.amazonaws.com/stage/path"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-gray-900"
                />
                <button
                  onClick={() => handleTest(() => testApiGateway(apiEndpoint))}
                  disabled={loading || !apiEndpoint}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                >
                  Test API Gateway
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className={`mt-6 p-6 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
              {result.success ? '✓ Success' : '✗ Error'}
            </h3>
            <p className={`mb-3 ${result.success ? 'text-green-800' : 'text-red-800'}`}>{result.message}</p>
            {result.data !== undefined && result.data !== null && (
              <div className="bg-white p-3 rounded border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Response Data:</h4>
                <pre className="text-xs overflow-x-auto text-gray-900">{JSON.stringify(result.data, null, 2)}</pre>
              </div>
            )}
            {result.error && (
              <div className="bg-white p-3 rounded border border-red-300 mt-2">
                <h4 className="text-sm font-medium text-red-700 mb-2">Error Details:</h4>
                <pre className="text-xs overflow-x-auto text-red-900">{result.error}</pre>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-center">Testing...</p>
          </div>
        )}
      </div>
    </div>
  );
}
