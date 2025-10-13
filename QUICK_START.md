# Azure Deployment - Quick Start Guide

**Fast track guide to deploy your Multi-Tenant Backend to Azure App Service.**

## 🚀 3-Step Deployment Process

### Step 1: Create Deployment Package (5 minutes)

**Option A: Using PowerShell Script (Recommended)**
```powershell
.\create-deployment-package.ps1
```

**Option B: Manual ZIP Creation**
1. Delete `node_modules` folder (if exists)
2. Select all files EXCEPT `node_modules` and `logs`
3. Right-click → Send to → Compressed (zipped) folder
4. Name it `azure-deployment.zip`

✅ You should have a ZIP file around 5-50 MB

---

### Step 2: Create Azure App Service (10 minutes)

1. **Go to Azure Portal**: https://portal.azure.com
2. **Create Web App**:
   - Click "+ Create a resource"
   - Search "Web App" → Click "Create"
3. **Fill in details**:
   - Name: `multitenant-backend` (or your choice)
   - Runtime: **Node 18 LTS**
   - OS: **Windows**
   - Pricing: **Basic B1** or higher
4. Click **"Review + create"** → **"Create"**
5. Wait for deployment (2 minutes)
6. Click **"Go to resource"**

---

### Step 3: Configure & Deploy (15 minutes)

#### A. Enable Required Features

1. Go to **Configuration → General settings**
2. Enable **Web sockets**: ON
3. Enable **Always On**: ON
4. Click **Save**

#### B. Add Environment Variables

1. Go to **Configuration → Application settings**
2. Click **"+ New application setting"** for each:

**Critical Variables:**
```
NODE_ENV = production
DATABASE_URI = your-mongodb-atlas-connection-string
JWT_SECRET = your-jwt-secret
FRONTEND_URL = https://wrocusats.vercel.app
WEBSITE_NODE_DEFAULT_VERSION = 18-lts
```

**Add all other variables from your .env file**

3. Click **Save**

#### C. Deploy Application

1. Go to **Development Tools → Advanced Tools**
2. Click **"Go"** (opens Kudu)
3. Click **Tools → Zip Push Deploy**
4. Drag & drop your `azure-deployment.zip` file
5. Wait for extraction (2-5 minutes)

#### D. Restart & Verify

1. Go back to App Service **Overview**
2. Click **Restart**
3. Go to **Monitoring → Log stream**
4. Wait for "Server running on port..." message

---

## ✅ Test Your Deployment

**Open in browser:**
```
https://your-app-name.azurewebsites.net
```

**Should see:**
> Hello, Node.js Server is Working with Socket.io!

**Test API:**
```
https://your-app-name.azurewebsites.net/api/v1/...
```

---

## 🔧 Common Issues & Quick Fixes

### Issue: App won't start / 503 error
**Fix:**
- Check Log stream for errors
- Verify `NODE_ENV=production` is set
- Verify `WEBSITE_NODE_DEFAULT_VERSION=18-lts`

### Issue: Database connection fails
**Fix:**
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0`)
- Verify `DATABASE_URI` is correct in settings

### Issue: Socket.io not working
**Fix:**
- Enable Web sockets in Configuration
- Enable Always On in Configuration

---

## 📋 Environment Variables Template

Copy and fill in your values:

```bash
# Core Settings
NODE_ENV=production
DATABASE_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-jwt-secret-key
FRONTEND_URL=https://wrocusats.vercel.app
WEBSITE_NODE_DEFAULT_VERSION=18-lts

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-app.azurewebsites.net/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@yourdomain.com
```

---

## 📚 Need More Details?

- **Complete Guide**: See `AZURE_DEPLOYMENT_GUIDE.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Azure Docs**: https://docs.microsoft.com/en-us/azure/app-service/

---

## 🎉 That's It!

Your backend is now live on Azure App Service!

**Don't forget to:**
1. Update your frontend to use the new Azure URL
2. Test all features thoroughly
3. Monitor logs for the first few hours
4. Set up Application Insights for monitoring

---

**Questions or issues?** Check the detailed guide or Azure documentation.

