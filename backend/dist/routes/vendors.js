"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/vendors/search?q=...
router.get('/search', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
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
    }
    catch (error) {
        console.error('Error searching vendors:', error);
        res.status(500).json({ error: 'Failed to search vendors' });
    }
});
exports.default = router;
