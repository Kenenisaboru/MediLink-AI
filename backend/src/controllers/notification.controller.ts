import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export class NotificationController {
  // Get notifications for current authenticated user
  static async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      res.status(200).json(notifications);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Mark notification as read
  static async markAsRead(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    try {
      const updated = await prisma.notification.updateMany({
        where: {
          id,
          userId: req.user!.id
        },
        data: { isRead: true }
      });
      res.status(200).json({ message: 'Notification marked as read', count: updated.count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
