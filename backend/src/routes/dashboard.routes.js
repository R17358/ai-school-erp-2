// backend/src/routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, sameSchool } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');

router.get('/', authenticate, sameSchool, async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalStudents, totalTeachers, totalStaff,
      presentToday, pendingLeaves, upcomingExams,
      feeAgg, overdueAgg,
    ] = await Promise.all([
      prisma.student.count({ where: { user: { schoolId, isActive: true } } }),
      prisma.teacher.count({ where: { user: { schoolId, isActive: true } } }),
      prisma.staff.count({ where: { user: { schoolId, isActive: true } } }),
      prisma.attendance.count({ where: { class: { schoolId }, date: today, status: 'PRESENT' } }),
      prisma.leave.count({ where: { requester: { schoolId }, status: 'PENDING' } }),
      prisma.exam.count({ where: { schoolId, startDate: { gte: today } } }),
      prisma.feeCollection.aggregate({ where: { status: 'PAID', feeStructure: { schoolId } }, _sum: { amountPaid: true } }),
      prisma.feeCollection.aggregate({ where: { status: 'OVERDUE', feeStructure: { schoolId } }, _sum: { amountDue: true } }),
    ]);

    return res.json(new ApiResponse(200, {
      totalStudents, totalTeachers, totalStaff,
      presentToday, pendingLeaves, upcomingExams,
      feeCollected: feeAgg._sum.amountPaid || 0,
      feeOverdue: overdueAgg._sum.amountDue || 0,
    }));
  } catch (e) { next(e); }
});

module.exports = router;
