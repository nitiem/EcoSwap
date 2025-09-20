#!/bin/bash

# EcoSwap Azure Static Web Apps Deployment Guide
# Run this script to deploy your EcoSwap app to Azure

echo "🌱 EcoSwap - Azure Static Web Apps Deployment"
echo "=============================================="

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo "✅ Azure CLI found"

# Check if user is logged in
if ! az account show &> /dev/null; then
    echo "🔐 Please log in to Azure first:"
    az login
fi

echo "✅ Azure authentication verified"

# Variables
RESOURCE_GROUP="EcoSwap-Resources"
LOCATION="eastus2"
APP_NAME="ecoswap-app"
GITHUB_REPO="https://github.com/nitiem/EcoSwap"

echo ""
echo "📋 Configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo "   App Name: $APP_NAME"
echo "   GitHub Repo: $GITHUB_REPO"
echo ""

read -p "Press Enter to continue with deployment..."

# Create resource group
echo "🏗️  Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Static Web App
echo "🚀 Creating Azure Static Web App..."
az staticwebapp create \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --source $GITHUB_REPO \
    --location $LOCATION \
    --branch main \
    --app-location "/" \
    --api-location "/api" \
    --output-location "/dist"

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Go to Azure Portal and find your Static Web App"
echo "2. Add environment variables in Configuration:"
echo "   - OPENAI_API_KEY: your_openai_api_key"
echo "   - OPENAI_MAX_REQUESTS_PER_HOUR: 50"
echo "   - OPENAI_MAX_DAILY_COST: 2.00"
echo "   - SCRAPING_TIMEOUT: 30000"
echo "   - PUPPETEER_HEADLESS: true"
echo ""
echo "3. Your app will be available at:"
az staticwebapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostname" --output tsv

echo ""
echo "🌱 Happy EcoSwapping!"