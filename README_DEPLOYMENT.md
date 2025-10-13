# Multi-Tenant Backend - Azure Deployment

This project has been prepared for deployment to Azure App Service.

## 📁 Deployment Files Created

The following files have been added to support Azure App Service deployment:

### Configuration Files
- **`web.config`** - IIS/Azure configuration with WebSocket support for Socket.io
- **`.deployment`** - Azure deployment configuration
- **`.gitignore`** - Excludes unnecessary files from deployment and Git
- **`.env.example`** - Template for environment variables

### Documentation
- **`QUICK_START.md`** - Fast-track deployment guide (30 minutes)
- **`AZURE_DEPLOYMENT_GUIDE.md`** - Comprehensive step-by-step guide
- **`DEPLOYMENT_CHECKLIST.md`** - Interactive checklist for deployment

### Scripts
- **`create-deployment-package.ps1`** - PowerShell script to create deployment ZIP

## 🚀 Quick Deployment

Choose your preferred approach:

### Option 1: Fast Track (30 minutes)
Follow **`QUICK_START.md`** for a streamlined deployment process.

### Option 2: Detailed Walkthrough (60 minutes)
Follow **`AZURE_DEPLOYMENT_GUIDE.md`** for comprehensive instructions with troubleshooting.

### Option 3: Checklist Approach
Use **`DEPLOYMENT_CHECKLIST.md`** to track your progress step-by-step.

## 📦 Creating Deployment Package

Run the PowerShell script:
```powershell
.\create-deployment-package.ps1
```

This creates a ZIP file with all necessary application files, excluding:
- `node_modules/` (installed automatically by Azure)
- `logs/` (generated on Azure)
- `.env` files (configured in Azure Portal)

## 🔧 Key Configuration Changes

### 1. package.json
Updated start script for production:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

### 2. web.config
Configured for:
- Node.js routing through IIS
- WebSocket support (required for Socket.io)
- Security settings
- Static file handling for binary files (eng.traineddata, model.nlp)

## 🌐 Application Architecture

This is a multi-tenant Node.js backend with:
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **Authentication**: JWT, Google OAuth
- **File Processing**: Tesseract OCR, NLP models

## ⚙️ Required Azure Configuration

### Must Enable in Azure Portal:
1. **Web sockets** - For Socket.io real-time features
2. **Always On** - Prevents app from sleeping
3. **Application Settings** - All environment variables

### Minimum Pricing Tier:
- **Basic B1** or higher (Free tier doesn't support WebSockets or Always On)

## 🔐 Environment Variables

See `.env.example` for a complete list of required environment variables.

**Critical variables:**
- `NODE_ENV=production`
- `DATABASE_URI` (MongoDB Atlas)
- `JWT_SECRET`
- `FRONTEND_URL`
- `WEBSITE_NODE_DEFAULT_VERSION=18-lts`

## 📊 Post-Deployment

After deployment, your backend will be available at:
```
https://your-app-name.azurewebsites.net
```

### Update Frontend
Update your frontend application to use the new Azure backend URL.

### Monitor Application
1. Check **Log stream** in Azure Portal
2. Set up **Application Insights** for monitoring
3. Configure **Alerts** for errors or performance issues

## 🐛 Troubleshooting

Common issues and solutions are documented in:
- `AZURE_DEPLOYMENT_GUIDE.md` (Part 7: Troubleshooting)

### Quick Checks:
- ✅ WebSockets enabled?
- ✅ Always On enabled?
- ✅ All environment variables set?
- ✅ MongoDB Atlas IP whitelist configured?
- ✅ Node version set to 18 LTS?

## 📚 Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Node.js on Azure](https://docs.microsoft.com/en-us/azure/app-service/quickstart-nodejs)
- [Socket.io Documentation](https://socket.io/docs/v4/)

## 🎯 Deployment Checklist

Quick reference:
- [ ] Created deployment package
- [ ] Created Azure App Service
- [ ] Enabled WebSockets
- [ ] Enabled Always On
- [ ] Added all environment variables
- [ ] Deployed application
- [ ] Tested endpoints
- [ ] Updated frontend URL
- [ ] Monitoring configured

## 💡 Tips

1. **Test Locally First**: Run `npm start` to test with production settings
2. **Database Connectivity**: Ensure MongoDB Atlas allows connections from Azure
3. **File Uploads**: Verify Cloudinary credentials are correct
4. **Socket.io**: Test real-time features after deployment
5. **Logs**: Monitor logs for the first few hours after deployment

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section in deployment guides
2. Review Azure App Service logs (Log stream)
3. Verify all configuration settings
4. Check MongoDB Atlas connection
5. Test individual endpoints

## 📝 Notes

- The application uses Socket.io for real-time features (interviews, notifications)
- Binary files (`eng.traineddata`, `model.nlp`) are included in deployment for OCR/NLP
- File uploads are handled by Cloudinary (not local filesystem)
- Logs are written to Azure's logging system

---

**Ready to deploy?** Start with `QUICK_START.md` for the fastest path to production! 🚀

