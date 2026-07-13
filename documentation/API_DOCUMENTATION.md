# MediLink AI — API Documentation

## Base URL

```
Development: http://localhost:5000/api
Production:  https://api.medilink.et/api
```

All endpoints return JSON. Authentication uses Bearer tokens in the `Authorization` header.

---

## Authentication

### POST `/auth/register`
Register a new user (Patient, Doctor, Pharmacy, Lab Staff, Ambulance Driver).

**Body:**
```json
{
  "phone": "+251911999999",
  "email": "user@example.com",
  "password": "StrongPass123!",
  "role": "PATIENT",
  "fullName": "Tewodros Assefa",
  "gender": "Male",
  "dateOfBirth": "1985-05-15",
  "bloodGroup": "O+"
}
```

**Response (201):**
```json
{
  "message": "Registration successful. OTP sent via SMS.",
  "userId": "uuid",
  "phone": "+251911999999",
  "role": "PATIENT",
  "otpDemo": "482910"
}
```

### POST `/auth/verify-otp`
Verify phone number with OTP code.

**Body:** `{ "phone": "+251911999999", "code": "482910" }`

### POST `/auth/login`
Authenticate and receive JWT tokens.

**Body:** `{ "phone": "+251911999999", "password": "StrongPass123!" }`

**Response (200):**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "uuid",
    "phone": "+251911999999",
    "role": "PATIENT",
    "isVerified": true,
    "profile": { ... }
  }
}
```

### POST `/auth/refresh`
Renew access token using refresh token.

**Body:** `{ "token": "refresh_token_here" }`

### POST `/auth/logout`
Invalidate refresh token.

**Body:** `{ "token": "refresh_token_here" }`

---

## Patient Endpoints (Requires PATIENT role)

### GET `/patient/profile`
Retrieve authenticated patient's profile.

### POST `/patient/symptom-check`
AI-powered symptom analysis (Gemini).

**Body:**
```json
{
  "symptoms": "I have chest pain and shortness of breath",
  "language": "English"
}
```

Supported languages: `English`, `Amharic`, `Afaan Oromo`

**Response (200):**
```json
{
  "languageDetected": "English",
  "conditions": ["Angina Pectoris", "Myocardial Infarction"],
  "urgencyLevel": "EMERGENCY",
  "recommendedDepartment": "Cardiology",
  "specialistType": "Cardiologist",
  "advice": "Please go to the nearest emergency room immediately.",
  "disclaimer": "This AI provides health information only..."
}
```

### GET `/patient/appointments`
List all appointments for the authenticated patient.

### POST `/patient/appointments`
Book a new appointment.

**Body:**
```json
{
  "doctorId": "uuid",
  "dateTime": "2026-07-20T10:00:00Z",
  "notes": "Monthly blood pressure check"
}
```

### GET `/patient/medical-history`
Retrieve all medical records for the authenticated patient.

### GET `/patient/transactions`
List all billing transactions.

### GET `/patient/sos-alerts`
Get patient's emergency SOS history.

---

## Doctor Endpoints (Requires DOCTOR role)

### GET `/doctor/appointments`
List all appointments assigned to the authenticated doctor.

### PUT `/doctor/appointments/status`
Accept/reject/complete an appointment.

**Body:** `{ "appointmentId": "uuid", "status": "ACCEPTED" }`

### POST `/doctor/medical-records`
Create a new medical record with e-prescription.

**Body:**
```json
{
  "patientId": "uuid",
  "diagnosis": "Essential Hypertension",
  "notes": "Elevated BP 145/95. Low-sodium diet recommended.",
  "prescriptions": [
    { "name": "Amlodipine 5mg", "dosage": "1 tablet", "frequency": "Once Daily", "days": 30 }
  ],
  "labRequests": [
    { "name": "Lipid Profile", "instructions": "12-hour fasting" }
  ]
}
```

### GET `/doctor/ai-summary/:patientId`
Generate AI clinical summary of a patient's medical history (Gemini).

---

## Payment Endpoints

### POST `/payments/initiate` (Authenticated)
Initiate a simulated payment checkout.

**Body:**
```json
{
  "amount": 150.00,
  "gateway": "CHAPA",
  "medicalRecordId": "uuid"
}
```

Gateways: `CHAPA`, `TELEBIRR`, `SANTIMPAY`, `CBEBIRR`

### POST `/payments/callback` (Public webhook)
Simulate payment verification callback.

**Body:** `{ "reference": "REF-CHAPA-1234567", "status": "SUCCESS" }`

---

## Search & Public Endpoints

### GET `/hospitals`
Search hospitals. Query params: `city`, `emergency` (true/false), `name`.

### GET `/doctors`
Search doctors. Query params: `specialty`, `hospitalId`, `name`.

### GET `/admin/metrics`
Get national analytics dashboard data (patient/doctor/hospital counts, revenue, outbreak data).

### GET `/hospitals/:hospitalId/analytics`
Get detailed hospital analytics (beds, doctors, nurses).

---

## Pharmacy Endpoints (Requires PHARMACY role)

### GET `/pharmacy/inventory`
List all inventory items for the authenticated pharmacy.

### POST `/pharmacy/inventory`
Add or update an inventory item.

### GET `/pharmacy/expiry-warnings`
Get medicines expiring within 3 months.

---

## Blood Bank Endpoints

### GET `/blood-stock/:hospitalId` (Public)
Get blood stock levels for a hospital.

### POST `/blood-stock/update` (Requires SUPER_ADMIN or HOSPITAL_ADMIN)
Update blood stock levels.

**Body:** `{ "hospitalId": "uuid", "bloodGroup": "O+", "bagsCount": 25 }`

---

## Socket.io Events (Emergency SOS Gateway)

Connect to: `ws://localhost:5000`

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `string` (room name) | Join a named room |
| `trigger-sos` | `{ patientId, latitude, longitude }` | Patient triggers emergency |
| `register-driver` | `{ driverId, fullName, vehicleNumber, latitude, longitude }` | Driver registers availability |
| `driver-location-update` | `{ driverId, latitude, longitude, activeSOSId? }` | Driver broadcasts coordinates |
| `accept-sos` | `{ sosId, driverId }` | Driver claims an emergency |
| `resolve-sos` | `{ sosId, driverId }` | Driver resolves emergency |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `new-sos-alert` | `{ sosId, patientId, patientName, bloodGroup, allergies, latitude, longitude }` | Broadcast to all drivers |
| `sos-registered` | `{ sosId, status }` | Confirms SOS to patient |
| `sos-accepted` | `{ sosId, driverName, vehicleNumber, driverLatitude, driverLongitude }` | Ambulance dispatched |
| `driver-location` | `{ driverId, latitude, longitude }` | Live driver tracking |
| `sos-claimed` | `{ sosId }` | Alert claimed by a driver |
| `sos-resolved` | `{ sosId, status }` | Emergency resolved |

---

## Health Check

### GET `/health`
Returns server status.

**Response:** `{ "status": "healthy", "timestamp": "2026-07-13T..." }`
