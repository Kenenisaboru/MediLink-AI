import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class HospitalController {
  // Get all hospitals with filters
  static async searchHospitals(req: Request, res: Response) {
    const { city, emergency, name } = req.query;

    try {
      const filters: any = {};
      if (city) filters.city = city as string;
      if (emergency === 'true') filters.isEmergencyAvailable = true;
      if (name) {
        filters.name = {
          contains: name as string,
          mode: 'insensitive',
        };
      }

      const hospitals = await prisma.hospital.findMany({
        where: filters,
        include: {
          doctors: true,
          bloodStocks: true,
        },
      });

      res.status(200).json(hospitals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get doctors list with filters
  static async searchDoctors(req: Request, res: Response) {
    const { specialty, hospitalId, name } = req.query;

    try {
      const filters: any = {};
      if (specialty) filters.specialty = specialty as string;
      if (hospitalId) filters.hospitalId = hospitalId as string;
      if (name) {
        filters.fullName = {
          contains: name as string,
          mode: 'insensitive',
        };
      }

      const doctors = await prisma.doctorProfile.findMany({
        where: filters,
        include: {
          hospital: true,
        },
      });

      res.status(200).json(doctors);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get Admin statistics/dashboard metrics
  static async getAdminMetrics(req: Request, res: Response) {
    try {
      const patientCount = await prisma.patientProfile.count();
      const doctorCount = await prisma.doctorProfile.count();
      const hospitalCount = await prisma.hospital.count();
      const transactionSum = await prisma.transaction.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      });

      // Query emergency counts
      const emergencySOSCount = await prisma.emergencySOS.count();
      const activeSOSCount = await prisma.emergencySOS.count({
        where: { status: 'ACTIVE' },
      });

      // Outbreak data points (simulate counts of recent records matching highly infectious tags)
      const records = await prisma.medicalRecord.findMany({
        select: { diagnosis: true, date: true },
      });

      // Basic outbreak counting
      const outbreakMap: { [key: string]: number } = {};
      records.forEach((r) => {
        const diag = r.diagnosis.toLowerCase();
        if (diag.includes('malaria') || diag.includes('cholera') || diag.includes('dengue') || diag.includes('measles')) {
          outbreakMap[r.diagnosis] = (outbreakMap[r.diagnosis] || 0) + 1;
        }
      });

      res.status(200).json({
        statistics: {
          patients: patientCount,
          doctors: doctorCount,
          hospitals: hospitalCount,
          totalRevenue: transactionSum._sum.amount || 0,
          emergencyAlerts: emergencySOSCount,
          activeEmergencies: activeSOSCount,
        },
        outbreaks: Object.entries(outbreakMap).map(([disease, count]) => ({
          disease,
          count,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Hospital-specific analytics (Beds, Queue, Doctors list)
  static async getHospitalAnalytics(req: Request, res: Response) {
    const { hospitalId } = req.params;

    try {
      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        include: {
          doctors: {
            include: {
              appointments: true,
            },
          },
          nurses: true,
        },
      });

      if (!hospital) {
        return res.status(404).json({ error: 'Hospital not found.' });
      }

      res.status(200).json(hospital);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
