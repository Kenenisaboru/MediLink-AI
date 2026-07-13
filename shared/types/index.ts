// Shared type definitions between frontend and backend

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HOSPITAL_ADMIN = 'HOSPITAL_ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  LAB_STAFF = 'LAB_STAFF',
  PHARMACY = 'PHARMACY',
  AMBULANCE_DRIVER = 'AMBULANCE_DRIVER',
  PATIENT = 'PATIENT',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SOSStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
}

export enum PaymentGateway {
  TELEBIRR = 'TELEBIRR',
  CHAPA = 'CHAPA',
  SANTIMPAY = 'SANTIMPAY',
  CBEBIRR = 'CBEBIRR',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

// ---------- Socket.io Event Payloads ----------

export interface SOSTriggerPayload {
  patientId: string;
  latitude: number;
  longitude: number;
}

export interface SOSRegisteredPayload {
  sosId: string;
  status: SOSStatus;
}

export interface SOSAcceptedPayload {
  sosId: string;
  status: SOSStatus;
  driverName: string;
  vehicleNumber: string;
  driverLatitude: number;
  driverLongitude: number;
}

export interface DriverLocationPayload {
  driverId: string;
  latitude: number;
  longitude: number;
}

export interface DriverRegistrationPayload {
  driverId: string;
  fullName: string;
  vehicleNumber: string;
  latitude: number;
  longitude: number;
}

// ---------- API Response Types ----------

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    email: string | null;
    role: Role;
    isVerified: boolean;
    profile: any;
  };
}

export interface SymptomCheckResponse {
  languageDetected: string;
  conditions: string[];
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  recommendedDepartment: string;
  specialistType: string;
  advice: string;
  disclaimer: string;
}

export interface AdminMetricsResponse {
  statistics: {
    patients: number;
    doctors: number;
    hospitals: number;
    totalRevenue: number;
    emergencyAlerts: number;
    activeEmergencies: number;
  };
  outbreaks: Array<{
    disease: string;
    count: number;
  }>;
}

export interface PaymentInitiateResponse {
  message: string;
  transactionId: string;
  reference: string;
  paymentUrl: string;
}
