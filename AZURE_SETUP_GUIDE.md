# Azure Environment Variables Setup Guide

## 🔧 Required Environment Variables for Azure Static Web Apps

After your app deploys, you MUST add these environment variables in Azure Portal:

### Navigate to Azure Portal:
1. Go to https://portal.azure.com
2. Find your Static Web App (likely named "ecoswap-app" or similar)
3. Go to "Configuration" in the left menu
4. Add these Application Settings:

### Required Variables:
```
OPENAI_API_KEY = your_openai_api_key_here

OPENAI_MAX_REQUESTS_PER_HOUR = 50

OPENAI_MAX_DAILY_COST = 2.00

SCRAPING_TIMEOUT = 30000

PUPPETEER_HEADLESS = true
```

### After Adding Variables:
1. Click "Save" in Azure Portal
2. Wait for the app to restart (2-3 minutes)
3. Test your API endpoints

## 🧪 Testing Your Deployed API

Once deployed, your API will be available at:
`https://[your-app-name].azurestaticapps.net/api/recipes/analyze`

Test with a POST request containing:
```json
{
  "url": "https://example.com/some-recipe"
}
```