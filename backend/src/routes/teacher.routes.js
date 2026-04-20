// backend/src/routes/teacher.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, checkPermission, sameSchool } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');

router.get('/', authenticate, sameSchool, checkPermission('teachers', 'read'), async (req, res, next) => {
  try {
    const { search, departmentId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      user: { schoolId: req.user.schoolId, isActive: true },
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { specialization: { contains: search, mode: 'insensitive' } },
        ]
      }),
    };
    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where, skip, take: Number(limit),
        include: {
          user: { select: { email: true, phone: true, isActive: true, profilePicUrl: true } },
          department: true,
          designation: true,
          subjects: { include: { subject: true } },
        },
        orderBy: { firstName: 'asc' },
      }),
      prisma.teacher.count({ where }),
    ]);
    return res.json(new ApiResponse(200, { teachers, total }));
  } catch (e) { next(e); }
});

router.get('/:id', authenticate, checkPermission('teachers', 'read'), async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { email: true, phone: true, isActive: true, profilePicUrl: true, lastLogin: true } },
        department: true, designation: true,
        subjects: { include: { subject: true } },
        classTeacherOf: true,
        timetableSlots: { include: { subject: true, timetable: { include: { class: true } } }, take: 40 },
        salarySlips: { take: 12, orderBy: [{ year: 'desc' }, { month: 'desc' }] },
      }
    });
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    return res.json(new ApiResponse(200, teacher));
  } catch (e) { next(e); }
});

router.post('/', authenticate, sameSchool, checkPermission('teachers', 'create'), async (req, res, next) => {
  try {
    const { email, phone, password, profileData, subjectIds } = req.body;
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password || 'Welcome@123', 12);
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({ where: { email, schoolId: req.user.schoolId } });
      if (existing) throw new ApiError(409, 'Email already in use');
      const user = await tx.user.create({ data: { email, phone, passwordHash, role: 'TEACHER', schoolId: req.user.schoolId } });
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id, ...profileData,
          ...(subjectIds?.length && { subjects: { create: subjectIds.map(sid => ({ subjectId: sid })) } }),
        }
      });
      return teacher;
    });
    return res.status(201).json(new ApiResponse(201, result, 'Teacher created'));
  } catch (e) { next(e); }
});

router.put('/:id', authenticate, checkPermission('teachers', 'update'), async (req, res, next) => {
  try {
    const { profileData, subjectIds } = req.body;
    const teacher = await prisma.teacher.update({ where: { id: req.params.id }, data: profileData });
    if (subjectIds) {
      await prisma.teacherSubject.deleteMany({ where: { teacherId: req.params.id } });
      if (subjectIds.length) {
        await prisma.teacherSubject.createMany({ data: subjectIds.map(sid => ({ teacherId: req.params.id, subjectId: sid })) });
      }
    }
    return res.json(new ApiResponse(200, teacher, 'Teacher updated'));
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, checkPermission('teachers', 'delete'), async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: req.params.id } });
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    await prisma.user.update({ where: { id: teacher.userId }, data: { isActive: false } });
    return res.json(new ApiResponse(200, null, 'Teacher deactivated'));
  } catch (e) { next(e); }
});

module.exports = router;
