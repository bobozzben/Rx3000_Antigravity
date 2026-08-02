"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/products/search?q=...
router.get('/search', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const products = await prisma.product.findMany({
            where: q ? {
                OR: [
                    { code: { contains: q, mode: 'insensitive' } },
                    { name: { contains: q, mode: 'insensitive' } },
                ],
            } : undefined,
            take: 25,
            orderBy: { code: 'asc' },
        });
        res.json(products);
    }
    catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ error: 'Failed to search products' });
    }
});
exports.default = router;
