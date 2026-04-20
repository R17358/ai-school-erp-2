// backend/src/routes/report.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');

router.get('/attendance', authenticate, authorize('SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'), async (req, res, next) => {
  try {
    const { startDate, endDate, classId } = req.query;
    const records = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        class: { schoolId: req.user.schoolId },
        ...(classId && { classId }),
        ...(startDate && endDate && { date: { gte: new Date(startDate), lte: new Date(endDate) } }),
      },
      _count: { status: true },
    });
    return res.json(new ApiResponse(200, records));
  } catch (e) { next(e); }
});

router.get('/fees', authenticate, authorize('SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'), async (req, res, next) => {
  try {
    const summary = await prisma.feeCollection.groupBy({
      by: ['status'],
      where: { feeStructure: { schoolId: req.user.schoolId } },
      _sum: { amountDue: true, amountPaid: true },
      _count: { status: true },
    });
    return res.json(new ApiResponse(200, summary));
  } catch (e) { next(e); }
});

router.get('/results', authenticate, authorize('SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER'), async (req, res, next) => {
  try {
    const { examId, classId } = req.query;
    const results = await prisma.examResult.findMany({
      where: { ...(examId && { examId }), ...(classId && { classId }) },
      include: { student: { select: { firstName: true, lastName: true, rollNo: true } }, exam: true },
      orderBy: { rank: 'asc' },
    });
    return res.json(new ApiResponse(200, results));
  } catch (e) { next(e); }
});

module.exports = router;
