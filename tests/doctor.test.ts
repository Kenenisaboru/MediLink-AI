import request from 'supertest';
import { app } from '../backend/src/app';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = 'super_secret_jwt_access_token_key_medilink_ai_2026';

const mockDoctorToken = jwt.sign(
  { id: 'mock-doctor-user-uuid', phone: '+251911222222', role: 'DOCTOR' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const mockDoctorProfile = {
  id: 'mock-doctor-id',
  userId: 'mock-doctor-user-uuid',
  fullName: 'Dr. Selamawit Hailu',
  specialty: 'Pediatrics',
  licenseNumber: 'DOC-ET-78901',
  hospitalId: 'mock-hospital-id',
};

const mockPrisma = {
  doctorProfile: {
    findUnique: jest.fn(),
  },
  appointment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  medicalRecord: {
    create: jest.fn(),
  },
  patientProfile: {
    findUnique: jest.fn(),
  },
};

jest.mock('../backend/src/utils/prisma', () => ({ get prisma() { return mockPrisma; } }));

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
    Role: {
      SUPER_ADMIN: 'SUPER_ADMIN',
      HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
      DOCTOR: 'DOCTOR',
      NURSE: 'NURSE',
      LAB_STAFF: 'LAB_STAFF',
      PHARMACY: 'PHARMACY',
      AMBULANCE_DRIVER: 'AMBULANCE_DRIVER',
      PATIENT: 'PATIENT',
    },
    AppointmentStatus: {
      PENDING: 'PENDING',
      ACCEPTED: 'ACCEPTED',
      REJECTED: 'REJECTED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    },
  };
});

describe('MediLink AI — Doctor Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/doctor/appointments', () => {
    it('should return 403 for user role other than DOCTOR', async () => {
      const patientToken = jwt.sign(
        { id: 'mock-user-uuid', phone: '+251911999999', role: 'PATIENT' },
        JWT_SECRET
      );

      const response = await request(app)
        .get('/api/doctor/appointments')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied: insufficient permissions.');
    });

    it('should successfully return doctor appointments lists', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctorProfile);
      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          id: 'app-id-1',
          patientId: 'patient-id-1',
          doctorId: 'mock-doctor-id',
          dateTime: new Date(),
          status: 'ACCEPTED',
          patient: { fullName: 'Tewodros Assefa', user: { phone: '+251911999999', email: 'tewo@gmail.com' } },
        },
      ]);

      const response = await request(app)
        .get('/api/doctor/appointments')
        .set('Authorization', `Bearer ${mockDoctorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('id', 'app-id-1');
      expect(mockPrisma.doctorProfile.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('PUT /api/doctor/appointments/status', () => {
    it('should update appointment status when authorized', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctorProfile);
      mockPrisma.appointment.findUnique.mockResolvedValue({
        id: 'app-id-1',
        doctorId: 'mock-doctor-id',
      });
      mockPrisma.appointment.update.mockResolvedValue({
        id: 'app-id-1',
        status: 'ACCEPTED',
      });

      const response = await request(app)
        .put('/api/doctor/appointments/status')
        .set('Authorization', `Bearer ${mockDoctorToken}`)
        .send({
          appointmentId: 'app-id-1',
          status: 'ACCEPTED',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ACCEPTED');
      expect(mockPrisma.appointment.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/doctor/medical-records', () => {
    it('should create medical record with prescription details successfully', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctorProfile);
      mockPrisma.medicalRecord.create.mockResolvedValue({
        id: 'record-uuid-1',
        patientId: 'patient-id-1',
        doctorId: 'mock-doctor-id',
        diagnosis: 'Essential Hypertension',
        notes: 'BP 145/95',
      });

      const response = await request(app)
        .post('/api/doctor/medical-records')
        .set('Authorization', `Bearer ${mockDoctorToken}`)
        .send({
          patientId: 'patient-id-1',
          diagnosis: 'Essential Hypertension',
          notes: 'BP 145/95',
          prescriptions: [
            { name: 'Amlodipine 5mg', dosage: '1 tab', frequency: 'Daily', days: 30 },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'record-uuid-1');
      expect(response.body).toHaveProperty('diagnosis', 'Essential Hypertension');
      expect(mockPrisma.medicalRecord.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/doctor/ai-summary/:patientId', () => {
    it('should return simulated AI summary of patient history', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctorProfile);
      mockPrisma.patientProfile.findUnique.mockResolvedValue({
        id: 'patient-id-1',
        fullName: 'Tewodros Assefa',
        allergies: ['Penicillin'],
        chronicDiseases: ['Hypertension'],
        surgeries: [],
        medicalRecords: [],
      });

      const response = await request(app)
        .get('/api/doctor/ai-summary/patient-id-1')
        .set('Authorization', `Bearer ${mockDoctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toContain('[AI GENERATED MEDICAL SUMMARY');
    });
  });
});
