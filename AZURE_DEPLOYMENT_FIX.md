# 🚨 Azure Static Web Apps Deployment Error Fix

## Problem
```
The content server has rejected the request with: BadRequest
Reason: No matching Static Web App was found or the api key was invalid.
```

## Root Causes & Solutions

### **Cause 1: Static Web App Doesn't Exist**
The GitHub workflow is trying to deploy to a Static Web App that doesn't exist in Azure.

**Solution:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Static Web App"
4. Create a new Static Web App with these settings:
   - **Name**: `ecoswap-app` (or any name you prefer)
   - **Resource Group**: Create new or use existing
   - **Region**: Choose closest to you (e.g., East US 2)
   - **Source**: GitHub
   - **Repository**: `nitiem/EcoSwap`
   - **Branch**: `main`
   - **Build Presets**: React
   - **App location**: `/`
   - **API location**: `/api`
   - **Output location**: `/dist`

### **Cause 2: Invalid API Token**
The GitHub workflow has an outdated or invalid deployment token.

**Solution A: Regenerate from Azure Portal**
1. Go to Azure Portal → Your Static Web App
2. Go to "Deployment tokens"
3. Click "Reset token"
4. Copy the new token
5. Go to GitHub → Your repository → Settings → Secrets
6. Update `AZURE_STATIC_WEB_APPS_API_TOKEN_*` with the new token

**Solution B: Delete & Recreate Static Web App**
1. Delete the existing GitHub workflow files
2. Delete the Static Web App in Azure Portal
3. Create a new Static Web App (this will auto-generate new workflows)

### **Cause 3: Multiple Workflow Files**
You have multiple Azure workflow files that might conflict.

**Current Workflow Files:**
- `azure-static-web-apps-ashy-ground-0ad5bb110.yml`
- `azure-static-web-apps-yellow-field-070d64810.yml`

**Solution:**
1. Keep only ONE workflow file
2. Delete the others or disable them

## 🎯 **Recommended Quick Fix**

### Option 1: Start Fresh (Easiest)
1. **Delete existing workflows:**
   ```bash
   cd /c/Users/nitiem/Documents/EcoSwap
   rm -rf .github/workflows/azure-static-web-apps-*.yml
   git add .
   git commit -m "Remove old Azure workflows"
   git push
   ```

2. **Create new Static Web App in Azure Portal:**
   - This will automatically create a new workflow with correct tokens

### Option 2: Fix Current Setup
1. **Check which Static Web App exists in Azure Portal**
2. **Get the correct deployment token**
3. **Update GitHub secrets**

## 🔍 **Verification Steps**

After fixing, verify:
1. ✅ One Static Web App exists in Azure Portal
2. ✅ One workflow file in `.github/workflows/`
3. ✅ Correct deployment token in GitHub secrets
4. ✅ GitHub Action runs successfully
5. ✅ App is accessible at Azure URL

## 📞 **Need Help?**

If you're still having issues:
1. Share the exact Static Web App name from Azure Portal
2. Confirm which workflow file should be active
3. Check GitHub Actions logs for detailed error messages