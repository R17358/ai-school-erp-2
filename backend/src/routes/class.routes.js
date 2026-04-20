// backend/src/routes/class.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, sameSchool } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');

router.get('/', authenticate, sameSchool, async (req, res, next) => {
  try {
    const { academicYearId } = req.query;
    const classes = await prisma.class.findMany({
      where: { schoolId: req.user.schoolId, ...(academicYearId && { academicYearId }) },
      include: {
        classTeacher: { select: { firstName: true, lastName: true } },
        _count: { select: { students: true } },
      },
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
    });
    return res.json(new ApiResponse(200, classes));
  } catch (e) { next(e); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, section, roomNo, capacity, academicYearId, classTeacherId } = req.body;
    const cls = await prisma.class.create({
      data: { schoolId: req.user.schoolId, name, section, roomNo, capacity, academicYearId, classTeacherId }
    });
    return res.status(201).json(new ApiResponse(201, cls, 'Class created'));
  } catch (e) { next(e); }
});

module.exports = router;
