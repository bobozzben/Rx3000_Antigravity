import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/vendors/search?q=...
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string || '').trim();

    const vendors = await prisma.vendor.findMany({
      where: q ? {
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      } : undefined,
      take: 25,
      orderBy: { code: 'asc' },
    });

    res.json(vendors);
  } catch (error) {
    console.error('Error searching vendors:', error);
    res.status(500).json({ error: 'Failed to search vendors' });
  }
});

export default router;
