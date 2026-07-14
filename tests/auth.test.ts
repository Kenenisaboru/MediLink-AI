import request from 'supertest';
import { app } from '../backend/src/app';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

// Mock Prisma Client globally for this test suite
const mockUser = {
  id: 'mock-user-uuid',
  phone: '+251911999999',
  email: 'tewodros@gmail.com',
  passwordHash: bcrypt.hashSync('Password123!', 10),
  role: 'PATIENT',
  isVerified: false,
  otpCode: '123456',
  otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
};

const mockProfile = {
  id: 'mock-patient-profile-uuid',
  userId: 'mock-user-uuid',
  fullName: 'Tewodros Assefa',
  gender: 'Male',
  dateOfBirth: new Date('1985-05-15'),
  bloodGroup: 'O+',
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  patientProfile: {
    create: jest.fn(),
  },
  doctorProfile: {
    create: jest.fn(),
  },
  pharmacyProfile: {
    create: jest.fn(),
  },
  labProfile: {
    create: jest.fn(),
  },
  ambulanceDriverProfile: {
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
};

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
    PaymentStatus: {
      PENDING: 'PENDING',
      SUCCESS: 'SUCCESS',
      FAILED: 'FAILED',
    },
    PaymentGateway: {
      CHAPA: 'CHAPA',
      TELEBIRR: 'TELEBIRR',
      SANTIMPAY: 'SANTIMPAY',
      CBEBIRR: 'CBEBIRR',
    },
    SOSStatus: {
      PENDING: 'PENDING',
      ACTIVE: 'ACTIVE',
      RESOLVED: 'RESOLVED',
    },
  };
});

describe('MediLink AI — Authentication Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new patient user and return mock OTP details', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        role: 'PATIENT',
      });
      mockPrisma.patientProfile.create.mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phone: '+251911999999',
          email: 'tewodros@gmail.com',
          password: 'Password123!',
          role: 'PATIENT',
          fullName: 'Tewodros Assefa',
          gender: 'Male',
          dateOfBirth: '1985-05-15',
          bloodGroup: 'O+',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Registration successful. OTP sent via SMS.');
      expect(response.body).toHaveProperty('userId', 'mock-user-uuid');
      expect(response.body).toHaveProperty('phone', '+251911999999');
      expect(response.body).toHaveProperty('otpDemo');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.patientProfile.create).toHaveBeenCalledTimes(1);
    });

    it('should return 409 if phone number already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phone: '+251911999999',
          password: 'Password123!',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'User with this phone number already exists.');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should verify OTP and mark user as verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, isVerified: true });

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone: '+251911999999',
          code: '123456',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Phone number verified successfully.');
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for incorrect OTP code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone: '+251911999999',
          code: 'incorrect_code',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Incorrect OTP code.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login and return access & refresh tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isVerified: true,
        patientProfile: mockProfile,
        doctorProfile: null,
        pharmacyProfile: null,
        labProfile: null,
        ambulanceDriver: null,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'mock-refresh-token' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '+251911999999',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('role', 'PATIENT');
      expect(response.body.user.profile).toHaveProperty('fullName', 'Tewodros Assefa');
    });

    it('should reject login with wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '+251911999999',
          password: 'wrong_password',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid phone number or password.');
    });
  });
});
