# MediLink AI — Deployment Guide

This guide provides step-by-step instructions for deploying and running **MediLink AI** in local development, containerized Docker environments, and production cloud infrastructure (Vercel + Render / AWS).

---

## Prerequisites

- **Node.js**: v20.x LTS or higher
- **Package Manager**: `npm` v10.x or `yarn` / `pnpm`
- **Database**: PostgreSQL 15+ & Redis 7+ (or Docker)
- **AI Access**: Google Gemini API key (`GEMINI_API_KEY`)

---

## 1. Local Development Setup

### Step 1: Clone & Directory Structure
Navigate to the root project directory:
```bash
cd "c:/Users/KENENISA/Documents/MediLink AI"
```

### Step 2: Database Container Setup (PostgreSQL + Redis)
Start the PostgreSQL and Redis containers using Docker Compose:
```bash
cd database
docker compose up -d
```
* PostgreSQL listens on `localhost:5432` (`medilink_db`).
* Redis listens on `localhost:6379`.

### Step 3: Backend Setup & Database Migration
1. Navigate to the `backend` folder:
   ```bash
   cd ../backend
   ```
2. Copy environment variable template:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your preferred settings and valid `GEMINI_API_KEY`.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Generate Prisma Client and run Database Migrations / Seed:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```
6. Start the Backend Development Server:
   ```bash
   npm run dev
   ```
   * Express API will run at `http://localhost:5000/api`
   * Socket.io Gateway listens on `ws://localhost:5000`

### Step 4: Frontend Setup
1. In a new terminal, navigate to `frontend`:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Next.js App Router server:
   ```bash
   npm run dev
   ```
4. Access the web platform at `http://localhost:3000`.

---

## 2. Docker Containerized Setup

A top-level Docker setup is provided to build and run both Frontend, Backend, PostgreSQL, and Redis in isolated containers.

```bash
# Build and launch all services
docker-compose -f docker/docker-compose.yml up --build -d
```

### Services Map:
* **Frontend**: `http://localhost:3000`
* **Backend API**: `http://localhost:5000`
* **PostgreSQL**: `localhost:5432`
* **Redis**: `localhost:6379`

---

## 3. Production Deployment Strategy

### Frontend Deployment (Vercel)
1. Push codebase to GitHub repository.
2. Import `frontend/` directory into Vercel.
3. Configure Environment Variables in Vercel Dashboard:
   - `NEXT_PUBLIC_API_URL`: `https://api.medilink.et/api`
   - `NEXT_PUBLIC_SOCKET_URL`: `wss://api.medilink.et`
4. Deploy with build command `npm run build`.

### Backend & Database Deployment (Render / AWS EC2 / DigitalOcean)
1. Provision a PostgreSQL Database (e.g. Supabase, Render Postgres, or AWS RDS).
2. Provision a Redis Instance (e.g. Upstash or Redis Cloud).
3. Deploy `backend` container/Node.js app to Render or Docker host.
4. Set Environment Variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `DATABASE_URL=postgresql://user:pass@host:5432/medilink_db?sslmode=require`
   - `JWT_SECRET=super_secure_random_string`
   - `JWT_REFRESH_SECRET=super_secure_random_refresh_string`
   - `GEMINI_API_KEY=your_production_gemini_key`
5. Configure Nginx Reverse Proxy with HTTPS SSL (Let's Encrypt / Certbot).

---

## 4. Verification & Testing

- **Health Check**: `GET http://localhost:5000/health` -> `{ "status": "healthy" }`
- **Landing Page & Multilingual Switcher**: Open `http://localhost:3000`, test English / Amharic / Afaan Oromo buttons.
- **AI Symptom Checker**: Click "AI Symptom Checker" modal, submit sample symptoms.
- **Dashboards**:
  - Patient Dashboard: `http://localhost:3000/dashboard/patient`
  - Doctor Dashboard: `http://localhost:3000/dashboard/doctor`
  - Pharmacy Dashboard: `http://localhost:3000/dashboard/pharmacy`
  - Laboratory Dashboard: `http://localhost:3000/dashboard/laboratory`
  - Admin Analytics: `http://localhost:3000/dashboard/admin`
