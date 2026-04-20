// backend/src/routes/holiday.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, sameSchool } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');

router.get('/', authenticate, sameSchool, async (req, res, next) => {
  try {
    const { year } = req.query;
    const where = {
      schoolId: req.user.schoolId,
      ...(year && { date: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } }),
    };
    const holidays = await prisma.holiday.findMany({ where, orderBy: { date: 'asc' } });
    const events = await prisma.event.findMany({ where: { schoolId: req.user.schoolId }, orderBy: { date: 'asc' } });
    return res.json(new ApiResponse(200, { holidays, events }));
  } catch (e) { next(e); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const holiday = await prisma.holiday.create({ data: { ...req.body, schoolId: req.user.schoolId, date: new Date(req.body.date) } });
    return res.status(201).json(new ApiResponse(201, holiday));
  } catch (e) { next(e); }
});

module.exports = router;
