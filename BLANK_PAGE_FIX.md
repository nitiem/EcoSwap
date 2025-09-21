# 🚨 Azure Static Web App Blank Page Troubleshooting

## Common Causes of Blank Page in Azure Static Web Apps

### 1. **Build Output Path Mismatch**
**Problem**: Azure is looking for files in `/dist` but they're generated elsewhere.

**Check**: 
- Workflow specifies `output_location: "/dist"`
- Vite builds to `dist` folder by default ✅
- But Azure might not be finding the files

### 2. **Missing Index.html or Build Failure**
**Problem**: The build process failed or didn't generate index.html

**Solution**: Check GitHub Actions logs for build errors

### 3. **Content Security Policy Issues**
**Problem**: CSP blocking React from loading

**Current CSP**: `default-src https: 'unsafe-eval' 'unsafe-inline'; object-src 'none'`
**Possible Issue**: Too restrictive for development

### 4. **SPA Routing Configuration**
**Problem**: React Router not properly configured for Azure Static Web Apps

**Current Config**: ✅ Properly configured with fallback to index.html

## 🔍 Immediate Diagnostic Steps

### Step 1: Check GitHub Actions Logs
1. Go to: https://github.com/nitiem/EcoSwap/actions
2. Click on the latest workflow run
3. Look for build errors in the "Build and Deploy Job"
4. Check if the build step completed successfully

### Step 2: Check Azure Portal
1. Go to Azure Portal → Your Static Web App
2. Go to "Functions" or "Environment Variables"
3. Check if environment variables are set (needed for API)

### Step 3: Test Local Build
Run these commands locally:
```bash
cd /c/Users/nitiem/Documents/EcoSwap
npm install
npm run build
```

Check if `dist` folder is created with:
- `index.html`
- `assets` folder with JS/CSS files

### Step 4: Check Browser Console
1. Go to your Azure Static Web App URL
2. Open browser Developer Tools (F12)
3. Check Console for JavaScript errors
4. Check Network tab for failed requests

## 🔧 Quick Fixes to Try

### Fix 1: Update Build Configuration
Add explicit build settings to the Azure workflow.

### Fix 2: Relax Content Security Policy
Temporarily allow all sources for testing.

### Fix 3: Add Environment Detection
Ensure the app knows it's running in production.

### Fix 4: Check Asset Paths
Make sure all assets use relative paths.

## 🚀 Testing URLs
After each fix, test these URLs:
- Main app: `https://your-app.azurestaticapps.net`
- API health: `https://your-app.azurestaticapps.net/api/recipes/analyze`

## 📝 What to Share for Further Help
1. GitHub Actions log output (especially build step)
2. Browser console errors
3. Azure Static Web App URL
4. Any error messages in Azure Portal