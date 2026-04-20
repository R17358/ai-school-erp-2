// backend/src/routes/school.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize, sameSchool } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');

router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const schools = await prisma.school.findMany({ orderBy: { name: 'asc' } });
    return res.json(new ApiResponse(200, schools));
  } catch (e) { next(e); }
});

router.get('/current', authenticate, async (req, res, next) => {
  try {
    const school = await prisma.school.findUnique({ where: { id: req.user.schoolId } });
    return res.json(new ApiResponse(200, school));
  } catch (e) { next(e); }
});

router.post('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const school = await prisma.school.create({ data: req.body });
    return res.status(201).json(new ApiResponse(201, school, 'School created'));
  } catch (e) { next(e); }
});

router.put('/current', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const { name, address, city, state, pincode, phone, email, website, boardType, affiliationNo, principalName, aiProvider, aiApiKey } = req.body;
    const school = await prisma.school.update({
      where: { id: req.user.schoolId },
      data: { name, address, city, state, pincode, phone, email, website, boardType, affiliationNo, principalName, aiProvider, aiApiKey },
    });
    return res.json(new ApiResponse(200, school, 'School updated'));
  } catch (e) { next(e); }
});

module.exports = router;
