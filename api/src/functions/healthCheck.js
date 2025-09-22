const { app } = require('@azure/functions');

app.http('healthCheck', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (request, context) => {
    context.log('Health check endpoint called');
    
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        message: 'EcoSwap API is running'
      })
    };
  }
});

// CORS preflight handler
app.http('healthCheckOptions', {
  methods: ['OPTIONS'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (request, context) => {
    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }
});