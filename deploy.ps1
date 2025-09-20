# EcoSwap Azure Static Web Apps Deployment Script for Windows
# Run this script in PowerShell to deploy your EcoSwap app to Azure

Write-Host "🌱 EcoSwap - Azure Static Web Apps Deployment" -ForegroundColor Green
Write-Host "=============================================="

# Check if Azure CLI is installed
try {
    az --version | Out-Null
    Write-Host "✅ Azure CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows"
    exit 1
}

# Check if user is logged in
try {
    az account show | Out-Null
    Write-Host "✅ Azure authentication verified" -ForegroundColor Green
} catch {
    Write-Host "🔐 Please log in to Azure first:" -ForegroundColor Yellow
    az login
}

# Variables
$RESOURCE_GROUP = "EcoSwap-Resources"
$LOCATION = "eastus2"
$APP_NAME = "ecoswap-app"
$GITHUB_REPO = "https://github.com/nitiem/EcoSwap"

Write-Host ""
Write-Host "📋 Configuration:"
Write-Host "   Resource Group: $RESOURCE_GROUP"
Write-Host "   Location: $LOCATION"
Write-Host "   App Name: $APP_NAME"
Write-Host "   GitHub Repo: $GITHUB_REPO"
Write-Host ""

Read-Host "Press Enter to continue with deployment..."

# Create resource group
Write-Host "🏗️  Creating resource group..." -ForegroundColor Yellow
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Static Web App
Write-Host "🚀 Creating Azure Static Web App..." -ForegroundColor Yellow
az staticwebapp create `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --source $GITHUB_REPO `
    --location $LOCATION `
    --branch main `
    --app-location "/" `
    --api-location "/api" `
    --output-location "/dist"

Write-Host ""
Write-Host "✅ Deployment initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Go to Azure Portal and find your Static Web App"
Write-Host "2. Add environment variables in Configuration:"
Write-Host "   - OPENAI_API_KEY: your_openai_api_key"
Write-Host "   - OPENAI_MAX_REQUESTS_PER_HOUR: 50"
Write-Host "   - OPENAI_MAX_DAILY_COST: 2.00"
Write-Host "   - SCRAPING_TIMEOUT: 30000"
Write-Host "   - PUPPETEER_HEADLESS: true"
Write-Host ""
Write-Host "3. Your app will be available at:"
$hostname = az staticwebapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostname" --output tsv
Write-Host "   https://$hostname" -ForegroundColor Cyan

Write-Host ""
Write-Host "🌱 Happy EcoSwapping!" -ForegroundColor Green