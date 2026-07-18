import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AIService } from '../services/ai.service';

export class LabController {
  // Get all pending or past lab requests
  static async getLabRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const records = await prisma.medicalRecord.findMany({
        include: {
          patient: true,
          doctor: true,
        },
        orderBy: { date: 'desc' },
      });

      // Filter and expand medical records containing lab requests
      const labRequestsList: any[] = [];
      records.forEach((record) => {
        const labRequests = Array.isArray(record.labRequests)
          ? record.labRequests
          : JSON.parse(JSON.stringify(record.labRequests));

        if (Array.isArray(labRequests)) {
          labRequests.forEach((reqItem: any, index: number) => {
            labRequestsList.push({
              id: `${record.id}-${index}`,
              recordId: record.id,
              requestIndex: index,
              patientName: record.patient.fullName,
              testName: reqItem.name,
              instructions: reqItem.instructions || 'No instructions provided',
              requestedBy: record.doctor.fullName,
              requestedAt: record.date,
              status: reqItem.status || 'PENDING',
              result: reqItem.result || '',
              resultNotes: reqItem.resultNotes || '',
            });
          });
        }
      });

      res.status(200).json(labRequestsList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Update a specific lab request with results and notes
  static async submitLabResult(req: AuthenticatedRequest, res: Response) {
    const { recordId, requestIndex, result, resultNotes } = req.body;

    if (!recordId || requestIndex === undefined || !result) {
      return res.status(400).json({ error: 'Record ID, request index, and result value are required.' });
    }

    try {
      const record = await prisma.medicalRecord.findUnique({
        where: { id: recordId },
      });

      if (!record) {
        return res.status(404).json({ error: 'Medical record not found.' });
      }

      const labRequests = JSON.parse(JSON.stringify(record.labRequests));
      if (!Array.isArray(labRequests) || !labRequests[requestIndex]) {
        return res.status(400).json({ error: 'Lab request not found at specified index.' });
      }

      // Update the target lab request
      labRequests[requestIndex].result = result;
      labRequests[requestIndex].resultNotes = resultNotes || '';
      labRequests[requestIndex].status = 'COMPLETED';

      const updatedRecord = await prisma.medicalRecord.update({
        where: { id: recordId },
        data: {
          labRequests: labRequests,
        },
      });

      res.status(200).json({ message: 'Lab result submitted successfully.', record: updatedRecord });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get AI explanation for lab results
  static async explainResult(req: AuthenticatedRequest, res: Response) {
    const { testName, resultValue, language } = req.query;
    if (!testName || !resultValue) {
      return res.status(400).json({ error: 'testName and resultValue are required.' });
    }

    try {
      const explanation = await AIService.explainLabResult(
        testName as string,
        resultValue as string,
        (language as string) || 'English'
      );
      res.status(200).json({ explanation });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
