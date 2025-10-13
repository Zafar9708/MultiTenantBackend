# Azure Deployment Package Creator
# This script creates a clean deployment package for Azure App Service

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Azure Deployment Package Creator" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Define output filename
$zipFileName = "azure-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
$tempFolder = "deployment-temp"

Write-Host "Step 1: Cleaning up old deployment files..." -ForegroundColor Yellow
if (Test-Path $tempFolder) {
    Remove-Item -Recurse -Force $tempFolder
}
if (Test-Path "azure-deployment-*.zip") {
    Remove-Item -Force "azure-deployment-*.zip"
}

Write-Host "Step 2: Creating temporary deployment folder..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $tempFolder | Out-Null

Write-Host "Step 3: Copying application files..." -ForegroundColor Yellow

# Files and folders to include
$includePaths = @(
    "app.js",
    "server.js",
    "package.json",
    "package-lock.json",
    "web.config",
    ".deployment",
    "config",
    "controllers",
    "data",
    "middleware",
    "models",
    "routes",
    "scripts",
    "services",
    "utils",
    "eng.traineddata",
    "model.nlp"
)

foreach ($path in $includePaths) {
    if (Test-Path $path) {
        if (Test-Path $path -PathType Container) {
            Write-Host "  Copying folder: $path" -ForegroundColor Gray
            Copy-Item -Path $path -Destination $tempFolder -Recurse -Force
        } else {
            Write-Host "  Copying file: $path" -ForegroundColor Gray
            Copy-Item -Path $path -Destination $tempFolder -Force
        }
    } else {
        Write-Host "  Warning: $path not found, skipping..." -ForegroundColor DarkYellow
    }
}

Write-Host "Step 4: Creating ZIP archive..." -ForegroundColor Yellow
Compress-Archive -Path "$tempFolder\*" -DestinationPath $zipFileName -Force

Write-Host "Step 5: Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $tempFolder

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Deployment package created successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Package name: $zipFileName" -ForegroundColor Cyan
$fileSize = (Get-Item $zipFileName).Length / 1MB
Write-Host "Package size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Azure Portal (https://portal.azure.com)" -ForegroundColor White
Write-Host "2. Navigate to your App Service" -ForegroundColor White
Write-Host "3. Go to 'Advanced Tools' -> 'Go' (Kudu)" -ForegroundColor White
Write-Host "4. Click 'Tools' -> 'Zip Push Deploy'" -ForegroundColor White
Write-Host "5. Drag and drop $zipFileName to /site/wwwroot" -ForegroundColor White
Write-Host ""
Write-Host "Or follow the complete guide in AZURE_DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
Write-Host ""

