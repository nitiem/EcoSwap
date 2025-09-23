module.exports = async function (context, req) {
  context.log('Health check endpoint called');

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'EcoSwap API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  };

  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: healthData
  };
};