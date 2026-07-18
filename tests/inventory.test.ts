import request from 'supertest';
import { app } from '../backend/src/app';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = 'super_secret_jwt_access_token_key_medilink_ai_2026';

const mockPharmacyToken = jwt.sign(
  { id: 'mock-pharmacy-user-uuid', phone: '+251911666666', role: 'PHARMACY' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const mockAdminToken = jwt.sign(
  { id: 'mock-admin-user-uuid', phone: '+251911000000', role: 'SUPER_ADMIN' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const mockPharmacyProfile = {
  id: 'mock-pharmacy-id',
  userId: 'mock-pharmacy-user-uuid',
  name: 'Kenema Pharmacy No 4',
  address: 'Piazza, Addis Ababa',
  contactNumber: '+251911666666',
};

const mockPrisma = {
  pharmacyProfile: {
    findUnique: jest.fn(),
  },
  inventoryItem: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  bloodStock: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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
  };
});

describe('MediLink AI — Inventory & Blood Bank Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/pharmacy/inventory', () => {
    it('should return pharmacy inventory items list', async () => {
      mockPrisma.pharmacyProfile.findUnique.mockResolvedValue(mockPharmacyProfile);
      mockPrisma.inventoryItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          pharmacyId: 'mock-pharmacy-id',
          name: 'Paracetamol 500mg',
          quantity: 1200,
          price: 5.50,
          expirationDate: new Date(),
          batchNumber: 'BATCH-001',
          category: 'Analgesics',
        },
      ]);

      const response = await request(app)
        .get('/api/pharmacy/inventory')
        .set('Authorization', `Bearer ${mockPharmacyToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('name', 'Paracetamol 500mg');
      expect(mockPrisma.pharmacyProfile.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/pharmacy/inventory', () => {
    it('should create new inventory item when ID is not supplied', async () => {
      mockPrisma.pharmacyProfile.findUnique.mockResolvedValue(mockPharmacyProfile);
      mockPrisma.inventoryItem.create.mockResolvedValue({
        id: 'new-item-id',
        name: 'Amoxicillin 500mg',
        quantity: 100,
        price: 15.00,
      });

      const response = await request(app)
        .post('/api/pharmacy/inventory')
        .set('Authorization', `Bearer ${mockPharmacyToken}`)
        .send({
          name: 'Amoxicillin 500mg',
          quantity: 100,
          price: 15.00,
          expirationDate: '2027-01-01',
          batchNumber: 'BATCH-002',
          category: 'Antibiotics',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'new-item-id');
      expect(mockPrisma.inventoryItem.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/blood-stock/:hospitalId', () => {
    it('should return blood stock list for specific hospital publicly', async () => {
      mockPrisma.bloodStock.findMany.mockResolvedValue([
        { id: 'blood-1', bloodGroup: 'O+', bagsCount: 15, hospitalId: 'hosp-1' },
      ]);

      const response = await request(app).get('/api/blood-stock/hosp-1');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('bloodGroup', 'O+');
    });
  });

  describe('POST /api/blood-stock/update', () => {
    it('should allow admin to update blood bank stock count', async () => {
      mockPrisma.bloodStock.findFirst.mockResolvedValue({
        id: 'blood-1',
        hospitalId: 'hosp-1',
        bloodGroup: 'O+',
        bagsCount: 10,
      });
      mockPrisma.bloodStock.update.mockResolvedValue({
        id: 'blood-1',
        bagsCount: 25,
      });

      const response = await request(app)
        .post('/api/blood-stock/update')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({
          hospitalId: 'hosp-1',
          bloodGroup: 'O+',
          bagsCount: 25,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('bagsCount', 25);
      expect(mockPrisma.bloodStock.update).toHaveBeenCalledTimes(1);
    });
  });
});
