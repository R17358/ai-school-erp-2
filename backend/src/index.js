// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { prisma } = require('./prisma/client');

// Route imports
const authRoutes = require('./routes/auth.routes');
const schoolRoutes = require('./routes/school.routes');
const userRoutes = require('./routes/user.routes');
const studentRoutes = require('./routes/student.routes');
const teacherRoutes = require('./routes/teacher.routes');
const staffRoutes = require('./routes/staff.routes');
const classRoutes = require('./routes/class.routes');
const subjectRoutes = require('./routes/subject.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const timetableRoutes = require('./routes/timetable.routes');
const examRoutes = require('./routes/exam.routes');
const resultRoutes = require('./routes/result.routes');
const feesRoutes = require('./routes/fees.routes');
const salaryRoutes = require('./routes/salary.routes');
const leaveRoutes = require('./routes/leave.routes');
const noticeRoutes = require('./routes/notice.routes');
const holidayRoutes = require('./routes/holiday.routes');
const aiRoutes = require('./routes/ai.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');
const academicYearRoutes = require('./routes/academic-year.routes');

const app = express();

// ─── Security Middleware ────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// ─── Rate Limiting ─────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts.' }
});
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// ─── General Middleware ─────────────────────────────
app.use(compression());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Health Check ────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SchoolSphere API', version: '1.0.0', timestamp: new Date() });
});

// ─── API Routes ─────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/schools`, schoolRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/students`, studentRoutes);
app.use(`${API}/teachers`, teacherRoutes);
app.use(`${API}/staff`, staffRoutes);
app.use(`${API}/classes`, classRoutes);
app.use(`${API}/subjects`, subjectRoutes);
app.use(`${API}/attendance`, attendanceRoutes);
app.use(`${API}/timetable`, timetableRoutes);
app.use(`${API}/exams`, examRoutes);
app.use(`${API}/results`, resultRoutes);
app.use(`${API}/fees`, feesRoutes);
app.use(`${API}/salary`, salaryRoutes);
app.use(`${API}/leaves`, leaveRoutes);
app.use(`${API}/notices`, noticeRoutes);
app.use(`${API}/holidays`, holidayRoutes);
app.use(`${API}/ai`, aiRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/academic-years`, academicYearRoutes);

// ─── 404 Handler ─────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function main() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');

    app.listen(PORT, () => {
      logger.info(`🚀 SchoolSphere API running on port ${PORT}`);
      logger.info(`📚 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
