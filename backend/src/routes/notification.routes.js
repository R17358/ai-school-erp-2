// backend/src/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return res.json(new ApiResponse(200, notifications));
  } catch (e) { next(e); }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    return res.json(new ApiResponse(200, null, 'Marked as read'));
  } catch (e) { next(e); }
});

router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    return res.json(new ApiResponse(200, null, 'All marked as read'));
  } catch (e) { next(e); }
});

module.exports = router;
