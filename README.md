# ⚕️ MediLink AI — Smart Healthcare Platform for Ethiopia

MediLink AI is a modern, enterprise-ready, AI-powered healthcare ecosystem designed for Ethiopia. It connects patients, doctors, hospital systems, pharmacies, laboratories, ambulance services, blood banks, and insurance providers into a secure, intelligent, multilingual digital health platform.

The system is built in accordance with Ethiopia's **Digital Health Transformation Strategy**, replacing paper-based records, reducing hospital wait times, optimizing resource telemetry (ICU beds, blood banks), and offering 24/7 AI clinical triage.

---

## 🏛️ Enterprise Folder Architecture

The codebase follows a structured, enterprise-level modular layout:

* **`/frontend`**: Next.js 15 App Router, TypeScript, Tailwind CSS, Framer Motion, and PWA configuration.
* **`/backend`**: Node.js, Express, TypeScript, JWT auth with refresh tokens, Socket.io, and Gemini AI endpoints.
* **`/database`**: Prisma schemas, seeds, migrations, and local PostgreSQL/Redis compose file.
* **`/shared`**: Shared TypeScript types and constants between frontend and backend.
* **`/tests`**: Jest and Supertest integration & unit testing configurations.
* **`/docker`**: Multi-stage Docker configurations for services.
* **`/scripts`**: Powershell bootstrap environment scripts.
* **`/documentation`**: Markdown documentation detailing REST APIs and production deployments.

---

## 🚀 Key Platform Capabilities

### 1. Multilingual AI Symptom Checker & Triage
* **Gemini AI Integration**: Analyzes symptoms in **Amharic (አማርኛ)**, **Afaan Oromo**, and **English**.
* **Clinical Intelligence**: Estimates potential conditions, categorizes severity (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`), recommends specific hospital departments, and gives triage advice.
* *Note: Always displays clinical disclaimer prioritizing licensed professional judgment.*

### 2. Geolocation Emergency SOS Broadcasts (Socket.io)
* **One-Click Rescue**: Instantly broadcasts patient emergency status, live GPS, allergies, and blood group.
* **Ambulance Dispatches**: Live WebSocket telemetry pushes nearest driver coordinates, distance, and ETA updates directly to the patient's dashboard.

### 3. Smart Resource Telemetry (Beds, Blood Bank)
* **Hospital Bed telemetry**: Displays live, active bed occupancies and ICU capacities.
* **Blood Bank stocks**: Real-time bag counters sorted by blood groups across hospitals, helping ER logistics.
* **Queue Predictions**: Predicts wait times at check-in counters using hospital statistics.

### 4. Billing & Integrated Payment Gateways
* Simulated checkout integrations for Ethiopia's major payment mechanisms:
  * **Telebirr**
  * **Chapa**
  * **CBE Birr**
  * **SantimPay**

---

## 📂 Developer Setup & Installation

### 💻 Local Run Setup

1. **Bootstrap local environment**:
   Execute the PowerShell bootstrapper from the root directory to install all dependencies and set up `.env` files automatically:
   ```powershell
   .\scripts\setup.ps1
   ```

2. **Spin up local database**:
   Navigate to `/database` and run the development database and cache containers:
   ```bash
   cd database
   docker-compose up -d
   ```

3. **Deploy Migrations & Seed Data**:
   Inside `/backend`, run the Prisma commands to build your schema and seed mock accounts:
   ```bash
   cd backend
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. **Launch Development Servers**:
   * **Backend**: `cd backend && npm run dev` (Runs on `http://localhost:5000`)
   * **Frontend**: `cd frontend && npm run dev` (Runs on `http://localhost:3000`)

---

## 🐳 Docker Deployment (Full Orchestration)

To run the entire system (Next.js, Express, Postgres, and Redis) in unified containers, simply execute the following at the root:

```bash
docker-compose up --build -d
```

- **Frontend Node**: Available at `http://localhost:3000`
- **Backend API Server**: Available at `http://localhost:5000`
- **Postgres Database**: Available at `localhost:5432`
- **Redis Cache**: Available at `localhost:6379`

---

## 🧪 Running the Verification Test Suites

A comprehensive suite of unit and integration tests is built in `/tests` using Jest and Supertest. It mocks Prisma database calls to run fast and reliably in CI/CD without database dependencies.

1. **Install Testing Dependencies**:
   ```bash
   cd tests
   npm install
   ```

2. **Run Tests**:
   ```bash
   npm test
   ```

---

## 🏥 Seeded Users for Verification & Local Testing

Use these accounts to test the dashboard modules (Password for all accounts is **`Password123!`**):

| Role | Phone Number | Email | Purpose |
|------|--------------|-------|---------|
| **Super Admin** | `+251911000000` | `admin@medilink.et` | Verifies doctors/hospitals, national analytics |
| **Hospital Admin** | `+251911111111` | `hospadmin@medilink.et` | Manages departments, beds, and billing |
| **Doctor (Pediatrics)** | `+251911222222` | `dr.selam@medilink.et` | Evaluates checkups, uploads diagnoses, AI summaries |
| **Doctor (Cardiology)** | `+251911333333` | `dr.chala@medilink.et` | Specialized consulting, cardiology records |
| **Patient** | `+251911999999` | `patient.tewodros@gmail.com` | Symptom checks, SOS broadcasts, books appointments |
| **Pharmacy** | `+251911666666` | `kenema.pharmacy@medilink.et` | Inventory upserts, expiry notices, drug stocks |
| **Lab Staff** | `+251911777777` | `wudase.lab@medilink.et` | Test requests, uploads lab results |
| **Ambulance Driver** | `+251911888888` | `driver.mulu@medilink.et` | Accepts SOS signals, broadcasts coordinates |
