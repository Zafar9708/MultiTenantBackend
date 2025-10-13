# Azure Deployment Checklist

Use this checklist to ensure a smooth deployment to Azure App Service.

## Pre-Deployment Checklist

### 1. Code Preparation
- [x] Updated `package.json` start script to `node server.js`
- [x] Created `web.config` for Azure/IIS configuration
- [x] Created `.deployment` file
- [x] Created `.gitignore` file
- [ ] Tested application locally with `npm start`
- [ ] Verified all dependencies are in `package.json`

### 2. Environment Variables Ready
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URI` (MongoDB Atlas connection string)
- [ ] `JWT_SECRET`
- [ ] `FRONTEND_URL`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_REDIRECT_URI`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `EMAIL_HOST`
- [ ] `EMAIL_PORT`
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASS`
- [ ] `EMAIL_FROM`
- [ ] All other custom environment variables

### 3. External Services Configuration
- [ ] MongoDB Atlas: IP whitelist includes Azure (0.0.0.0/0 or Azure datacenter IPs)
- [ ] MongoDB Atlas: Database user created with correct permissions
- [ ] Cloudinary: Account active and credentials valid
- [ ] Email Service: SMTP credentials valid
- [ ] Google OAuth: Redirect URI updated for Azure URL

## Deployment Package Creation

### 4. Create Deployment Package
- [ ] Run `.\create-deployment-package.ps1` (PowerShell script)
- [ ] OR manually create ZIP with all files except `node_modules` and `logs`
- [ ] Verify ZIP contains:
  - [ ] `app.js`
  - [ ] `server.js`
  - [ ] `package.json`
  - [ ] `web.config`
  - [ ] `.deployment`
  - [ ] All folders: `config/`, `controllers/`, `models/`, `routes/`, etc.
  - [ ] Binary files: `eng.traineddata`, `model.nlp`
- [ ] ZIP file size is reasonable (< 100 MB without node_modules)

## Azure App Service Setup

### 5. Create App Service
- [ ] Logged into Azure Portal (https://portal.azure.com)
- [ ] Created new Web App
- [ ] Selected Node 18 LTS runtime
- [ ] Chose Windows OS (for web.config support)
- [ ] Selected B1 or higher pricing tier (not Free/F1)
- [ ] App Service created successfully
- [ ] Noted app URL: `https://______________.azurewebsites.net`

### 6. Configure App Service Settings
- [ ] Enabled **Web sockets** in Configuration → General settings
- [ ] Enabled **Always On** in Configuration → General settings
- [ ] Set **Application settings** (all environment variables)
- [ ] Verified `WEBSITE_NODE_DEFAULT_VERSION=18-lts`
- [ ] Saved configuration changes

### 7. Configure CORS (if needed)
- [ ] Added frontend URL(s) to CORS settings
- [ ] Saved CORS configuration

## Deployment

### 8. Deploy Application
Choose one method:

**Method A: Kudu ZIP Deploy (Recommended)**
- [ ] Opened Advanced Tools (Kudu)
- [ ] Navigated to Tools → Zip Push Deploy
- [ ] Uploaded ZIP file to `/site/wwwroot`
- [ ] Deployment completed successfully

**Method B: Azure CLI**
- [ ] Installed Azure CLI
- [ ] Logged in: `az login`
- [ ] Ran deployment command with ZIP file
- [ ] Deployment completed successfully

**Method C: FTP**
- [ ] Got FTP credentials from Deployment Center
- [ ] Connected via FTP client
- [ ] Uploaded all files to `/site/wwwroot`
- [ ] Upload completed successfully

### 9. Post-Deployment
- [ ] Restarted App Service
- [ ] Waited 2-3 minutes for startup
- [ ] Dependencies installed automatically (or ran `npm install` manually)

## Verification

### 10. Check Logs
- [ ] Opened Log stream (Monitoring → Log stream)
- [ ] Saw "Database connected" message
- [ ] Saw "Server running on port..." message
- [ ] No critical errors in logs

### 11. Test Application
- [ ] Tested root endpoint: `https://your-app.azurewebsites.net/`
  - [ ] Returns "Hello, Node.js Server is Working with Socket.io!"
- [ ] Tested API endpoint: `https://your-app.azurewebsites.net/api/v1/...`
  - [ ] API responds correctly
- [ ] Tested Socket.io: `https://your-app.azurewebsites.net/api/test-socket`
  - [ ] Socket.io working
- [ ] Tested database operations (create/read/update/delete)
  - [ ] Database operations working

### 12. Frontend Integration
- [ ] Updated frontend API URL to Azure URL
- [ ] Tested frontend connection to backend
- [ ] Tested authentication flow
- [ ] Tested real-time features (Socket.io)
- [ ] Tested file uploads

## Post-Deployment Configuration

### 13. Optional Enhancements
- [ ] Configured custom domain
- [ ] Set up SSL certificate
- [ ] Enabled Application Insights
- [ ] Configured backup schedule
- [ ] Set up CI/CD with GitHub Actions
- [ ] Configured auto-scaling rules
- [ ] Set up monitoring alerts

## Troubleshooting

If something doesn't work, check:
- [ ] Log stream for error messages
- [ ] All environment variables are set correctly
- [ ] WebSockets is enabled
- [ ] Always On is enabled
- [ ] MongoDB Atlas IP whitelist
- [ ] Node version matches (18 LTS)
- [ ] Package.json start script is correct

## Final Verification

- [ ] Application is running smoothly
- [ ] No errors in logs for 5+ minutes
- [ ] All API endpoints working
- [ ] Socket.io connections stable
- [ ] Database operations successful
- [ ] Frontend connected and working
- [ ] Performance is acceptable
- [ ] Monitored metrics look healthy

## Notes

**App Service URL:** `https://______________________________.azurewebsites.net`

**Resource Group:** `_______________________________`

**Deployment Date:** `_______________________________`

**Issues Encountered:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Solutions Applied:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## Quick Reference Commands

**Create deployment package:**
```powershell
.\create-deployment-package.ps1
```

**Azure CLI deployment:**
```bash
az webapp deployment source config-zip `
  --resource-group YOUR_RESOURCE_GROUP `
  --name YOUR_APP_NAME `
  --src azure-deployment-YYYYMMDD-HHMMSS.zip
```

**Restart app:**
```bash
az webapp restart --resource-group YOUR_RESOURCE_GROUP --name YOUR_APP_NAME
```

**View logs:**
```bash
az webapp log tail --resource-group YOUR_RESOURCE_GROUP --name YOUR_APP_NAME
```

---

✅ **Deployment Complete!** Your Multi-Tenant Backend is live on Azure! 🎉

