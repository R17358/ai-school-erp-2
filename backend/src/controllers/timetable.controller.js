// backend/src/controllers/timetable.controller.js
const axios = require('axios');
const { prisma } = require('../prisma/client');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');

// GET /api/v1/timetable/:classId
const getTimetable = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const timetable = await prisma.timetable.findUnique({
      where: { classId },
      include: {
        slots: {
          include: {
            subject: true,
            teacher: { select: { firstName: true, lastName: true } },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { periodNo: 'asc' }]
        }
      }
    });
    return res.status(200).json(new ApiResponse(200, timetable, 'Timetable fetched'));
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/timetable/generate-ai (AI-powered generation)
const generateAITimetable = async (req, res, next) => {
  try {
    const { classIds, periodsPerDay = 8, schoolTimings, breaks } = req.body;
    const schoolId = req.user.schoolId;

    // Gather all data needed for AI
    const [classes, teachers, subjects] = await Promise.all([
      prisma.class.findMany({
        where: { id: { in: classIds }, schoolId },
        include: { subjects: { include: { subject: true } } }
      }),
      prisma.teacher.findMany({
        where: { user: { schoolId } },
        include: {
          subjects: { include: { subject: true } },
          user: { select: { id: true, isActive: true } }
        }
      }),
      prisma.subject.findMany({ where: { schoolId } })
    ]);

    const activeTeachers = teachers.filter(t => t.user.isActive);

    // Prepare payload for AI microservice
    const aiPayload = {
      school_id: schoolId,
      classes: classes.map(c => ({
        id: c.id,
        name: `${c.name}-${c.section}`,
        subjects: c.subjects.map(cs => ({
          id: cs.subjectId,
          name: cs.subject.name,
          weeklyHours: cs.subject.weeklyHours || 4,
          type: cs.subject.type,
        }))
      })),
      teachers: activeTeachers.map(t => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
        subjects: t.subjects.map(ts => ts.subjectId),
        maxPeriodsPerDay: 6,
      })),
      periods_per_day: periodsPerDay,
      school_timings: schoolTimings || { start: '09:00', end: '15:30' },
      breaks: breaks || [
        { after_period: 2, duration: 10, label: 'Short Break' },
        { after_period: 4, duration: 30, label: 'Lunch Break' },
      ],
      working_days: [0, 1, 2, 3, 4], // Mon-Fri
    };

    // Call AI microservice
    const aiResponse = await axios.post(
      `${process.env.AI_SERVICE_URL}/ai/timetable/generate`,
      aiPayload,
      { headers: { 'X-Service-Key': process.env.AI_SERVICE_KEY }, timeout: 120000 }
    );

    const { timetables } = aiResponse.data;

    // Save generated timetables to DB
    const savedTimetables = await prisma.$transaction(
      timetables.map(tt => {
        return prisma.timetable.upsert({
          where: { classId: tt.classId },
          create: {
            classId: tt.classId,
            generatedBy: 'AI',
            slots: {
              create: tt.slots.map(slot => ({
                dayOfWeek: slot.dayOfWeek,
                periodNo: slot.periodNo,
                startTime: slot.startTime,
                endTime: slot.endTime,
                subjectId: slot.subjectId || null,
                teacherId: slot.teacherId || null,
                isBreak: slot.isBreak || false,
                breakLabel: slot.breakLabel || null,
              }))
            }
          },
          update: {
            generatedBy: 'AI',
            updatedAt: new Date(),
            slots: {
              deleteMany: {},
              create: tt.slots.map(slot => ({
                dayOfWeek: slot.dayOfWeek,
                periodNo: slot.periodNo,
                startTime: slot.startTime,
                endTime: slot.endTime,
                subjectId: slot.subjectId || null,
                teacherId: slot.teacherId || null,
                isBreak: slot.isBreak || false,
                breakLabel: slot.breakLabel || null,
              }))
            }
          }
        });
      })
    );

    // Log AI session
    await prisma.aISession.create({
      data: {
        schoolId,
        userId: req.user.id,
        type: 'timetable',
        input: aiPayload,
        output: aiResponse.data,
        modelUsed: aiResponse.data.model_used || 'unknown',
        tokensUsed: aiResponse.data.tokens_used || 0,
      }
    });

    return res.status(200).json(new ApiResponse(200, {
      timetables: savedTimetables,
      stats: aiResponse.data.stats,
    }, 'AI Timetable generated successfully'));
  } catch (error) {
    if (error.response?.status) {
      return next(new ApiError(error.response.status, error.response.data?.detail || 'AI service error'));
    }
    next(error);
  }
};

// POST /api/v1/timetable/manual
const saveManualTimetable = async (req, res, next) => {
  try {
    const { classId, slots } = req.body;

    const timetable = await prisma.timetable.upsert({
      where: { classId },
      create: {
        classId,
        generatedBy: 'MANUAL',
        slots: { create: slots }
      },
      update: {
        generatedBy: 'MANUAL',
        updatedAt: new Date(),
        slots: {
          deleteMany: {},
          create: slots,
        }
      },
      include: { slots: { include: { subject: true, teacher: true } } }
    });

    return res.status(200).json(new ApiResponse(200, timetable, 'Timetable saved'));
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/timetable/teacher/:teacherId
const getTeacherTimetable = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const slots = await prisma.timetableSlot.findMany({
      where: { teacherId },
      include: {
        subject: true,
        timetable: { include: { class: { select: { name: true, section: true } } } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNo: 'asc' }]
    });
    return res.status(200).json(new ApiResponse(200, slots, 'Teacher timetable fetched'));
  } catch (error) {
    next(error);
  }
};

module.exports = { getTimetable, generateAITimetable, saveManualTimetable, getTeacherTimetable };
