// backend/src/routes/leave.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, checkPermission } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');
const axios = require('axios');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const isAdmin = ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'].includes(req.user.role);
    const where = isAdmin
      ? { requester: { schoolId: req.user.schoolId } }
      : { requesterId: req.user.id };

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        leaveType: true,
        requester: {
          include: {
            teacherProfile: { select: { firstName: true, lastName: true } },
            staffProfile: { select: { firstName: true, lastName: true } },
          }
        },
        approver: { include: { teacherProfile: true, principalProfile: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });
    return res.json(new ApiResponse(200, leaves));
  } catch (e) { next(e); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Get AI suggestion
    let aiSuggestion = null;
    try {
      const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/ai/chat/message`, {
        messages: [{ role: 'user', content: `Should I approve a leave request for ${days} day(s) starting ${startDate}? Reason: ${reason}. Give a brief recommendation.` }],
        user_role: req.user.role,
      }, { headers: { 'X-Service-Key': process.env.AI_SERVICE_KEY }, timeout: 10000 });
      aiSuggestion = aiRes.data?.response;
    } catch {}

    const leave = await prisma.leave.create({
      data: { requesterId: req.user.id, leaveTypeId, startDate: start, endDate: end, days, reason, aiSuggestion },
      include: { leaveType: true }
    });
    return res.status(201).json(new ApiResponse(201, leave, 'Leave application submitted'));
  } catch (e) { next(e); }
});

router.patch('/:id/approve', authenticate, checkPermission('leaves', 'update'), async (req, res, next) => {
  try {
    const { note } = req.body;
    const leave = await prisma.leave.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', approverId: req.user.id, approvalNote: note, respondedAt: new Date() },
    });
    return res.json(new ApiResponse(200, leave, 'Leave approved'));
  } catch (e) { next(e); }
});

router.patch('/:id/reject', authenticate, checkPermission('leaves', 'update'), async (req, res, next) => {
  try {
    const { note } = req.body;
    const leave = await prisma.leave.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', approverId: req.user.id, approvalNote: note, respondedAt: new Date() },
    });
    return res.json(new ApiResponse(200, leave, 'Leave rejected'));
  } catch (e) { next(e); }
});

module.exports = router;
