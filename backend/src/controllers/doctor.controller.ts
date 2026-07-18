import { Response } from 'express';
import { AppointmentStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AIService } from '../services/ai.service';

export class DoctorController {
  private static async getDoctorProfile(userId: string) {
    return prisma.doctorProfile.findUnique({
      where: { userId },
      include: { hospital: true },
    });
  }

  static async getAppointments(req: AuthenticatedRequest, res: Response) {
    try {
      const doctor = await DoctorController.getDoctorProfile(req.user!.id);
      if (!doctor) return res.status(404).json({ error: 'Doctor profile not found.' });

      const appointments = await prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        include: {
          patient: {
            include: {
              user: {
                select: { phone: true, email: true },
              },
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

  static async updateAppointmentStatus(req: AuthenticatedRequest, res: Response) {
    const { appointmentId, status } = req.body;

    if (!appointmentId || !status) {
      return res.status(400).json({ error: 'Appointment ID and status are required.' });
    }

    try {
      const doctor = await DoctorController.getDoctorProfile(req.user!.id);
      if (!doctor) return res.status(404).json({ error: 'Doctor profile not found.' });

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment || appointment.doctorId !== doctor.id) {
        return res.status(404).json({ error: 'Appointment not found or unauthorized.' });
      }

      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: status as AppointmentStatus },
      });

      res.status(200).json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createMedicalRecord(req: AuthenticatedRequest, res: Response) {
    const { patientId, diagnosis, notes, prescriptions, labRequests } = req.body;

    if (!patientId || !diagnosis || !notes) {
      return res.status(400).json({ error: 'Patient ID, diagnosis, and notes are required.' });
    }

    try {
      const doctor = await DoctorController.getDoctorProfile(req.user!.id);
      if (!doctor) return res.status(404).json({ error: 'Doctor profile not found.' });

      // Create medical record
      const record = await prisma.medicalRecord.create({
        data: {
          patientId,
          doctorId: doctor.id,
          diagnosis,
          notes,
          prescriptions: prescriptions ? prescriptions : [],
          labRequests: labRequests ? labRequests : [],
        },
      });

      res.status(201).json(record);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async generateAISummary(req: AuthenticatedRequest, res: Response) {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    try {
      const doctor = await DoctorController.getDoctorProfile(req.user!.id);
      if (!doctor) return res.status(404).json({ error: 'Doctor profile not found.' });

      // Get patient details and history
      const patient = await prisma.patientProfile.findUnique({
        where: { id: patientId },
        include: {
          medicalRecords: {
            take: 5,
            orderBy: { date: 'desc' },
            include: { doctor: true },
          },
        },
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found.' });
      }

      // Format data for AI summarizer
      const promptData = {
        patientName: patient.fullName,
        allergies: patient.allergies,
        chronicDiseases: patient.chronicDiseases,
        surgeries: patient.surgeries,
        records: patient.medicalRecords.map(r => ({
          date: r.date,
          diagnosis: r.diagnosis,
          notes: r.notes,
          doctor: r.doctor.fullName,
          prescriptions: r.prescriptions,
          labRequests: r.labRequests,
        })),
      };

      const summary = await AIService.generateMedicalSummary(promptData);
      res.status(200).json({ summary });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate medical summary: ' + err.message });
    }
  }
}
