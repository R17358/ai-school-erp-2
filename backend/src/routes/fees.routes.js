// backend/src/routes/fees.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, checkPermission, sameSchool } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');
const { v4: uuidv4 } = require('uuid');

router.get('/', authenticate, sameSchool, checkPermission('fees', 'read'), async (req, res, next) => {
  try {
    const { search, status, classId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      feeStructure: { school: { id: req.user.schoolId } },
      ...(status && { status }),
    };
    const [fees, total] = await Promise.all([
      prisma.feeCollection.findMany({
        where, skip, take: Number(limit),
        include: {
          student: { include: { class: { select: { name: true, section: true } } } },
          feeStructure: { select: { feeType: true, frequency: true } },
          academicYear: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.feeCollection.count({ where }),
    ]);
    return res.json(new ApiResponse(200, { fees, total }));
  } catch (e) { next(e); }
});

router.post('/:id/collect', authenticate, checkPermission('fees', 'update'), async (req, res, next) => {
  try {
    const { amountPaid, paymentMode, remarks } = req.body;
    const fee = await prisma.feeCollection.findUnique({ where: { id: req.params.id } });
    if (!fee) throw new ApiError(404, 'Fee record not found');

    const totalPaid = fee.amountPaid + Number(amountPaid);
    const status = totalPaid >= fee.amountDue ? 'PAID' : 'PARTIAL';
    const receiptNo = `RCT${Date.now()}`;

    const updated = await prisma.feeCollection.update({
      where: { id: req.params.id },
      data: {
        amountPaid: totalPaid,
        status,
        paymentMode,
        paymentDate: new Date(),
        receiptNo,
        remarks,
        collectedBy: req.user.id,
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: fee.student ? undefined : req.user.id,
        title: 'Fee Payment Received',
        message: `₹${amountPaid} received. Receipt: ${receiptNo}`,
        type: 'success',
      }
    }).catch(() => {});

    return res.json(new ApiResponse(200, updated, 'Payment recorded'));
  } catch (e) { next(e); }
});

// GET fee structure
router.get('/structure', authenticate, sameSchool, async (req, res, next) => {
  try {
    const structures = await prisma.feeStructure.findMany({
      where: { schoolId: req.user.schoolId, isActive: true },
      orderBy: { className: 'asc' },
    });
    return res.json(new ApiResponse(200, structures));
  } catch (e) { next(e); }
});

// POST fee structure
router.post('/structure', authenticate, checkPermission('fees', 'create'), async (req, res, next) => {
  try {
    const { className, feeType, amount, frequency, dueDay, lateFine, academicYear } = req.body;
    const structure = await prisma.feeStructure.create({
      data: { schoolId: req.user.schoolId, className, feeType, amount, frequency, dueDay, lateFine, academicYear }
    });
    return res.status(201).json(new ApiResponse(201, structure, 'Fee structure created'));
  } catch (e) { next(e); }
});

// GET summary
router.get('/summary/dashboard', authenticate, sameSchool, async (req, res, next) => {
  try {
    const [collected, pending, overdue] = await Promise.all([
      prisma.feeCollection.aggregate({ where: { status: 'PAID', feeStructure: { schoolId: req.user.schoolId } }, _sum: { amountPaid: true } }),
      prisma.feeCollection.aggregate({ where: { status: 'PENDING', feeStructure: { schoolId: req.user.schoolId } }, _sum: { amountDue: true } }),
      prisma.feeCollection.aggregate({ where: { status: 'OVERDUE', feeStructure: { schoolId: req.user.schoolId } }, _sum: { amountDue: true } }),
    ]);
    return res.json(new ApiResponse(200, {
      collected: collected._sum.amountPaid || 0,
      pending: pending._sum.amountDue || 0,
      overdue: overdue._sum.amountDue || 0,
    }));
  } catch (e) { next(e); }
});

module.exports = router;
