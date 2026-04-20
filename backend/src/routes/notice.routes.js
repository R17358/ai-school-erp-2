// backend/src/routes/notice.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, checkPermission, sameSchool } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');

router.get('/', authenticate, sameSchool, async (req, res, next) => {
  try {
    const notices = await prisma.notice.findMany({
      where: {
        schoolId: req.user.schoolId,
        OR: [
          { audience: { has: 'ALL' } },
          { audience: { has: req.user.role } },
        ],
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      orderBy: [{ isUrgent: 'desc' }, { publishedAt: 'desc' }],
    });
    return res.json(new ApiResponse(200, notices));
  } catch (e) { next(e); }
});

router.post('/', authenticate, checkPermission('notices', 'create'), async (req, res, next) => {
  try {
    const { title, content, audience, isUrgent, expiresAt, attachmentUrl } = req.body;
    const notice = await prisma.notice.create({
      data: { schoolId: req.user.schoolId, title, content, audience, isUrgent, expiresAt: expiresAt ? new Date(expiresAt) : null, attachmentUrl, postedBy: req.user.id }
    });
    return res.status(201).json(new ApiResponse(201, notice, 'Notice posted'));
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, checkPermission('notices', 'delete'), async (req, res, next) => {
  try {
    await prisma.notice.delete({ where: { id: req.params.id } });
    return res.json(new ApiResponse(200, null, 'Notice deleted'));
  } catch (e) { next(e); }
});

module.exports = router;
