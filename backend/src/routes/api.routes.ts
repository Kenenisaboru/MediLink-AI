import { Router } from 'express';
import { Role } from '@prisma/client';
import { AuthController } from '../controllers/auth.controller';
import { PatientController } from '../controllers/patient.controller';
import { DoctorController } from '../controllers/doctor.controller';
import { PaymentController } from '../controllers/payment.controller';
import { HospitalController } from '../controllers/hospital.controller';
import { InventoryController } from '../controllers/inventory.controller';
import { LabController } from '../controllers/lab.controller';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// ================= AUTH ROUTES =================
router.post('/auth/register', AuthController.register);
router.post('/auth/verify-otp', AuthController.verifyOTP);
router.post('/auth/login', AuthController.login);
router.post('/auth/refresh', AuthController.refreshToken);
router.post('/auth/logout', AuthController.logout);

// ================= PATIENT ROUTES =================
router.get(
  '/patient/profile',
  authenticateJWT as any,
  authorizeRoles([Role.PATIENT]) as any,
  PatientController.getProfile as any
);
router.post(
  '/patient/symptom-check',
  PatientController.symptomCheck as any
);
router.get(
  '/patient/appointments',
  authenticateJWT as any,
  authorizeRoles([Role.PATIENT]) as any,
  PatientController.getAppointments as any
);
router.post(
  '/patient/appointments',
  authenticateJWT as any,
  authorizeRoles([Role.PATIENT]) as any,
  PatientController.bookAppointment as any
);
router.get(
  '/patient/medical-history',
  authenticateJWT as any,
  authorizeRoles([Role.PATIENT]) as any,
  PatientController.getMedicalHistory as any
);
router.get(
  '/patient/transactions',
  authenticateJWT as any,
  authorizeRoles([Role.PATIENT]) as any,
  PatientController.getTransactions as any
);
router.get(
  '/patient/sos-alerts',
  authenticateJWT as any,
  authorizeRoles([Role.PATIENT]) as any,
  PatientController.getActiveSOSAlerts as any
);

// ================= DOCTOR ROUTES =================
router.get(
  '/doctor/appointments',
  authenticateJWT as any,
  authorizeRoles([Role.DOCTOR]) as any,
  DoctorController.getAppointments as any
);
router.put(
  '/doctor/appointments/status',
  authenticateJWT as any,
  authorizeRoles([Role.DOCTOR]) as any,
  DoctorController.updateAppointmentStatus as any
);
router.post(
  '/doctor/medical-records',
  authenticateJWT as any,
  authorizeRoles([Role.DOCTOR]) as any,
  DoctorController.createMedicalRecord as any
);
router.get(
  '/doctor/ai-summary/:patientId',
  authenticateJWT as any,
  authorizeRoles([Role.DOCTOR]) as any,
  DoctorController.generateAISummary as any
);

// ================= PAYMENTS =================
router.post(
  '/payments/initiate',
  authenticateJWT as any,
  PaymentController.initiatePayment as any
);
router.post('/payments/callback', PaymentController.verifyCallback);

// ================= SEARCH & METRICS =================
router.get('/hospitals', HospitalController.searchHospitals);
router.get('/doctors', HospitalController.searchDoctors);
router.get(
  '/admin/metrics',
  authenticateJWT as any,
  authorizeRoles([Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN]) as any,
  HospitalController.getAdminMetrics as any
);
router.get('/hospitals/:hospitalId/analytics', HospitalController.getHospitalAnalytics);

// ================= PHARMACY INVENTORY =================
router.get(
  '/pharmacy/inventory',
  authenticateJWT as any,
  authorizeRoles([Role.PHARMACY]) as any,
  InventoryController.getPharmacyInventory as any
);
router.post(
  '/pharmacy/inventory',
  authenticateJWT as any,
  authorizeRoles([Role.PHARMACY]) as any,
  InventoryController.upsertInventoryItem as any
);
router.get(
  '/pharmacy/expiry-warnings',
  authenticateJWT as any,
  authorizeRoles([Role.PHARMACY]) as any,
  InventoryController.getExpiryWarnings as any
);

// ================= BLOOD BANK STOCK =================
router.get('/blood-stock/:hospitalId', InventoryController.getBloodStock as any);
router.post(
  '/blood-stock/update',
  authenticateJWT as any,
  authorizeRoles([Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN]) as any,
  InventoryController.updateBloodStock as any
);

// ================= LABORATORY =================
router.get(
  '/lab/requests',
  authenticateJWT as any,
  authorizeRoles([Role.LAB_STAFF]) as any,
  LabController.getLabRequests as any
);
router.post(
  '/lab/results',
  authenticateJWT as any,
  authorizeRoles([Role.LAB_STAFF]) as any,
  LabController.submitLabResult as any
);
router.get(
  '/lab/explain',
  authenticateJWT as any,
  LabController.explainResult as any
);

// ================= NOTIFICATIONS =================
router.get(
  '/notifications',
  authenticateJWT as any,
  NotificationController.getNotifications as any
);
router.put(
  '/notifications/:id/read',
  authenticateJWT as any,
  NotificationController.markAsRead as any
);

export default router;
