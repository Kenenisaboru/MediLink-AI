# MediLink AI Environment Setup Script for Windows PowerShell
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " 🚀 MediLink AI Setup & Initialization" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Start Docker Database Containers
Write-Host "`n[1/4] Starting PostgreSQL & Redis via Docker..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\..\database"
docker compose up -d

# 2. Setup Backend
Write-Host "`n[2/4] Installing Backend Dependencies & Running Migrations..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\..\backend"
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "Created .env from .env.example" -ForegroundColor Green
}
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 3. Setup Frontend
Write-Host "`n[3/4] Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\..\frontend"
npm install --legacy-peer-deps

# 4. Finished
Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " ✅ MediLink AI Installation Completed!" -ForegroundColor Green
Write-Host " Run Backend:  cd backend; npm run dev" -ForegroundColor White
Write-Host " Run Frontend: cd frontend; npm run dev" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Green
