// backend/src/routes/attendance.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, checkPermission, sameSchool } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');

// GET attendance for a class on a date
router.get('/', authenticate, sameSchool, checkPermission('attendance', 'read'), async (req, res, next) => {
  try {
    const { classId, date, studentId, startDate, endDate } = req.query;
    const where = {
      ...(classId && { classId }),
      ...(studentId && { studentId }),
      ...(date && { date: new Date(date) }),
      ...(startDate && endDate && { date: { gte: new Date(startDate), lte: new Date(endDate) } }),
    };
    const records = await prisma.attendance.findMany({
      where,
      include: { student: { select: { firstName: true, lastName: true, rollNo: true } } },
      orderBy: { date: 'desc' },
    });
    return res.json(new ApiResponse(200, records));
  } catch (e) { next(e); }
});

// POST bulk attendance
router.post('/', authenticate, checkPermission('attendance', 'create'), async (req, res, next) => {
  try {
    const { classId, date, records, teacherId } = req.body;
    const attendanceDate = new Date(date);

    const created = await prisma.$transaction(
      records.map(r => prisma.attendance.upsert({
        where: { classId_studentId_date: { classId, studentId: r.studentId, date: attendanceDate } },
        create: { classId, studentId: r.studentId, date: attendanceDate, status: r.status, teacherId: teacherId || req.user.id, remarks: r.remarks },
        update: { status: r.status, remarks: r.remarks },
      }))
    );

    return res.json(new ApiResponse(200, { count: created.length }, 'Attendance saved'));
  } catch (e) { next(e); }
});

// GET attendance summary for a student
router.get('/summary/:studentId', authenticate, async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.query;
    const total = await prisma.attendance.count({ where: { studentId } });
    const present = await prisma.attendance.count({ where: { studentId, status: 'PRESENT' } });
    const absent = await prisma.attendance.count({ where: { studentId, status: 'ABSENT' } });
    const late = await prisma.attendance.count({ where: { studentId, status: 'LATE' } });
    return res.json(new ApiResponse(200, {
      total, present, absent, late,
      percentage: total ? Math.round((present / total) * 100) : 0,
    }));
  } catch (e) { next(e); }
});

module.exports = router;
