import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export class InventoryController {
  // Get pharmacy inventory
  static async getPharmacyInventory(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacy = await prisma.pharmacyProfile.findUnique({
        where: { userId: req.user!.id },
      });

      if (!pharmacy) {
        return res.status(404).json({ error: 'Pharmacy profile not found.' });
      }

      const inventory = await prisma.inventoryItem.findMany({
        where: { pharmacyId: pharmacy.id },
        orderBy: { name: 'asc' },
      });

      res.status(200).json(inventory);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Add/Update item
  static async upsertInventoryItem(req: AuthenticatedRequest, res: Response) {
    const { id, name, quantity, price, expirationDate, batchNumber, category } = req.body;

    if (!name || quantity === undefined || !price) {
      return res.status(400).json({ error: 'Name, quantity, and price are required.' });
    }

    try {
      const pharmacy = await prisma.pharmacyProfile.findUnique({
        where: { userId: req.user!.id },
      });

      if (!pharmacy) {
        return res.status(404).json({ error: 'Pharmacy profile not found.' });
      }

      let item;
      if (id) {
        // Update
        item = await prisma.inventoryItem.update({
          where: { id },
          data: {
            name,
            quantity: parseInt(quantity),
            price: parseFloat(price),
            expirationDate: new Date(expirationDate),
            batchNumber,
            category,
          },
        });
      } else {
        // Create
        item = await prisma.inventoryItem.create({
          data: {
            pharmacyId: pharmacy.id,
            name,
            quantity: parseInt(quantity),
            price: parseFloat(price),
            expirationDate: new Date(expirationDate),
            batchNumber,
            category,
          },
        });
      }

      res.status(200).json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get expiry warnings
  static async getExpiryWarnings(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacy = await prisma.pharmacyProfile.findUnique({
        where: { userId: req.user!.id },
      });

      if (!pharmacy) {
        return res.status(404).json({ error: 'Pharmacy profile not found.' });
      }

      const warningThreshold = new Date();
      warningThreshold.setMonth(warningThreshold.getMonth() + 3); // 3 months warning

      const expiringItems = await prisma.inventoryItem.findMany({
        where: {
          pharmacyId: pharmacy.id,
          expirationDate: {
            lte: warningThreshold,
          },
        },
        orderBy: { expirationDate: 'asc' },
      });

      res.status(200).json(expiringItems);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get blood bank stock
  static async getBloodStock(req: AuthenticatedRequest, res: Response) {
    const { hospitalId } = req.params;

    try {
      const stock = await prisma.bloodStock.findMany({
        where: { hospitalId },
        orderBy: { bloodGroup: 'asc' },
      });
      res.status(200).json(stock);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Update blood stock
  static async updateBloodStock(req: AuthenticatedRequest, res: Response) {
    const { hospitalId, bloodGroup, bagsCount } = req.body;

    if (!hospitalId || !bloodGroup || bagsCount === undefined) {
      return res.status(400).json({ error: 'Hospital ID, Blood Group, and bags count are required.' });
    }

    try {
      const existing = await prisma.bloodStock.findFirst({
        where: { hospitalId, bloodGroup },
      });

      let stock;
      if (existing) {
        stock = await prisma.bloodStock.update({
          where: { id: existing.id },
          data: { bagsCount: parseInt(bagsCount) },
        });
      } else {
        stock = await prisma.bloodStock.create({
          data: {
            hospitalId,
            bloodGroup,
            bagsCount: parseInt(bagsCount),
          },
        });
      }

      res.status(200).json(stock);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
