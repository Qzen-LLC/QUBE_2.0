"use client";
import React, { useState, useEffect } from 'react';
import { useLock } from '@/hooks/useLock';

export default function TestLockRelease() {
  const [useCaseId, setUseCaseId] = useState('d5bc5d62-7b07-48b0-8ecd-89494d787032'); // Use the ID from your logs
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const {
    lockInfo,
    isExclusiveLocked,
    acquireExclusiveLock,
    releaseLock,
    loading,
    error
  } = useLock(useCaseId, 'ASSESS');

  const addLog = (message: string) => {
    console.log(`🔒 [TEST] ${message}`);
    setTestResults(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testManualRelease = async () => {
    addLog('Testing manual lock release...');
    try {
      await releaseLock('EXCLUSIVE');
      addLog('Manual release completed');
    } catch (error) {
      addLog(`Manual release failed: ${error}`);
    }
  };

  const testAcquireLock = async () => {
    addLog('Testing lock acquisition...');
    try {
      const result = await acquireExclusiveLock();
      addLog(`Lock acquisition result: ${result}`);
    } catch (error) {
      addLog(`Lock acquisition failed: ${error}`);
    }
  };

  const testBeaconRelease = () => {
    addLog('Testing beacon release...');
    try {
      const data = new FormData();
      data.append('useCaseId', useCaseId);
      data.append('lockType', 'EXCLUSIVE');
      data.append('scope', 'ASSESS');
      const result = navigator.sendBeacon('/api/locks/release', data);
      addLog(`Beacon result: ${result}`);
    } catch (error) {
      addLog(`Beacon failed: ${error}`);
    }
  };

  const testFetchRelease = async () => {
    addLog('Testing fetch release...');
    try {
      const response = await fetch('/api/locks/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCaseId, lockType: 'EXCLUSIVE', scope: 'ASSESS' })
      });
      const data = await response.json();
      addLog(`Fetch release response: ${response.status} - ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`Fetch release failed: ${error}`);
    }
  };

  useEffect(() => {
    addLog('Test page loaded');
    addLog(`Current lock status: ${isExclusiveLocked ? 'LOCKED' : 'UNLOCKED'}`);
    addLog(`Lock info: ${JSON.stringify(lockInfo)}`);
  }, [isExclusiveLocked, lockInfo]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Lock Release Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <strong>Use Case ID:</strong> {useCaseId}
            </div>
            <div>
              <strong>Lock Status:</strong> {isExclusiveLocked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
            </div>
            <div>
              <strong>Loading:</strong> {loading ? '⏳ Loading...' : '✅ Ready'}
            </div>
            <div>
              <strong>Error:</strong> {error || 'None'}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <strong>Lock Info:</strong>
            <pre className="text-sm mt-2">{JSON.stringify(lockInfo, null, 2)}</pre>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={testAcquireLock}
              disabled={loading || isExclusiveLocked}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              Acquire Lock
            </button>
            <button
              onClick={testManualRelease}
              disabled={loading || !isExclusiveLocked}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
            >
              Release Lock (Manual)
            </button>
            <button
              onClick={testFetchRelease}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Fetch Release
            </button>
            <button
              onClick={testBeaconRelease}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Test Beacon Release
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Test Navigation (Go to Dashboard)
            </button>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Test Close Tab
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="text-sm text-gray-600">
              <strong>Navigation Test Instructions:</strong>
              <ul className="mt-2 list-disc list-inside">
                <li>First acquire a lock using the "Acquire Lock" button</li>
                <li>Then use "Test Navigation" to simulate leaving the page</li>
                <li>Check the browser console and server logs for lock release messages</li>
                <li>Use "Test Close Tab" to simulate closing the browser tab</li>
              </ul>
            </div>
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
      </div>
    </div>
  );
}
