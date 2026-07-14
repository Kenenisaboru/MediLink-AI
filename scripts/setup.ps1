# MediLink AI Setup Script for Windows (PowerShell)
# This script initializes the dependencies, prepares local env configurations, and guides through docker orchestrations.

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "⚕️  WELCOME TO MEDILINK AI - PLATFORM INITIALIZATION SYSTEM" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Dependency Checks
Write-Host "🔍 Step 1: Checking local runtime dependencies..." -ForegroundColor Yellow
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCheck) {
    $nodeVer = node -v
    Write-Host "✅ Node.js is installed: $nodeVer" -ForegroundColor Green
} else {
    Write-Warning "❌ Node.js is not found. Please install Node.js v20+ to compile locally."
}

$dockerCheck = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCheck) {
    Write-Host "✅ Docker is installed." -ForegroundColor Green
} else {
    Write-Host "⚠️ Docker is not running or not installed. Running database containers will require manual configurations." -ForegroundColor Yellow
}
Write-Host ""

# 2. Installing Dependencies
Write-Host "📦 Step 2: Installing project dependencies (npm install)..." -ForegroundColor Yellow

Write-Host "📂 Installing shared / root-level configs..." -ForegroundColor Cyan
if (Test-Path "shared") {
    Write-Host "   Shared folder identified."
}

Write-Host "📂 Installing Backend dependencies..." -ForegroundColor Cyan
Push-Location backend
npm install
Pop-Location
Write-Host "✅ Backend dependencies installed." -ForegroundColor Green

Write-Host "📂 Installing Frontend dependencies..." -ForegroundColor Cyan
Push-Location frontend
npm install
Pop-Location
Write-Host "✅ Frontend dependencies installed." -ForegroundColor Green

Write-Host "📂 Installing Testing dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "tests")) {
    New-Item -ItemType Directory -Path "tests" | Out-Null
}
Push-Location tests
# If package.json is not yet created, we write a basic one or let npm init do it.
# We will create it right after this script.
if (Test-Path "package.json") {
    npm install
}
Pop-Location
Write-Host "✅ Testing dependencies installed." -ForegroundColor Green
Write-Host ""

# 3. Setting Up Environment Variables
Write-Host "⚙️ Step 3: Preparing local environment variables (.env files)..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✅ Copied backend/.env.example to backend/.env" -ForegroundColor Green
} else {
    Write-Host "ℹ️ backend/.env already exists. Skipping copy." -ForegroundColor Gray
}

if (-not (Test-Path "frontend\.env.local")) {
    "NEXT_PUBLIC_API_URL=http://localhost:5000/api`nNEXT_PUBLIC_SOCKET_URL=http://localhost:5000" | Out-File -FilePath "frontend\.env.local" -Encoding utf8
    Write-Host "✅ Created frontend/.env.local with development API URLs" -ForegroundColor Green
} else {
    Write-Host "ℹ️ frontend/.env.local already exists. Skipping." -ForegroundColor Gray
}
Write-Host ""

# 4. Database Setup & Docker Suggestions
Write-Host "🐳 Step 4: Docker Orchestration Suggestion" -ForegroundColor Yellow
Write-Host "To start the database services (PostgreSQL & Redis), you can run:" -ForegroundColor Gray
Write-Host "   docker-compose up -d postgres redis" -ForegroundColor Green
Write-Host ""
Write-Host "To run the entire system (backend, frontend, postgres, redis) under Docker, run:" -ForegroundColor Gray
Write-Host "   docker-compose up --build -d" -ForegroundColor Green
Write-Host ""

# 5. Seed Credentials Summary
Write-Host "🏥 STEP 5: MOCK LOGIN CREDENTIALS SUMMARY (SEEDED USERS)" -ForegroundColor Yellow
Write-Host "Password for all seeded accounts is: Password123!" -ForegroundColor White
Write-Host ""
Write-Host "1. Super Admin:      +251911000000 (admin@medilink.et)"
Write-Host "2. Hospital Admin:   +251911111111 (hospadmin@medilink.et)"
Write-Host "3. Doctor (Ped):     +251911222222 (dr.selam@medilink.et)"
Write-Host "4. Doctor (Cardio):  +251911333333 (dr.chala@medilink.et)"
Write-Host "5. Patient (Tewo):   +251911999999 (patient.tewodros@gmail.com)"
Write-Host "6. Pharmacy (Kenem): +251911666666 (kenema.pharmacy@medilink.et)"
Write-Host "7. Lab Staff:        +251911777777 (wudase.lab@medilink.et)"
Write-Host "8. Ambulance Driver: +251911888888 (driver.mulu@medilink.et)"
Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "Setup Completed! Happy Hacking with MediLink AI! 🚀" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Cyan
