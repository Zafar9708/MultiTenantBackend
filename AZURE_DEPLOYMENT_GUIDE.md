# Azure App Service Deployment Guide

Complete step-by-step guide to deploy the Multi-Tenant Backend to Azure App Service.

## Prerequisites

- [x] Azure account with active subscription
- [x] MongoDB Atlas database connection string
- [x] All environment variables ready
- [x] Application files prepared

## Part 1: Prepare Deployment Package

### Step 1: Clean Your Project

Before creating the deployment package, ensure your project is clean:

```powershell
# Delete node_modules (will be installed on Azure)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Clear logs
Remove-Item -Recurse -Force logs -ErrorAction SilentlyContinue
```

### Step 2: Create Deployment ZIP

Create a ZIP file containing all your application files EXCEPT:
- `node_modules/` folder
- `logs/` folder
- `.env` or `config.env` files (will be configured in Azure)

**Files to include:**
- All `.js` files (app.js, server.js, etc.)
- `package.json` and `package-lock.json`
- `web.config`
- `.deployment`
- All folders: `config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `services/`, `utils/`, `scripts/`, `data/`
- Binary files: `eng.traineddata`, `model.nlp`

**To create ZIP in Windows:**
1. Select all files and folders (excluding node_modules and logs)
2. Right-click → Send to → Compressed (zipped) folder
3. Name it `app-deployment.zip`

**Or use PowerShell:**
```powershell
Compress-Archive -Path * -DestinationPath app-deployment.zip -Force -Exclude node_modules,logs,.env,config.env
```

## Part 2: Create Azure App Service

### Step 1: Sign in to Azure Portal

1. Go to https://portal.azure.com
2. Sign in with your Azure account

### Step 2: Create a New App Service

1. Click **"Create a resource"** (+ icon in top left)
2. Search for **"Web App"** and select it
3. Click **"Create"**

### Step 3: Configure Basic Settings

Fill in the **Basics** tab:

**Project Details:**
- **Subscription**: Select your Azure subscription
- **Resource Group**: Create new or select existing (e.g., `rg-multitenant-backend`)

**Instance Details:**
- **Name**: Enter unique name (e.g., `multitenant-backend-app`)
  - This will be your URL: `https://multitenant-backend-app.azurewebsites.net`
- **Publish**: Select **Code**
- **Runtime stack**: Select **Node 18 LTS**
- **Operating System**: Select **Windows** or **Linux** (Windows recommended for web.config)
- **Region**: Choose closest to your users (e.g., East US, West Europe)

**Pricing Plans:**
- **Windows Plan**: Create new or select existing
- **Pricing plan**: Select **Basic B1** or higher (required for Always On and WebSockets)
  - Don't use Free tier - it doesn't support Always On or WebSockets

4. Click **"Review + create"**
5. Review settings and click **"Create"**
6. Wait for deployment to complete (1-2 minutes)
7. Click **"Go to resource"**

## Part 3: Configure App Service Settings

### Step 1: Enable WebSockets (Critical for Socket.io)

1. In your App Service, go to **Settings → Configuration**
2. Click on **"General settings"** tab
3. Find **"Web sockets"** and toggle it to **On**
4. Click **"Save"** at the top
5. Click **"Continue"** when prompted (app will restart)

### Step 2: Enable Always On

1. Still in **Configuration → General settings**
2. Find **"Always On"** and toggle it to **On**
3. Click **"Save"** at the top

### Step 3: Set Application Settings (Environment Variables)

1. In **Configuration**, click on **"Application settings"** tab
2. Click **"+ New application setting"** for each variable:

**Required Settings:**

| Name | Value | Example |
|------|-------|---------|
| `NODE_ENV` | `production` | production |
| `DATABASE_URI` | Your MongoDB Atlas connection string | mongodb+srv://user:pass@cluster.mongodb.net/dbname |
| `JWT_SECRET` | Your JWT secret key | your-super-secret-jwt-key-here |
| `FRONTEND_URL` | Your frontend URL | https://wrocusats.vercel.app |
| `PORT` | Leave blank (Azure sets this automatically) | - |
| `WEBSITE_NODE_DEFAULT_VERSION` | `18-lts` | 18-lts |

**Additional Settings (based on your .env file):**

