// backend/src/routes/academic-year.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, sameSchool, authorize } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');

router.get('/', authenticate, sameSchool, async (req, res, next) => {
  try {
    const years = await prisma.academicYear.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { startDate: 'desc' },
    });
    return res.json(new ApiResponse(200, years));
  } catch (e) { next(e); }
});

router.post('/', authenticate, authorize('SUPER_ADMIN','PRINCIPAL'), async (req, res, next) => {
  try {
    const { name, startDate, endDate } = req.body;
    const year = await prisma.academicYear.create({
      data: { schoolId: req.user.schoolId, name, startDate: new Date(startDate), endDate: new Date(endDate) }
    });
    return res.status(201).json(new ApiResponse(201, year, 'Academic year created'));
  } catch (e) { next(e); }
});

router.patch('/:id/set-current', authenticate, authorize('SUPER_ADMIN','PRINCIPAL'), async (req, res, next) => {
  try {
    // Unset all current
    await prisma.academicYear.updateMany({ where: { schoolId: req.user.schoolId }, data: { isCurrent: false } });
    const year = await prisma.academicYear.update({ where: { id: req.params.id }, data: { isCurrent: true } });
    return res.json(new ApiResponse(200, year, 'Current year updated'));
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, authorize('SUPER_ADMIN','PRINCIPAL'), async (req, res, next) => {
  try {
    const year = await prisma.academicYear.findUnique({ where: { id: req.params.id } });
    if (!year) throw new ApiError(404, 'Academic year not found');
    if (year.isCurrent) throw new ApiError(400, 'Cannot delete the current academic year');
    await prisma.academicYear.delete({ where: { id: req.params.id } });
    return res.json(new ApiResponse(200, null, 'Academic year deleted'));
  } catch (e) { next(e); }
});

module.exports = router;
