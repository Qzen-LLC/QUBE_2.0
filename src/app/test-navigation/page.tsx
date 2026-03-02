"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TestNavigationPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(`🧪 [TEST] ${message}`);
    setTestResults(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testRouterPush = () => {
    addLog('Testing router.push navigation...');
    router.push('/dashboard');
  };

  const testRouterBack = () => {
    addLog('Testing router.back navigation...');
    router.back();
  };

  const testLinkNavigation = () => {
    addLog('Testing Link component navigation...');
    // This will be handled by the Link component
  };

  const testWindowLocation = () => {
    addLog('Testing window.location navigation...');
    window.location.href = '/dashboard';
  };

  const testBeaconRelease = () => {
    addLog('Testing beacon lock release...');
    const data = new FormData();
    data.append('useCaseId', 'test-use-case-id');
    data.append('lockType', 'EXCLUSIVE');
    data.append('scope', 'ASSESS');
    const result = navigator.sendBeacon('/api/locks/release', data);
    addLog(`Beacon result: ${result}`);
  };

  const testLockReleaseAPI = async () => {
    addLog('Testing lock release API...');
    try {
      const response = await fetch('/api/test-lock-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          useCaseId: 'test-use-case-id', 
          lockType: 'EXCLUSIVE', 
          scope: 'ASSESS' 
        })
      });
      const data = await response.json();
      addLog(`API response: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`API error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Navigation Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Navigation Methods</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={testRouterPush}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Router.push
            </button>
            <button
              onClick={testRouterBack}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Router.back
            </button>
            <Link
              href="/dashboard"
              onClick={() => addLog('Link clicked, navigating...')}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-center"
            >
              Test Link Navigation
            </Link>
            <button
              onClick={testWindowLocation}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Test Window.location
            </button>
                         <button
               onClick={testBeaconRelease}
               className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
             >
               Test Beacon Release
             </button>
             <button
               onClick={testLockReleaseAPI}
               className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
             >
               Test Lock Release API
             </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Logs</h2>
          <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No logs yet. Perform some actions to see results.</p>
            ) : (
              testResults.map((log, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setTestResults([])}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Logs
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Go to the assess dashboard and acquire a lock</li>
            <li>Come back to this test page</li>
            <li>Try different navigation methods</li>
            <li>Check the browser console and server logs for lock release messages</li>
            <li>Verify that the lock is released when you navigate away</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
