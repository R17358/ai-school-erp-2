// backend/src/routes/exam.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, checkPermission, sameSchool } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');

router.get('/', authenticate, sameSchool, checkPermission('exams', 'read'), async (req, res, next) => {
  try {
    const { academicYearId } = req.query;
    const exams = await prisma.exam.findMany({
      where: { schoolId: req.user.schoolId, ...(academicYearId && { academicYearId }) },
      include: { papers: { include: { subject: true } }, _count: { select: { papers: true, results: true } } },
      orderBy: { startDate: 'desc' },
    });
    return res.json(new ApiResponse(200, exams));
  } catch (e) { next(e); }
});

router.post('/', authenticate, checkPermission('exams', 'create'), async (req, res, next) => {
  try {
    const exam = await prisma.exam.create({ data: { ...req.body, schoolId: req.user.schoolId } });
    return res.status(201).json(new ApiResponse(201, exam, 'Exam created'));
  } catch (e) { next(e); }
});

router.get('/:id', authenticate, checkPermission('exams', 'read'), async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: { papers: { include: { subject: true, teacher: { select: { firstName: true, lastName: true } } } } }
    });
    if (!exam) throw new ApiError(404, 'Exam not found');
    return res.json(new ApiResponse(200, exam));
  } catch (e) { next(e); }
});

router.put('/:id', authenticate, checkPermission('exams', 'update'), async (req, res, next) => {
  try {
    const exam = await prisma.exam.update({ where: { id: req.params.id }, data: req.body });
    return res.json(new ApiResponse(200, exam, 'Exam updated'));
  } catch (e) { next(e); }
});

// Seating arrangement
router.post('/:id/seating', authenticate, checkPermission('exams', 'update'), async (req, res, next) => {
  try {
    const { rooms, classIds, strategy = 'roll_number' } = req.body;
    const students = await prisma.student.findMany({
      where: { classId: { in: classIds } },
      include: { class: true },
      orderBy: { rollNo: 'asc' },
    });

    const axios = require('axios');
    const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/ai/seating/generate`, {
      exam_id: req.params.id,
      rooms,
      students: students.map(s => ({ student_id: s.id, name: `${s.firstName} ${s.lastName}`, roll_no: s.rollNo || '', class_name: `${s.class?.name}-${s.class?.section}` })),
      strategy,
    }, { headers: { 'X-Service-Key': process.env.AI_SERVICE_KEY }, timeout: 30000 });

    const arrangements = aiRes.data.arrangements;
    const saved = await Promise.all(arrangements.map(arr =>
      prisma.seatingArrangement.create({
        data: {
          examId: req.params.id,
          classId: classIds[0],
          roomNo: arr.room_no,
          rows: arr.rows,
          cols: arr.cols,
          arrangement: arr.arrangement,
          generatedByAI: true,
        }
      })
    ));
    return res.json(new ApiResponse(200, { arrangements: saved, stats: aiRes.data }, 'Seating arranged'));
  } catch (e) { next(e); }
});

module.exports = router;
