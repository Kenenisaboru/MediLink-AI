# MediLink AI — Enterprise Technical Specification & Architecture

## Executive Overview

MediLink AI is a unified, enterprise-grade digital health ecosystem designed to modernize healthcare infrastructure in Ethiopia. It integrates artificial intelligence, real-time telemetry, emergency dispatching, electronic medical records, pharmacy inventory, lab automation, and localized mobile payment gateways into a high-availability digital health platform.

The system is built to replace paper-driven workflows, streamline patient triage across multi-language demographics (Amharic, Afaan Oromo, English), enable real-time resource visibility across national hospital networks, and accelerate emergency response times.

---

## 🏛️ System Architecture

MediLink AI utilizes a decoupled microservices-ready architecture:

```
                  ┌───────────────────────────────────────────────┐
                  │          Next.js 15 App Router Frontend       │
                  │   (TypeScript, Tailwind CSS, Framer Motion)   │
                  └───────────────────────┬───────────────────────┘
                                          │  REST / WebSockets
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │             Node.js / Express Backend          │
                  │       (TypeScript, JWT Auth, Socket.io)        │
                  └───────┬───────────────┬───────────────┬───────┘
                          │               │               │
                          ▼               ▼               ▼
                 ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                 │ PostgreSQL   │  │ Redis Cache  │  │ Google Gemini│
                 │ (Prisma ORM) │  │ (Socket.io)  │  │ AI Engine    │
                 └──────────────┘  └──────────────┘  └──────────────┘
```

### Component Stack
* **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, Socket.io-client, Progressive Web App (PWA) manifest.
* **Backend**: Node.js, Express, TypeScript, Prisma ORM, Socket.io (WebSocket engine), Google Generative AI (Gemini 1.5/Flash SDK), Helmet security, CORS, Express Rate Limit.
* **Database & Caching**: PostgreSQL 16 (Relational persistence), Redis 7 (Pub/Sub & session/socket cache).
* **Testing & Quality Assurance**: Jest, Supertest, Mocked Prisma test suite with 100% endpoint assertion coverage.

---

## 🔐 Authentication & Authorization Model

MediLink AI implements an enterprise security layer using dual JWT tokens (Short-lived Access Tokens + Persistent Refresh Tokens) with explicit Role-Based Access Control (RBAC).

### User Roles
| Role Enum | Description | Access Rights |
|-----------|-------------|---------------|
| `SUPER_ADMIN` | National Health Ministry / Platform Admins | Full system metrics, hospital verification, system logs |
| `HOSPITAL_ADMIN` | Hospital Management Staff | ICU/bed telemetry, staff scheduling, local analytics |
| `DOCTOR` | Licensed Medical Practitioners | Medical record creation, patient histories, AI summaries |
| `NURSE` | Inpatient Care Staff | Patient vitals monitoring, bed allocation updates |
| `LAB_STAFF` | Laboratory Technicians | Test request execution, result uploads, AI explanations |
| `PHARMACY` | Certified Pharmacists | Stock management, drug expiry monitoring, inventory upserts |
| `AMBULANCE_DRIVER` | Emergency Responders | Live SOS dispatch handling, GPS telemetry broadcasts |
| `PATIENT` | End-user Citizens | Symptom checking, appointment booking, SOS trigger, billing |

---

## 📡 Core Subsystems & Telemetry

