"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/purchase/next-bill-no
router.get('/next-bill-no', async (_req, res) => {
    try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const prefix = `PO-${yyyy}${mm}${dd}-`;
        const countToday = await prisma.purchaseHeader.count({
            where: {
                billNo: {
                    startsWith: prefix,
                },
            },
        });
        const nextSeq = String(countToday + 1).padStart(3, '0');
        const billNo = `${prefix}${nextSeq}`;
        res.json({ billNo });
    }
    catch (error) {
        console.error('Error generating bill number:', error);
        res.status(500).json({ error: 'Failed to generate bill number' });
    }
});
// POST /api/purchase
router.post('/', async (req, res) => {
    try {
        const { header, lines } = req.body;
        if (!header || !header.billNo || !header.vendorCode || !Array.isArray(lines) || lines.length === 0) {
            res.status(400).json({ error: 'Invalid purchase order payload. Header and non-empty lines are required.' });
            return;
        }
        const result = await prisma.$transaction(async (tx) => {
            const createdHeader = await tx.purchaseHeader.create({
                data: {
                    billNo: header.billNo,
                    vendorCode: header.vendorCode,
                    vendorName: header.vendorName || '',
                    total: header.total || 0,
                    lines: {
                        create: lines.map((line, index) => ({
                            lineNo: line.lineNo || (index + 1),
                            productCode: line.productCode,
                            productName: line.productName || '',
                            qty: line.qty || 0,
                            price: line.price || 0,
                            amount: line.amount || 0,
                        })),
                    },
                },
                include: {
                    lines: true,
                },
            });
            return createdHeader;
        });
        res.status(201).json({ message: 'Purchase order created successfully', purchaseOrder: result });
    }
    catch (error) {
        console.error('Error creating purchase order:', error);
        if (error.code === 'P2002') {
            res.status(409).json({ error: 'Bill number already exists. Please refresh for a new bill number.' });
            return;
        }
        res.status(500).json({ error: 'Failed to save purchase order' });
    }
});
// GET /api/purchase
router.get('/', async (_req, res) => {
    try {
        const orders = await prisma.purchaseHeader.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: { lines: true },
        });
        res.json(orders);
    }
    catch (error) {
        console.error('Error fetching purchase orders:', error);
        res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
});
exports.default = router;
