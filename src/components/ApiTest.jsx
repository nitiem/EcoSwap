// Simple API test component for debugging Azure deployment
import { useState } from 'react';

const ApiTest = () => {
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testApiEndpoint = async () => {
    setIsLoading(true);
    setTestResult('Testing API...');
    
    try {
      const apiUrl = '/api/recipes/analyze';
      console.log('🧪 Testing API endpoint:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com/test-recipe'
        })
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', [...response.headers.entries()]);
      
      const contentType = response.headers.get('content-type');
      console.log('📡 Content-Type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        setTestResult(`✅ JSON Response (${response.status}):\n${JSON.stringify(jsonData, null, 2)}`);
      } else {
        const textData = await response.text();
        setTestResult(`❌ Non-JSON Response (${response.status}):\n${textData.substring(0, 500)}...`);
      }
      
    } catch (error) {
      console.error('🚨 Test error:', error);
      setTestResult(`🚨 Error: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  const testHealthCheck = async () => {
    setIsLoading(true);
    setTestResult('Testing health check...');
    
    try {
      const response = await fetch('/api/health');
      const text = await response.text();
      setTestResult(`Health check (${response.status}): ${text}`);
    } catch (error) {
      setTestResult(`Health check failed: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      zIndex: 9999,
      maxWidth: '400px',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h3>🧪 API Debug Panel</h3>
      <button 
        onClick={testApiEndpoint} 
        disabled={isLoading}
        style={{ margin: '5px', padding: '5px 10px', fontSize: '12px' }}
      >
        Test Recipe API
      </button>
      <button 
        onClick={testHealthCheck} 
        disabled={isLoading}
        style={{ margin: '5px', padding: '5px 10px', fontSize: '12px' }}
      >
        Test Health Check
      </button>
      <pre style={{ 
        background: '#333', 
        padding: '10px', 
        borderRadius: '3px', 
        overflow: 'auto',
        maxHeight: '300px',
        whiteSpace: 'pre-wrap'
      }}>
        {testResult}
      </pre>
    </div>
  );
};

export default ApiTest;