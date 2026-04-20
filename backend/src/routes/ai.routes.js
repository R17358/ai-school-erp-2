// backend/src/routes/ai.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');
const axios = require('axios');

const aiProxy = async (endpoint, body, schoolId) => {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { aiProvider: true, aiApiKey: true }
  });
  const payload = {
    ...body,
    provider: school?.aiProvider || process.env.DEFAULT_AI_PROVIDER,
    api_key: school?.aiApiKey || process.env.DEFAULT_AI_API_KEY,
  };
  const res = await axios.post(`${process.env.AI_SERVICE_URL}${endpoint}`, payload, {
    headers: { 'X-Service-Key': process.env.AI_SERVICE_KEY },
    timeout: 120000,
  });
  return res.data;
};

// Chat
router.post('/chat', authenticate, async (req, res, next) => {
  try {
    const data = await aiProxy('/ai/chat/message', {
      ...req.body,
      user_role: req.user.role,
      school_context: req.body.school_context,
    }, req.user.schoolId);
    return res.json(new ApiResponse(200, data));
  } catch (e) {
    if (e.response) return next(new ApiError(e.response.status, e.response.data?.detail || 'AI error'));
    next(e);
  }
});

// Generate Question Paper
router.post('/generate-qp', authenticate, async (req, res, next) => {
  try {
    const data = await aiProxy('/ai/qp/generate', req.body, req.user.schoolId);
    await prisma.aISession.create({
      data: { schoolId: req.user.schoolId, userId: req.user.id, type: 'qp', input: req.body, output: data, modelUsed: 'gemini' }
    }).catch(() => {});
    return res.json(new ApiResponse(200, data));
  } catch (e) {
    if (e.response) return next(new ApiError(e.response.status, e.response.data?.detail || 'QP generation failed'));
    next(e);
  }
});

// Generate Notes
router.post('/generate-notes', authenticate, async (req, res, next) => {
  try {
    const { subject, topic, class_name, detail_level } = req.body;
    const data = await aiProxy('/ai/notes/generate', { subject, topic, class_name, detail_level }, req.user.schoolId);
    return res.json(new ApiResponse(200, data));
  } catch (e) {
    if (e.response) return next(new ApiError(e.response.status, e.response.data?.detail || 'Notes generation failed'));
    next(e);
  }
});

// Study Plan
router.post('/study-plan', authenticate, async (req, res, next) => {
  try {
    const data = await aiProxy('/ai/study/plan', req.body, req.user.schoolId);
    return res.json(new ApiResponse(200, data));
  } catch (e) {
    if (e.response) return next(new ApiError(e.response.status, e.response.data?.detail || 'Study plan failed'));
    next(e);
  }
});

// Result Analysis
router.post('/analyze-results', authenticate, async (req, res, next) => {
  try {
    const data = await aiProxy('/ai/results/analyze', req.body, req.user.schoolId);
    return res.json(new ApiResponse(200, data));
  } catch (e) {
    if (e.response) return next(new ApiError(e.response.status, e.response.data?.detail || 'Analysis failed'));
    next(e);
  }
});

// Timetable Generation (proxied through here too)
router.post('/generate-timetable', authenticate, async (req, res, next) => {
  try {
    const data = await aiProxy('/ai/timetable/generate', req.body, req.user.schoolId);
    return res.json(new ApiResponse(200, data));
  } catch (e) {
    if (e.response) return next(new ApiError(e.response.status, e.response.data?.detail || 'Timetable generation failed'));
    next(e);
  }
});

// AI Sessions history
router.get('/sessions', authenticate, async (req, res, next) => {
  try {
    const sessions = await prisma.aISession.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json(new ApiResponse(200, sessions));
  } catch (e) { next(e); }
});

module.exports = router;
