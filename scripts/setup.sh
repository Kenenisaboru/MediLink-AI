#!/bin/bash
echo "========================================="
echo " 🚀 MediLink AI Setup & Initialization"
echo "========================================="

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 1. Start Docker Containers
echo -e "\n[1/4] Starting PostgreSQL & Redis via Docker..."
cd "$DIR/../database"
docker compose up -d

# 2. Setup Backend
echo -e "\n[2/4] Installing Backend Dependencies & Running Migrations..."
cd "$DIR/../backend"
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 3. Setup Frontend
echo -e "\n[3/4] Installing Frontend Dependencies..."
cd "$DIR/../frontend"
npm install --legacy-peer-deps

echo -e "\n========================================="
echo " ✅ MediLink AI Installation Completed!"
echo " Run Backend:  cd backend && npm run dev"
echo " Run Frontend: cd frontend && npm run dev"
echo "========================================="
