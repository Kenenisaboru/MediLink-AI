# 🚀 MediLink AI — Smart Healthcare Platform for Ethiopia

**MediLink AI** is an enterprise-grade, production-ready AI-powered healthcare ecosystem for Ethiopia. It connects patients, doctors, hospitals, pharmacies, laboratories, ambulance services, blood banks, and insurance providers into one secure, intelligent, multilingual platform.

Designed to reduce patient waiting times, eliminate paper records, streamline hospital bed allocations, provide 24/7 AI-assisted symptom triage in local languages, and coordinate real-time GPS emergency SOS dispatches.

---

## 🌟 Key Features

* **Multilingual AI Symptom Triaging**: Input symptoms in **Amharic (አማርኛ)**, **Afaan Oromo**, or **English** for instant clinical triage recommendations powered by Google Gemini.
* **Real-time Emergency SOS Dispatch**: One-click SOS trigger connected via Socket.io WebSockets, broadcasting patient coordinates to nearby ambulance drivers with live GPS telemetry.
* **AI Medical Summaries**: 1-click clinical digest generation for physicians summarizing patient history, chronic conditions, and prescription risks.
* **Live Hospital Bed & Queue Telemetry**: Search leading Ethiopian hospitals (e.g., Black Lion, St. Paul, Hawassa Referral) with live total bed, ICU occupancy, and queue duration predictions.
* **Smart Blood Bank Registry**: Real-time blood group availability tracking (A+, O+, B-, etc.) and donor coordination.
* **Ethiopian Payment Gateways**: Simulated checkout integration for **Telebirr**, **Chapa**, **CBE Birr**, and **SantimPay**.
* **Role-Based Portals**: Tailored interfaces for Patients, Doctors, Hospital Admins, Super Admin, Pharmacy, Laboratory, and Ambulance Drivers.

---

## 🏗️ Architecture & Technology Stack

```
MediLink AI/
├── backend/            # Express.js + TypeScript + Socket.io + JWT + Gemini SDK
├── frontend/           # Next.js 15 App Router + Tailwind CSS + Framer Motion + React Query
├── database/           # PostgreSQL + Prisma ORM + Redis (Docker stack & seed data)
├── shared/             # Shared TypeScript types & Socket event interfaces
├── documentation/      # API Documentation & Production Deployment Guide
├── docker/             # Top-level Docker Compose stack
└── scripts/            # PowerShell & Bash automated setup scripts
```

### Stack Breakdown

* **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, React Query, Axios.
* **Backend**: Node.js, Express.js, TypeScript, Socket.io, JWT Authentication, Refresh Tokens, RBAC, Rate-Limiting, Helmet.
* **Database**: PostgreSQL 15, Prisma ORM, Redis 7.
* **AI Engine**: Google Gemini API (`@google/generative-ai`) with fail-safe fallback simulations.
* **Payments**: Chapa & Telebirr simulator controllers.

---

## 👥 User Roles & Access

| Role | Capabilities |
|------|--------------|
| **Super Admin** | National health statistics, regional outbreak monitors, hospital verification, system metrics |
| **Hospital Admin** | Hospital bed management, doctor/nurse rosters, department schedules, ICU allocation |
| **Doctor** | Consultations, electronic medical records, e-prescriptions, lab requests, AI summary generator |
| **Patient** | Appointment booking, AI symptom checking, digital records, Telebirr/Chapa payments, SOS alerts |
| **Pharmacy** | Stock inventory, low stock warnings, expired batch recalls, e-prescription verifications |
| **Laboratory** | Test request queues, result uploads, PDF report exports, AI test explanations |
| **Ambulance Driver** | Real-time emergency beacon claims, live GPS updates, patient dispatch navigation |

---

## ⚡ Quickstart

### Automated Setup (Recommended)

Run the automated setup script to start database containers, run Prisma migrations, seed sample Ethiopian hospitals, and install dependencies:

**Windows (PowerShell):**
```powershell
.\scripts\setup.ps1
```

**Linux / macOS (Bash):**
```bash
chmod +x ./scripts/setup.sh
./scripts/setup.sh
```

### Manual Run

**Backend Server:**
```bash
cd backend
npm run dev
# Server running at http://localhost:5000
```

**Frontend App:**
```bash
cd frontend
npm run dev
# Platform running at http://localhost:3000
```

---

## 📄 Documentation Links

* [API Endpoint Reference](documentation/API_DOCUMENTATION.md)
* [Deployment & Docker Guide](documentation/DEPLOYMENT_GUIDE.md)

---

## 🔒 Security

* JWT Access Tokens (1h expiry) & Refresh Tokens (7d expiry stored in DB).
* Role-Based Access Control (RBAC) middleware.
* Request Rate-Limiting via Express Rate Limit.
* HTTP Headers hardening with Helmet.
* CORS protection & parameter sanitation.

---

## 📜 License

Enterprise Startup Platform for Ethiopia Digital Health Transformation Strategy.
