# BCABuddy - Azure Portal Deployment Guide

## Quick Start

BCABuddy is fully configured for Azure deployment. Choose your preferred method:

---

## Option 1: Azure App Service (Recommended)

### Via Azure Portal

1. **Create App Service**
   - Go to Azure Portal > Create Resource > Web App
   - Runtime: **Node 20 LTS**
   - OS: **Linux** (recommended) or Windows
   - Plan: **B1** or higher

2. **Configure App Settings**
   ```
   WEBSITE_NODE_DEFAULT_VERSION = 20
   NODE_ENV = production
   SCM_DO_BUILD_DURING_DEPLOYMENT = true
   ```

3. **Deploy**
   - Use **Deployment Center** > GitHub/Local Git
   - Or use Azure CLI:
   ```bash
   # Build locally
   npm ci --legacy-peer-deps
   npx expo export --platform all
   npm install express compression
   
   # Deploy
   az webapp up --name bcabuddy --runtime "NODE:20-lts"
   ```

4. **Verify**
   - Visit: `https://bcabuddy.azurewebsites.net`
   - Health: `https://bcabuddy.azurewebsites.net/api/health`

---

## Option 2: Azure Static Web Apps

1. **Create Static Web App** in Azure Portal
2. Connect your GitHub repository
3. Build configuration:
   - **App location**: `/`
   - **Output location**: `dist`
   - **Build command**: `npm ci --legacy-peer-deps && npx expo export --platform all`
4. The `staticwebapp.config.json` handles SPA routing automatically

---

## Option 3: Azure Container Instances / AKS

```bash
# Build Docker image
docker build -t bcabuddy:latest .

# Push to Azure Container Registry
az acr login --name yourregistry
docker tag bcabuddy:latest yourregistry.azurecr.io/bcabuddy:latest
docker push yourregistry.azurecr.io/bcabuddy:latest

# Deploy to Azure Container Instances
az container create \
  --resource-group myResourceGroup \
  --name bcabuddy \
  --image yourregistry.azurecr.io/bcabuddy:latest \
  --ports 8080 \
  --dns-name-label bcabuddy
```

---

## Option 4: CI/CD Pipelines

### GitHub Actions
1. Add `AZURE_WEBAPP_PUBLISH_PROFILE` secret in GitHub repo settings
2. Pipeline at `.github/workflows/azure-deploy.yml` runs automatically on push to `main`

### Azure DevOps
1. Import `azure-pipelines.yml` in your Azure DevOps project
2. Update `azureSubscription` and `appName` variables
3. Pipeline triggers on push to `main`

---

## Project Structure for Azure

```
bcabuddy/
├── server.js                    # Express server for App Service
├── web.config                   # IIS config (Windows App Service)
├── Dockerfile                   # Container deployment
├── .dockerignore                # Docker ignore rules
├── staticwebapp.config.json     # Azure Static Web Apps config
├── .deployment                  # Kudu deployment hook
├── deploy.sh                    # Kudu build script
├── azure-pipelines.yml          # Azure DevOps CI/CD
├── .github/workflows/           # GitHub Actions CI/CD
├── dist/                        # Built web assets (after export)
├── App.tsx                      # Main app entry
├── screens/                     # All app screens
├── components/                  # Reusable components
└── lib/                         # Theme, data, utilities
```

## Health Check & Monitoring

- **Health endpoint**: `/api/health`
- **Info endpoint**: `/api/info`
- Configure Azure Application Insights for monitoring
- Set up Azure Alerts on health check failures

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port (Azure sets this) |
| `NODE_ENV` | `production` | Environment mode |
| `WEBSITE_NODE_DEFAULT_VERSION` | `20` | Node.js version |

## Mobile App Backend Alignment (BCABuddy 2.0)

This Expo app now supports direct integration with the BCABuddy 2.0 FastAPI backend.

- Default backend URL: `https://bcabuddy-web-f5dfgtb2b0dmc8aq.centralindia-01.azurewebsites.net`
- Health probe used by app: `/api/health`
- Chat endpoint used by app: `/chat` (requires Bearer token)

Optional override for environments:

```bash
EXPO_PUBLIC_API_BASE_URL=https://your-backend.azurewebsites.net
```

For local Expo runs (PowerShell):

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"
npm run web
```
