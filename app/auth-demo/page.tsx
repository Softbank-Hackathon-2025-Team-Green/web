import AuthButton from '@/components/AuthButton';

export default function AuthDemoPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Demo</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Sign In / Sign Up</h2>
          <AuthButton />
        </div>

        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold">1. Sign Up</h3>
              <p className="text-sm text-gray-700">
                Create a new account with your email and password.
                You&apos;ll receive a verification email from AWS Cognito.
              </p>
            </div>

            <div>
              <h3 className="font-bold">2. Verify Email</h3>
              <p className="text-sm text-gray-700">
                Click the verification link in your email to activate your account.
              </p>
            </div>

            <div>
              <h3 className="font-bold">3. Sign In</h3>
              <p className="text-sm text-gray-700">
                Use your email and password to sign in.
                Your unique user ID will be used across the application.
              </p>
            </div>

            <div>
              <h3 className="font-bold">4. API Usage</h3>
              <p className="text-sm text-gray-700">
                Once signed in, your user ID is automatically included in API requests.
                Test the /api/auth/me endpoint to see your user information.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Configuration Required</h2>
          <p className="mb-2">Add these to your <code className="bg-white px-2 py-1 rounded">.env.local</code>:</p>
          <pre className="bg-white p-4 rounded text-sm overflow-x-auto">
{`NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-pool-id
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=your-client-id
NEXT_PUBLIC_AWS_REGION=ap-northeast-2`}
          </pre>
        </div>
      </div>
    </div>
  );
}