Add all other environment variables from your `.env` file:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`
- Any other API keys or secrets

**How to add each setting:**
1. Click **"+ New application setting"**
2. Enter **Name** and **Value**
3. Click **"OK"**
4. Repeat for all variables

3. After adding all settings, click **"Save"** at the top
4. Click **"Continue"** when prompted

### Step 4: Configure CORS (if needed)

1. Go to **API → CORS**
2. Add your frontend URL(s):
   - `http://localhost:5173` (for local development)
   - `https://wrocusats.vercel.app` (your production frontend)
3. Click **"Save"**

**Note:** Your app already handles CORS in Express, but this adds an extra layer.

## Part 4: Deploy Your Application

### Method 1: ZIP Deploy (Recommended)

1. Go to **Deployment → Deployment Center**
2. For **Source**, select **"Local Git"** or **"External Git"**
   - Or use **"ZIP Deploy"** option if available
3. Click **"Save"**

**Using Kudu (ZIP Deploy):**
1. Go to **Development Tools → Advanced Tools**
2. Click **"Go"** (opens Kudu dashboard)
3. Click **"Tools" → "Zip Push Deploy"**
4. Drag and drop your `app-deployment.zip` file to the `/site/wwwroot` folder
5. Wait for extraction to complete
6. Files will be extracted automatically

**Or use Azure CLI (if preferred):**
```bash
az webapp deployment source config-zip --resource-group rg-multitenant-backend --name multitenant-backend-app --src app-deployment.zip
```

### Method 2: FTP Deployment

1. Go to **Deployment → Deployment Center**
2. Click **"FTPS credentials"** tab
3. Note the FTP hostname, username, and password
4. Use an FTP client (FileZilla) to upload files to `/site/wwwroot`

## Part 5: Install Dependencies and Start App

### Option A: Automatic (Azure usually does this)

Azure should automatically run `npm install` after deployment. Wait 5-10 minutes.

### Option B: Manual (if needed)

1. Go to **Development Tools → Advanced Tools → Go**
2. Click **"Debug console" → "CMD"** or **"PowerShell"**
3. Navigate to your app directory:
   ```bash
   cd site\wwwroot
   ```
4. Run npm install:
   ```bash
   npm install --production
   ```
5. Wait for installation to complete

### Restart the App

1. Go back to your App Service **Overview**
2. Click **"Restart"** at the top
3. Click **"Yes"** to confirm
4. Wait for restart (30-60 seconds)

## Part 6: Verify Deployment

### Check Application Logs

1. Go to **Monitoring → Log stream**
2. Watch for startup messages
3. Look for:
   - "Database connected"
   - "Server running on port XXXX"
   - No error messages

**Or check logs via Kudu:**
1. Go to **Advanced Tools → Go**
2. Click **"Debug console" → "CMD"**
3. Navigate to `LogFiles`
4. Check `Application` logs for errors

### Test Your Application

1. Get your app URL: `https://your-app-name.azurewebsites.net`
2. Test basic endpoint:
   ```
   https://your-app-name.azurewebsites.net/
   ```
   Should return: "Hello, Node.js Server is Working with Socket.io!"

3. Test API endpoints:
   ```
   https://your-app-name.azurewebsites.net/api/v1/auth/...
   ```

4. Test Socket.io connection:
   ```
   https://your-app-name.azurewebsites.net/api/test-socket
   ```

### Monitor Performance

1. Go to **Monitoring → Metrics**
2. Check:
   - Response time
   - Request count
   - Errors
   - CPU/Memory usage

## Part 7: Troubleshooting

### Common Issues

#### 1. Application Won't Start

**Symptoms:** 503 Service Unavailable or Application Error

**Solutions:**
- Check **Log stream** for error messages
- Verify `NODE_ENV` is set to `production`
- Verify `WEBSITE_NODE_DEFAULT_VERSION` is `18-lts`
- Check that `package.json` has `"start": "node server.js"`
- Ensure all environment variables are set correctly

#### 2. Database Connection Fails

**Symptoms:** "Database connection error" in logs

