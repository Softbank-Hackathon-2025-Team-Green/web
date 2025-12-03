import AuthButtonHosted from '@/components/AuthButtonHosted';

export default function AuthDemoPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Demo</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Sign In / Sign Up with AWS Hosted UI</h2>
          <AuthButtonHosted />
        </div>

        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold">1. Click &quot;Sign In with AWS&quot;</h3>
              <p className="text-sm text-gray-700">
                You&apos;ll be redirected to AWS Cognito&apos;s secure login page.
              </p>
            </div>

            <div>
              <h3 className="font-bold">2. Sign Up or Sign In</h3>
              <p className="text-sm text-gray-700">
                Create a new account or sign in with existing credentials on the AWS page.
                AWS handles all the authentication, verification, and security.
              </p>
            </div>

            <div>
              <h3 className="font-bold">3. Verify Email</h3>
              <p className="text-sm text-gray-700">
                If signing up, check your email for a verification code.
                Enter it on the AWS page to complete registration.
              </p>
            </div>

            <div>
              <h3 className="font-bold">4. Redirected Back</h3>
              <p className="text-sm text-gray-700">
                After successful authentication, you&apos;ll be redirected back to this page.
                Your unique user ID will be used across the application.
              </p>
            </div>

            <div>
              <h3 className="font-bold">5. API Usage</h3>
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
NEXT_PUBLIC_AWS_REGION=ap-northeast-2

# Hosted UI (required for AWS login page)
NEXT_PUBLIC_COGNITO_DOMAIN=your-app.auth.ap-northeast-2.amazoncognito.com
NEXT_PUBLIC_REDIRECT_SIGN_IN=http://localhost:3000/
NEXT_PUBLIC_REDIRECT_SIGN_OUT=http://localhost:3000/`}
          </pre>
          <p className="mt-4 text-sm text-gray-700">
            See <code className="bg-white px-2 py-1 rounded">docs/HOSTED_UI_SETUP.md</code> for detailed setup instructions.
          </p>
        </div>
      </div>
    </div>
  );
}
