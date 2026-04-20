// backend/src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize, ownOrAdmin } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');

// GET all users in a school (admin only)
router.get('/', authenticate, authorize('SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'), async (req, res, next) => {
  try {
    const { role, isActive, search } = req.query;
    const where = {
      schoolId: req.user.schoolId,
      ...(role && { role }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && { email: { contains: search, mode: 'insensitive' } }),
    };
    const users = await prisma.user.findMany({
      where,
      select: { id: true, email: true, phone: true, role: true, isActive: true, profilePicUrl: true, lastLogin: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(new ApiResponse(200, users));
  } catch (e) { next(e); }
});

// GET single user
router.get('/:id', authenticate, ownOrAdmin('SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        teacherProfile: true, studentProfile: true,
        staffProfile: true, principalProfile: true, parentProfile: true,
        school: { select: { name: true, code: true } },
      }
    });
    if (!user) throw new ApiError(404, 'User not found');
    const { passwordHash, ...safe } = user;
    return res.json(new ApiResponse(200, safe));
  } catch (e) { next(e); }
});

// PATCH activate/deactivate
router.patch('/:id/toggle-active', authenticate, authorize('SUPER_ADMIN','PRINCIPAL'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new ApiError(404, 'User not found');
    const updated = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !user.isActive } });
    return res.json(new ApiResponse(200, { isActive: updated.isActive }, 'User status updated'));
  } catch (e) { next(e); }
});

// PATCH update profile picture
router.patch('/:id/profile-pic', authenticate, ownOrAdmin('SUPER_ADMIN','PRINCIPAL'), async (req, res, next) => {
  try {
    const { profilePicUrl } = req.body;
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { profilePicUrl } });
    return res.json(new ApiResponse(200, { profilePicUrl: user.profilePicUrl }));
  } catch (e) { next(e); }
});

// GET audit logs for a user
router.get('/:id/audit', authenticate, authorize('SUPER_ADMIN','PRINCIPAL'), async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json(new ApiResponse(200, logs));
  } catch (e) { next(e); }
});

module.exports = router;
