const { app } = require('@azure/functions');

// Simple health check endpoint
app.http('health', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log('🏥 Health check endpoint called');
    
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        message: 'EcoSwap API is running on Azure Functions',
        version: '1.0.0'
      })
    };
  }
});

// CORS preflight handler for health check
app.http('healthOptions', {
  methods: ['OPTIONS'],
  authLevel: 'anonymous', 
  handler: async (request, context) => {
    context.log('🏥 Health check OPTIONS called');
    
    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }
});