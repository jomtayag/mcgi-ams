# Church Monitoring Monorepo Bootstrap Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "⛪ CHURCH MONITORING SYSTEM - MONOREPO BOOTSTRAP ⛪" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Yarn Workspaces dependencies install
Write-Host "`n📦 Step 1: Installing all Node.js Packages via Yarn Workspaces..." -ForegroundColor Yellow
yarn install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install workspace dependencies." -ForegroundColor Red
    Exit 1
}

# 2. Python AI Service dependencies
Write-Host "`n🧠 Step 2: Initializing Python AI Service Virtual Environment..." -ForegroundColor Yellow
cd ai-service

if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment (venv)..." -ForegroundColor Gray
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create virtual environment. Please check if Python 3 is installed." -ForegroundColor Red
        cd ..
        Exit 1
    }
} else {
    Write-Host "Virtual environment already exists." -ForegroundColor Gray
}

Write-Host "Activating venv and installing Python libraries (this can take a few minutes for biometrics libraries)..." -ForegroundColor Gray
.\venv\Scripts\pip install --upgrade pip
.\venv\Scripts\pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Python dependencies." -ForegroundColor Red
    cd ..
    Exit 1
}

cd ..

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "✨ MONOREPO BOOTSTRAP COMPLETED SUCCESSFULLY! ✨" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "To start the development servers in parallel, run:" -ForegroundColor Gray
Write-Host "👉 yarn dev:all" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
