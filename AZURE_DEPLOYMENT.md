# 🚀 EcoSwap Azure Deployment Guide

## Prerequisites
- Azure account with credits
- Azure CLI installed
- GitHub repository
- VS Code with Azure Static Web Apps extension

## Option 1: Azure Static Web Apps (RECOMMENDED)

### Step 1: Install Azure Static Web Apps CLI
```bash
npm install -g @azure/static-web-apps-cli
```

### Step 2: Install Azure Functions Core Tools
```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

### Step 3: Prepare Your Project Structure

Your project should look like this:
```
EcoSwap/
├── src/                    # React frontend
├── api/                    # Azure Functions backend
│   ├── src/
│   │   ├── functions/
│   │   └── services/
│   ├── host.json
│   └── package.json
├── staticwebapp.config.json
├── package.json
└── vite.config.js
```

### Step 4: Update Frontend API Configuration

Update your `src/services/apiService.js`:
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Azure Static Web Apps automatically routes /api to functions
  : 'http://localhost:7071/api';
```

### Step 5: Build Configuration

Update your `vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: true
      }
    }
  }
})
```

### Step 6: Deploy to Azure

#### Option A: Deploy via Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Create new "Static Web App"
3. Connect your GitHub repository
4. Set build details:
   - **App location**: `/`
   - **API location**: `/api`
   - **Output location**: `/dist`

#### Option B: Deploy via Azure CLI
```bash
# Login to Azure
az login

# Create resource group
az group create --name ecoswap-rg --location "East US"

# Create static web app
az staticwebapp create \
  --name ecoswap-app \
  --resource-group ecoswap-rg \
  --source https://github.com/yourusername/ecoswap \
  --location "East US2" \
  --branch main \
  --app-location "/" \
  --api-location "/api" \
  --output-location "/dist"
```

### Step 7: Environment Variables

In Azure Portal → Your Static Web App → Configuration, add:
- `OPENAI_API_KEY`: Your OpenAI API key
- `OPENAI_MAX_REQUESTS_PER_HOUR`: 50
- `OPENAI_MAX_DAILY_COST`: 2.00

## Option 2: Azure App Service

### Deploy Frontend and Backend Separately

#### Frontend (React App):
1. Build your React app: `npm run build`
2. Create Azure App Service (Linux, Node.js)
3. Deploy via GitHub Actions or Azure CLI

#### Backend (Node.js API):
1. Create separate App Service for API
2. Deploy your backend code
3. Update CORS settings

## Option 3: Azure Container Apps

### Containerize Your Application

Create `Dockerfile`:
```dockerfile
# Frontend build
FROM node:18 AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Backend
FROM node:18
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
COPY --from=frontend-build /app/dist ./public

EXPOSE 3002
CMD ["npm", "start"]
```

Deploy:
```bash
az containerapp create \
  --name ecoswap \
  --resource-group ecoswap-rg \
  --environment myenvironment \
  --image myregistry.azurecr.io/ecoswap:latest
```

## 💰 Cost Estimation

### Azure Static Web Apps (FREE TIER):
- ✅ **FREE** for up to 100GB bandwidth/month
- ✅ **FREE** 2 custom domains
- ✅ **FREE** SSL certificates
- ✅ **1M function executions/month** FREE

### Azure App Service:
- **Basic B1**: ~$13/month (1 core, 1.75GB RAM)
- **Standard S1**: ~$56/month (1 core, 1.75GB RAM + staging slots)

### Azure Container Apps:
- **Pay per use**: ~$0.000024/vCPU-second + $0.000004/GiB-second

## 🔒 Security Considerations

1. **Environment Variables**: Store sensitive data in Azure App Settings
2. **CORS**: Configure properly for your domain
3. **API Keys**: Use Azure Key Vault for production
4. **SSL**: Automatic with custom domains

## 📊 Monitoring

Enable in Azure Portal:
- **Application Insights** for performance monitoring
- **Log Analytics** for detailed logs
- **Alerts** for errors or high usage

## 🚀 Recommended Deployment Steps

1. **Start with Azure Static Web Apps** (free tier)
2. **Connect GitHub repository** for automatic deployments
3. **Add environment variables** in Azure Portal
4. **Test thoroughly** on the free tier
5. **Scale up** if needed based on usage

Would you like me to help you set up any of these deployment options?