### 1. Multilingual AI Clinical Triage
* **AI Provider**: Google Gemini API via `@google/generative-ai`.
* **Supported Languages**: English, Amharic (`አማርኛ`), Afaan Oromo.
* **Outputs**: Estimated condition analysis, severity score (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`), recommended department (e.g., Cardiology, Pediatrics, Triage), actionable self-care advice, and strict clinical disclaimer.

### 2. Geolocation Emergency SOS Broadcast System
* **Engine**: Socket.io real-time WebSocket connection.
* **Flow**:
  1. Patient clicks "Emergency SOS" button -> sends GPS coordinates, blood group, and emergency contact to server.
  2. Server broadcasts emergency signal to all nearby online `AMBULANCE_DRIVER` sockets.
  3. Driver accepts dispatch -> WebSocket establishes live telemetry channel sending driver location & ETA to patient dashboard.

### 3. Smart Resource Telemetry (Beds & Blood Bank)
* **Real-time Bed Counters**: Tracks total beds, occupied beds, ICU capacity, and occupied ICU beds per hospital.
* **Blood Bank Inventory**: Real-time bag counters per blood type (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) accessible by ER logistics.

### 4. Integrated Localized Payments
* Simulated checkout integrations supporting Ethiopia's major payment systems:
  * **Telebirr**
  * **Chapa**
  * **CBE Birr**
  * **SantimPay**

---

## 📊 Database Schema (Prisma Data Models)

```prisma
enum Role {
  SUPER_ADMIN
  HOSPITAL_ADMIN
  DOCTOR
  NURSE
  LAB_STAFF
  PHARMACY
  AMBULANCE_DRIVER
  PATIENT
}

enum AppointmentStatus {
  PENDING
  ACCEPTED
  REJECTED
  COMPLETED
  CANCELLED
}

enum SOSStatus {
  PENDING
  ACTIVE
  RESOLVED
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
}

enum PaymentGateway {
  TELEBIRR
  CHAPA
  SANTIMPAY
  CBEBIRR
}
```

Key models include:
- `User`, `RefreshToken`, `PatientProfile`, `DoctorProfile`, `HospitalAdminProfile`, `NurseProfile`, `LabProfile`, `PharmacyProfile`, `AmbulanceDriverProfile`
- `Hospital`, `MedicalRecord`, `Appointment`, `EmergencySOS`, `InventoryItem`, `BloodStock`, `Transaction`, `Notification`

---

## 🌐 Complete API Endpoint Reference

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Creates user account & sends OTP code.
* `POST /api/auth/verify-otp` — Verifies OTP code and activates account.
* `POST /api/auth/login` — Authenticates credentials & returns access + refresh tokens.
* `POST /api/auth/refresh` — Generates a new access token using a refresh token.
* `POST /api/auth/logout` — Revokes refresh token.

### Patient Portal (`/api/patient`)
* `GET /api/patient/profile` — Retrieves patient profile & health data.
* `POST /api/patient/symptom-check` — Triggers Gemini AI clinical triage.
* `GET /api/patient/appointments` — Lists patient appointments.
* `POST /api/patient/appointments` — Schedules an appointment with a doctor.
* `GET /api/patient/medical-history` — Fetches past medical records & diagnoses.
* `GET /api/patient/transactions` — Lists medical payment transactions.
* `GET /api/patient/sos-alerts` — Gets active emergency dispatches.

### Doctor Portal (`/api/doctor`)
* `GET /api/doctor/appointments` — Lists doctor's scheduled appointments.
* `PUT /api/doctor/appointments/status` — Updates appointment status.
* `POST /api/doctor/medical-records` — Creates diagnosis record & prescriptions.
* `GET /api/doctor/ai-summary/:patientId` — Generates Gemini AI summary of patient history.

### Hospital & Resource Management (`/api/hospitals`, `/api/admin`)
* `GET /api/hospitals` — Searches hospital directory with filter parameters.
* `GET /api/doctors` — Searches active doctors by specialty and language.
* `GET /api/admin/metrics` — Returns system-wide telemetry & active stats.
* `GET /api/hospitals/:hospitalId/analytics` — Detailed hospital occupancy analytics.

### Pharmacy & Blood Bank (`/api/pharmacy`, `/api/blood-stock`)
* `GET /api/pharmacy/inventory` — Retrieves pharmacy inventory items.
* `POST /api/pharmacy/inventory` — Creates/updates medicine stock & batch details.
* `GET /api/pharmacy/expiry-warnings` — Returns medicines approaching expiration.
* `GET /api/blood-stock/:hospitalId` — Returns hospital blood bank counts.
* `POST /api/blood-stock/update` — Updates blood bag inventory counts.

### Laboratory (`/api/lab`)
* `GET /api/lab/requests` — Lists pending laboratory test requests.
* `POST /api/lab/results` — Uploads laboratory test results.
* `GET /api/lab/explain` — Generates AI explanation of lab findings for patients.

---

## 🧪 Verification & Testing Strategy

The workspace features an automated integration test suite located in `/tests`:
* Built using **Jest** and **Supertest**.
* Mocks Prisma database layers to ensure instant execution without requiring live PostgreSQL instances.
* Runs against authentication, patient, doctor, and inventory endpoints.
* Command to execute: `npm test` inside `/tests`.

---

## 🛠 Deployment & Developer Workflow

1. **Local Development**:
   - Run `.\scripts\setup.ps1` to configure environment files and dependencies.
   - Run `docker-compose up -d` inside `/database` for local database/redis.
   - Run `npm run dev` inside `/backend` and `/frontend`.

2. **Docker Orchestration**:
   - Run `docker-compose up --build -d` at project root for multi-container orchestration.
