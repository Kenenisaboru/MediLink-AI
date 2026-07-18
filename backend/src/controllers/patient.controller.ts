import { Response } from 'express';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AIService } from '../services/ai.service';

export class PatientController {
  // Get active Patient profile
  private static async getPatientProfile(userId: string) {
    return prisma.patientProfile.findUnique({
      where: { userId },
    });
  }

  static async symptomCheck(req: AuthenticatedRequest, res: Response) {
    const { symptoms, language } = req.body;
    if (!symptoms) {
      return res.status(400).json({ error: 'Symptoms description is required.' });
    }

    try {
      const response = await AIService.analyzeSymptoms(symptoms, language || 'English');
      res.status(200).json(response);
    } catch (err: any) {
      res.status(500).json({ error: 'AI Symptom Checker failed: ' + err.message });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const patient = await PatientController.getPatientProfile(req.user!.id);
      if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

      res.status(200).json(patient);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getAppointments(req: AuthenticatedRequest, res: Response) {
    try {
      const patient = await PatientController.getPatientProfile(req.user!.id);
      if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

      const appointments = await prisma.appointment.findMany({
        where: { patientId: patient.id },
        include: {
          doctor: {
            include: {
              hospital: true,
            },
          },
        },
        orderBy: { dateTime: 'asc' },
      });

      res.status(200).json(appointments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async bookAppointment(req: AuthenticatedRequest, res: Response) {
    const { doctorId, dateTime, notes } = req.body;

    if (!doctorId || !dateTime) {
      return res.status(400).json({ error: 'Doctor ID and Appointment DateTime are required.' });
    }

    try {
      const patient = await PatientController.getPatientProfile(req.user!.id);
      if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

      // Generate a mock telemedicine room ID if appropriate
      const roomId = `room-${patient.id.substring(0, 5)}-${doctorId.substring(0, 5)}-${Date.now()}`;

      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId,
          dateTime: new Date(dateTime),
          notes,
          status: AppointmentStatus.PENDING,
          telemedicineRoomId: roomId,
        },
      });

      res.status(201).json(appointment);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getMedicalHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const patient = await PatientController.getPatientProfile(req.user!.id);
      if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

      const records = await prisma.medicalRecord.findMany({
        where: { patientId: patient.id },
        include: {
          doctor: true,
        },
        orderBy: { date: 'desc' },
      });

      res.status(200).json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      const patient = await PatientController.getPatientProfile(req.user!.id);
      if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

      const transactions = await prisma.transaction.findMany({
        where: { patientId: patient.id },
        include: {
          medicalRecord: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json(transactions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getActiveSOSAlerts(req: AuthenticatedRequest, res: Response) {
    try {
      const patient = await PatientController.getPatientProfile(req.user!.id);
      if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

      const sosList = await prisma.emergencySOS.findMany({
        where: { patientId: patient.id },
        include: {
          dispatchedDriver: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json(sosList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
