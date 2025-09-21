import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Debug logging for Azure deployment
console.log('🌱 EcoSwap main.jsx loading...', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  location: window.location.href,
  environment: import.meta.env.MODE
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found, mounting React app...');
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
  console.log('✅ React app mounted successfully');
} catch (error) {
  console.error('❌ Error mounting React app:', error);
  // Fallback content
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h1 style="color: #e74c3c;">🌱 EcoSwap - Loading Error</h1>
      <p>Failed to load the application. Please refresh the page.</p>
      <button onclick="window.location.reload()" style="
        background: #28a745; 
        color: white; 
        border: none; 
        padding: 10px 20px; 
        border-radius: 4px; 
        cursor: pointer;
      ">Reload</button>
      <details style="margin-top: 20px;">
        <summary>Error Details</summary>
        <pre style="text-align: left; background: #f8f9fa; padding: 10px; border-radius: 4px;">${error.message}</pre>
      </details>
    </div>
  `;
}
