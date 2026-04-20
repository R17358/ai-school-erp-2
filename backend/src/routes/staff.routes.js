// backend/src/routes/staff.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, checkPermission, sameSchool } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

router.get('/', authenticate, sameSchool, checkPermission('staff', 'read'), async (req, res, next) => {
  try {
    const { staffType, search } = req.query;
    const where = {
      user: { schoolId: req.user.schoolId },
      ...(staffType && { staffType }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ]
      }),
    };
    const staff = await prisma.staff.findMany({
      where,
      include: {
        user: { select: { email: true, phone: true, isActive: true, profilePicUrl: true } },
        department: true,
        designation: true,
      },
      orderBy: { firstName: 'asc' },
    });
    return res.json(new ApiResponse(200, staff));
  } catch (e) { next(e); }
});

router.post('/', authenticate, sameSchool, checkPermission('staff', 'create'), async (req, res, next) => {
  try {
    const { email, phone, password, profileData } = req.body;
    const passwordHash = await bcrypt.hash(password || 'Welcome@123', 12);
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({ where: { email, schoolId: req.user.schoolId } });
      if (existing) throw new ApiError(409, 'Email already in use');
      const roleMap = { WATCHMAN: 'WATCHMAN', PEON: 'PEON' };
      const role = roleMap[profileData?.staffType] || 'STAFF';
      const user = await tx.user.create({ data: { email, phone, passwordHash, role, schoolId: req.user.schoolId } });
      const staff = await tx.staff.create({ data: { userId: user.id, ...profileData } });
      return staff;
    });
    return res.status(201).json(new ApiResponse(201, result, 'Staff created'));
  } catch (e) { next(e); }
});

router.put('/:id', authenticate, checkPermission('staff', 'update'), async (req, res, next) => {
  try {
    const staff = await prisma.staff.update({ where: { id: req.params.id }, data: req.body.profileData });
    return res.json(new ApiResponse(200, staff, 'Staff updated'));
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, checkPermission('staff', 'delete'), async (req, res, next) => {
  try {
    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!staff) throw new ApiError(404, 'Staff not found');
    await prisma.user.update({ where: { id: staff.userId }, data: { isActive: false } });
    return res.json(new ApiResponse(200, null, 'Staff deactivated'));
  } catch (e) { next(e); }
});

module.exports = router;
