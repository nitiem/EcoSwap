# 🚀 GitHub Push Commands

## After creating your repository on GitHub, run these commands:

```bash
# Replace 'yourusername' with your actual GitHub username
git remote add origin https://github.com/yourusername/EcoSwap.git

# Push your code to GitHub
git push -u origin main
```

## If you encounter authentication issues:

### Option 1: Personal Access Token (Recommended)
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with 'repo' permissions
3. Use your username and the token as password when prompted

### Option 2: GitHub CLI Authentication
```bash
# Install GitHub CLI if not already installed
winget install --id GitHub.cli

# Authenticate with GitHub
gh auth login
```

## Repository URL Format:
Your repository URL will be:
`https://github.com/YOUR_USERNAME/EcoSwap.git`

## Verification:
After pushing, you should see your code at:
`https://github.com/YOUR_USERNAME/EcoSwap`

## Next Steps for Azure Deployment:
1. ✅ Code pushed to GitHub
2. 🚀 Go to Azure Portal
3. 🌐 Create Static Web App
4. 🔗 Connect to your GitHub repository
5. ⚙️ Configure build settings
6. 🔑 Add environment variables

## Build Settings for Azure Static Web Apps:
- **App location**: `/`
- **API location**: `/api`
- **Output location**: `/dist`