// backend/src/routes/subject.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, sameSchool } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');

router.get('/', authenticate, sameSchool, async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { schoolId: req.user.schoolId },
      include: { teachers: { include: { teacher: { select: { firstName: true, lastName: true } } } } },
      orderBy: { name: 'asc' },
    });
    return res.json(new ApiResponse(200, subjects));
  } catch (e) { next(e); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const subject = await prisma.subject.create({ data: { ...req.body, schoolId: req.user.schoolId } });
    return res.status(201).json(new ApiResponse(201, subject));
  } catch (e) { next(e); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const subject = await prisma.subject.update({ where: { id: req.params.id }, data: req.body });
    return res.json(new ApiResponse(200, subject));
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    // Check if subject is in use
    const inUse = await prisma.teacherSubject.count({ where: { subjectId: req.params.id } });
    if (inUse > 0) throw new ApiError(400, 'Cannot delete — subject is assigned to teachers');
    await prisma.subject.delete({ where: { id: req.params.id } });
    return res.json(new ApiResponse(200, null, 'Subject deleted'));
  } catch (e) { next(e); }
});

module.exports = router;
