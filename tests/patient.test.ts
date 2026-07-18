import request from 'supertest';
import { app } from '../backend/src/app';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = 'super_secret_jwt_access_token_key_medilink_ai_2026';

const mockPatientToken = jwt.sign(
  { id: 'mock-user-uuid', phone: '+251911999999', role: 'PATIENT' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const mockPatientProfile = {
  id: 'mock-patient-id',
  userId: 'mock-user-uuid',
  fullName: 'Tewodros Assefa',
  gender: 'Male',
  dateOfBirth: new Date('1985-05-15'),
  bloodGroup: 'O+',
};

const mockPrisma = {
  patientProfile: {
    findUnique: jest.fn(),
  },
  appointment: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  medicalRecord: {
    findMany: jest.fn(),
  },
  transaction: {
    findMany: jest.fn(),
  },
  emergencySOS: {
    findMany: jest.fn(),
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

describe('MediLink AI — Patient Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/patient/profile', () => {
    it('should return 401 when authorization header is missing', async () => {
      const response = await request(app).get('/api/patient/profile');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Authorization header missing.');
    });

    it('should return patient profile data when authenticated', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue(mockPatientProfile);

      const response = await request(app)
        .get('/api/patient/profile')
        .set('Authorization', `Bearer ${mockPatientToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'mock-patient-id');
      expect(response.body).toHaveProperty('fullName', 'Tewodros Assefa');
      expect(mockPrisma.patientProfile.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/patient/symptom-check', () => {
    it('should trigger AI Symptom Checker simulation or real api call', async () => {
      const response = await request(app)
        .post('/api/patient/symptom-check')
        .set('Authorization', `Bearer ${mockPatientToken}`)
        .send({
          symptoms: 'I have chest pain and heavy pressure',
          language: 'English',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('urgencyLevel');
      expect(response.body).toHaveProperty('conditions');
      expect(response.body).toHaveProperty('recommendedDepartment');
      expect(response.body).toHaveProperty('advice');
    });
  });

  describe('POST /api/patient/appointments', () => {
    it('should successfully book an appointment', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue(mockPatientProfile);
      mockPrisma.appointment.create.mockResolvedValue({
        id: 'mock-app-id',
        patientId: 'mock-patient-id',
        doctorId: 'mock-doctor-id',
        dateTime: new Date('2026-07-20T10:00:00Z'),
        notes: 'Clinical check',
        status: 'PENDING',
      });

      const response = await request(app)
        .post('/api/patient/appointments')
        .set('Authorization', `Bearer ${mockPatientToken}`)
        .send({
          doctorId: 'mock-doctor-id',
          dateTime: '2026-07-20T10:00:00Z',
          notes: 'Clinical check',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'mock-app-id');
      expect(response.body).toHaveProperty('status', 'PENDING');
      expect(mockPrisma.appointment.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/patient/medical-history', () => {
    it('should return patient medical records history list', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue(mockPatientProfile);
      mockPrisma.medicalRecord.findMany.mockResolvedValue([
        {
          id: 'record-1',
          patientId: 'mock-patient-id',
          doctorId: 'doc-1',
          diagnosis: 'Essential Hypertension',
          notes: 'Patient BP is 145/95',
          prescriptions: [],
          labRequests: [],
        },
      ]);

      const response = await request(app)
        .get('/api/patient/medical-history')
        .set('Authorization', `Bearer ${mockPatientToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('diagnosis', 'Essential Hypertension');
    });
  });
});
