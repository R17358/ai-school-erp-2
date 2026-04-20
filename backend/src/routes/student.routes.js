// backend/src/routes/student.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, checkPermission, sameSchool } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

// GET /students
router.get('/', authenticate, sameSchool, checkPermission('students', 'read'), async (req, res, next) => {
  try {
    const { search, classId, gender, page = 1, limit = 15 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      user: { schoolId: req.user.schoolId },
      ...(gender && { gender }),
      ...(classId && { classId }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { admissionNo: { contains: search, mode: 'insensitive' } },
          { rollNo: { contains: search, mode: 'insensitive' } },
        ]
      }),
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where, skip, take: Number(limit),
        include: {
          user: { select: { email: true, phone: true, isActive: true, profilePicUrl: true } },
          class: { select: { name: true, section: true } },
        },
        orderBy: [{ class: { name: 'asc' } }, { rollNo: 'asc' }],
      }),
      prisma.student.count({ where }),
    ]);

    return res.json(new ApiResponse(200, { students, total, page: Number(page), limit: Number(limit) }));
  } catch (e) { next(e); }
});

// GET /students/:id
router.get('/:id', authenticate, sameSchool, checkPermission('students', 'read'), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { email: true, phone: true, isActive: true, profilePicUrl: true, lastLogin: true } },
        class: true,
        parent: true,
        attendance: { take: 30, orderBy: { date: 'desc' } },
        feeCollections: { include: { feeStructure: true }, take: 12 },
        documents: true,
      }
    });
    if (!student) throw new ApiError(404, 'Student not found');
    return res.json(new ApiResponse(200, student));
  } catch (e) { next(e); }
});

// POST /students
router.post('/', authenticate, sameSchool, checkPermission('students', 'create'), async (req, res, next) => {
  try {
    const { email, phone, password, role, profileData } = req.body;
    const passwordHash = await bcrypt.hash(password || 'Welcome@123', 12);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({ where: { email, schoolId: req.user.schoolId } });
      if (existing) throw new ApiError(409, 'Email already exists');

      const user = await tx.user.create({
        data: { email, phone, passwordHash, role: 'STUDENT', schoolId: req.user.schoolId }
      });
      const student = await tx.student.create({ data: { userId: user.id, ...profileData } });
      return student;
    });

    return res.status(201).json(new ApiResponse(201, result, 'Student created'));
  } catch (e) { next(e); }
});

// PUT /students/:id
router.put('/:id', authenticate, sameSchool, checkPermission('students', 'update'), async (req, res, next) => {
  try {
    const { profileData, phone, isActive } = req.body;
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: profileData,
      include: { user: true, class: true }
    });
    if (phone !== undefined || isActive !== undefined) {
      await prisma.user.update({ where: { id: student.userId }, data: { phone, isActive } });
    }
    return res.json(new ApiResponse(200, student, 'Student updated'));
  } catch (e) { next(e); }
});

// DELETE /students/:id
router.delete('/:id', authenticate, checkPermission('students', 'delete'), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!student) throw new ApiError(404, 'Student not found');
    await prisma.user.update({ where: { id: student.userId }, data: { isActive: false } });
    return res.json(new ApiResponse(200, null, 'Student deactivated'));
  } catch (e) { next(e); }
});

module.exports = router;
