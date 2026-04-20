// backend/src/routes/timetable.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, checkPermission, sameSchool } = require('../middleware/auth.middleware');
const { getTimetable, generateAITimetable, saveManualTimetable, getTeacherTimetable } = require('../controllers/timetable.controller');

router.get('/teacher/:teacherId', authenticate, getTeacherTimetable);
router.get('/:classId', authenticate, checkPermission('timetable', 'read'), getTimetable);
router.post('/generate-ai', authenticate, checkPermission('timetable', 'create'), generateAITimetable);
router.post('/manual', authenticate, checkPermission('timetable', 'create'), saveManualTimetable);

module.exports = router;
