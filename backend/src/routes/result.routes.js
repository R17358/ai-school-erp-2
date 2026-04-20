// backend/src/routes/result.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, checkPermission, sameSchool } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');
const axios = require('axios');

router.get('/', authenticate, sameSchool, checkPermission('results', 'read'), async (req, res, next) => {
  try {
    const { examId, classId, studentId } = req.query;
    const results = await prisma.examResult.findMany({
      where: { ...(examId && { examId }), ...(classId && { classId }), ...(studentId && { studentId }) },
      include: {
        student: { select: { firstName: true, lastName: true, rollNo: true, admissionNo: true } },
        exam: { select: { name: true, examType: true } },
        class: { select: { name: true, section: true } },
      },
      orderBy: { rank: 'asc' },
    });
    return res.json(new ApiResponse(200, results));
  } catch (e) { next(e); }
});

router.post('/bulk', authenticate, checkPermission('results', 'create'), async (req, res, next) => {
  try {
    const { examId, classId, results } = req.body;
    // Calculate grades, rank etc.
    const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
    const saved = await prisma.$transaction(
      results.map((r, i) => {
        const rank = sorted.findIndex(s => s.studentId === r.studentId) + 1;
        return prisma.examResult.upsert({
          where: { examId_studentId: { examId, studentId: r.studentId } },
          create: { ...r, examId, classId, rank, isPassed: r.percentage >= 33 },
          update: { ...r, rank, isPassed: r.percentage >= 33 },
        });
      })
    );
    return res.json(new ApiResponse(200, saved, 'Results saved'));
  } catch (e) { next(e); }
});

router.post('/analyze', authenticate, async (req, res, next) => {
  try {
    const { class_name, exam_name, results } = req.body;
    const school = await prisma.school.findUnique({ where: { id: req.user.schoolId }, select: { aiProvider: true, aiApiKey: true } });
    const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/ai/results/analyze`, {
      class_name, exam_name, results,
      provider: school?.aiProvider, api_key: school?.aiApiKey,
    }, { headers: { 'X-Service-Key': process.env.AI_SERVICE_KEY }, timeout: 60000 });
    return res.json(new ApiResponse(200, aiRes.data));
  } catch (e) { next(e); }
});

module.exports = router;
