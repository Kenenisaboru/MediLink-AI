import { Request, Response } from 'express';
import { PrismaClient, PaymentGateway, PaymentStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export class PaymentController {
  // Initiate simulated payment
  static async initiatePayment(req: AuthenticatedRequest, res: Response) {
    const { amount, gateway, medicalRecordId } = req.body;

    if (!amount || !gateway) {
      return res.status(400).json({ error: 'Amount and Gateway are required.' });
    }

    try {
      // Find patient profile
      const patient = await prisma.patientProfile.findUnique({
        where: { userId: req.user!.id },
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient profile not found.' });
      }

      // Generate a mock payment reference
      const reference = `REF-${gateway.toUpperCase()}-${Math.floor(1000000 + Math.random() * 9000000)}`;

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          patientId: patient.id,
          amount: parseFloat(amount),
          gateway: gateway as PaymentGateway,
          reference,
          status: PaymentStatus.PENDING,
          medicalRecordId: medicalRecordId || null,
        },
      });

      // Simulate payment gateway redirect URLs
      let paymentUrl = '';
      if (gateway === PaymentGateway.CHAPA) {
        paymentUrl = `https://mock.chapa.co/checkout/${reference}`;
      } else if (gateway === PaymentGateway.TELEBIRR) {
        paymentUrl = `https://mock.telebirr.et/pay?reference=${reference}`;
      } else if (gateway === PaymentGateway.SANTIMPAY) {
        paymentUrl = `https://mock.santimpay.com/pay/${reference}`;
      } else {
        paymentUrl = `https://mock.cbebirr.et/ussd-push?ref=${reference}`;
      }

      res.status(200).json({
        message: 'Payment checkout initiated.',
        transactionId: transaction.id,
        reference,
        paymentUrl,
      });
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // Verify and simulate callback webhook
  static async verifyCallback(req: Request, res: Response) {
    const { reference, status } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Reference is required.' });
    }

    try {
      const transaction = await prisma.transaction.findUnique({
        where: { reference },
        include: { patient: true },
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction reference not found.' });
      }

      const outcome = (status === 'FAILED') ? PaymentStatus.FAILED : PaymentStatus.SUCCESS;

      const updatedTransaction = await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: outcome },
      });

      // Create notification for the user
      await prisma.notification.create({
        data: {
          userId: transaction.patient.userId,
          message: `Your payment of ${transaction.amount} ETB via ${transaction.gateway} was ${outcome.toLowerCase()}.`,
          type: 'INFO',
        },
      });

      res.status(200).json({
        message: 'Transaction processed successfully.',
        transaction: updatedTransaction,
      });
    } catch (err: any) {
      console.error('Payment verification error:', err);
      res.status(500).json({ error: err.message });
    }
  }
}