**Solutions:**
- Verify `DATABASE_URI` is correct
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` to allow all IPs)
- Ensure database user has correct permissions
- Test connection string locally first

#### 3. Socket.io Not Working

**Symptoms:** WebSocket connections fail

**Solutions:**
- Verify **WebSockets** is enabled in Configuration
- Check CORS settings allow your frontend
- Ensure **Always On** is enabled
- Verify client is connecting to correct URL

#### 4. File Upload Issues

**Symptoms:** Multer or file upload errors

**Solutions:**
- Azure App Service has limited file system access
- Consider using Azure Blob Storage or Cloudinary (you're already using Cloudinary)
- Check file size limits in Azure

#### 5. Binary Files Missing

**Symptoms:** Tesseract or NLP errors

**Solutions:**
- Verify `eng.traineddata` and `model.nlp` are in deployment ZIP
- Check files exist: Go to Kudu → Debug Console → check `/site/wwwroot`
- Re-deploy with files included

### View Detailed Logs

**Application Logs:**
1. Enable application logging: **Monitoring → App Service logs**
2. Set **Application Logging (Filesystem)** to **Error** or **Verbose**
3. Click **"Save"**
4. View logs in **Log stream**

**Download Logs:**
1. Go to **Development Tools → Advanced Tools → Go**
2. Click **"Tools" → "Download support package"**
3. Extract and review logs

## Part 8: Post-Deployment Tasks

### Update Frontend Configuration

Update your frontend to use the new Azure backend URL:
```javascript
// Change from:
const API_URL = 'http://localhost:5000'

// To:
const API_URL = 'https://your-app-name.azurewebsites.net'
```

### Set Up Custom Domain (Optional)

1. Go to **Settings → Custom domains**
2. Click **"+ Add custom domain"**
3. Follow instructions to add your domain
4. Configure SSL certificate (free with App Service)

### Enable Application Insights (Recommended)

1. Go to **Settings → Application Insights**
2. Click **"Turn on Application Insights"**
3. Create new or select existing resource
4. Click **"Apply"**
5. Monitor performance, errors, and usage

### Set Up Backup (Recommended)

1. Go to **Settings → Backups**
2. Configure storage account
3. Set backup schedule
4. Click **"Save"**

### Scale Your App (If Needed)

1. Go to **Settings → Scale up (App Service plan)**
2. Choose higher tier for more resources
3. Or go to **Scale out** for multiple instances

## Part 9: CI/CD Setup (Optional - Future Enhancement)

For automated deployments from GitHub:

1. Go to **Deployment → Deployment Center**
2. Select **"GitHub"** as source
3. Authorize Azure to access your GitHub
4. Select repository and branch
5. Azure creates GitHub Actions workflow
6. Every push to main branch auto-deploys

## Environment Variables Checklist

Use this checklist to ensure all variables are configured:

**Core Settings:**
- [ ] `NODE_ENV`
- [ ] `DATABASE_URI`
- [ ] `JWT_SECRET`
- [ ] `FRONTEND_URL`
- [ ] `WEBSITE_NODE_DEFAULT_VERSION`

**Google OAuth:**
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_REDIRECT_URI`

**Cloudinary:**
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

**Email Service:**
- [ ] `EMAIL_HOST`
- [ ] `EMAIL_PORT`
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASS`
- [ ] `EMAIL_FROM`

**Other APIs:**
- [ ] Any other service credentials

## Azure Portal Quick Links

Once deployed, bookmark these:

- **App URL**: `https://your-app-name.azurewebsites.net`
- **Kudu**: `https://your-app-name.scm.azurewebsites.net`
- **Portal**: `https://portal.azure.com`

## Support and Resources

- **Azure App Service Docs**: https://docs.microsoft.com/en-us/azure/app-service/
- **Node.js on Azure**: https://docs.microsoft.com/en-us/azure/app-service/quickstart-nodejs
- **Socket.io on Azure**: Enable WebSockets in Configuration

## Summary

Your Multi-Tenant Backend is now deployed on Azure App Service! 🎉

**Key Points:**
- ✅ WebSockets enabled for Socket.io
- ✅ Always On enabled for real-time features
- ✅ Environment variables configured
- ✅ MongoDB Atlas connected
- ✅ Production-ready with proper logging

**Next Steps:**
- Update frontend to use new Azure URL
- Monitor logs and performance
- Set up custom domain (optional)
- Enable Application Insights for monitoring
- Configure automated backups

If you encounter any issues, check the Troubleshooting section or review logs in Log Stream.

