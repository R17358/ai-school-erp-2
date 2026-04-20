// backend/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { prisma } = require('../prisma/client');
const { ApiError } = require('../utils/ApiError');

// ─── Role Hierarchy ─────────────────────────────────
const ROLE_HIERARCHY = {
  SUPER_ADMIN: 100,
  PRINCIPAL: 90,
  VICE_PRINCIPAL: 80,
  TEACHER: 50,
  STAFF: 40,
  WATCHMAN: 20,
  PEON: 20,
  PARENT: 15,
  STUDENT: 10,
};

// ─── Permission Matrix ─────────────────────────────────
// Format: resource -> { action: [roles_allowed] }
const PERMISSIONS = {
  users: {
    create: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'],
    read: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'STAFF'],
    update: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'],
    delete: ['SUPER_ADMIN', 'PRINCIPAL'],
  },
  students: {
    create: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'STAFF'],
    read: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT'],
    update: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'STAFF'],
    delete: ['SUPER_ADMIN', 'PRINCIPAL'],
  },
  teachers: {
    create: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'],
    read: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT'],
    update: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'],
    delete: ['SUPER_ADMIN', 'PRINCIPAL'],
  },
  staff: {
    create: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'],
    read: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'],
    update: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'],
    delete: ['SUPER_ADMIN', 'PRINCIPAL'],
  },
  attendance: {
    create: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER'],
    read: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT'],
    update: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER'],
    delete: ['SUPER_ADMIN', 'PRINCIPAL'],
  },
  timetable: {
    create: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'],
    read: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT', 'STAFF'],
    update: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'],
    delete: ['SUPER_ADMIN', 'PRINCIPAL'],
  },
  exams: {
    create: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'],
    read: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'],
    update: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER'],
    delete: ['SUPER_ADMIN', 'PRINCIPAL'],
  },
  results: {
    create: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER'],
    read: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'],
    update: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER'],
    delete: ['SUPER_ADMIN', 'PRINCIPAL'],
  },
  fees: {
    create: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'STAFF'],
    read: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'STAFF', 'STUDENT', 'PARENT'],
    update: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'STAFF'],
    delete: ['SUPER_ADMIN', 'PRINCIPAL'],
  },
  salary: {
    create: ['SUPER_ADMIN', 'PRINCIPAL'],
    read: ['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'STAFF', 'WATCHMAN', 'PEON'],
    update: ['SUPER_ADMIN', 'PRINCIPAL'],
    delete: ['SUPER_ADMIN', 'PRINCIPAL'],
  },
  leaves: {
    create: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'STAFF', 'WATCHMAN', 'PEON'],
    read: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'STAFF', 'WATCHMAN', 'PEON'],
    update: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'], // approvals
    delete: ['SUPER_ADMIN', 'PRINCIPAL'],
  },
  notices: {
    create: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER'],
    read: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT', 'WATCHMAN', 'PEON'],
    update: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'],
    delete: ['SUPER_ADMIN', 'PRINCIPAL'],
  },
  school: {
    create: ['SUPER_ADMIN'],
    read: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'STAFF'],
    update: ['SUPER_ADMIN', 'PRINCIPAL'],
    delete: ['SUPER_ADMIN'],
  },
};

// ─── Middleware: Verify JWT ─────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;
    if (!token) throw new ApiError(401, 'Access token required');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true, schoolId: true, email: true, role: true,
        isActive: true, profilePicUrl: true,
      }
    });

    if (!user || !user.isActive) throw new ApiError(401, 'User not found or inactive');

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    if (error.name === 'TokenExpiredError') return next(new ApiError(401, 'Token expired'));
    next(new ApiError(401, 'Invalid token'));
  }
};

// ─── Middleware: Authorize Roles ─────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Role ${req.user.role} is not authorized for this action`));
    }
    next();
  };
};

// ─── Middleware: Check Permission Matrix ─────────────────────────────────
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    
    const allowed = PERMISSIONS[resource]?.[action] || [];
    if (!allowed.includes(req.user.role)) {
      return next(new ApiError(403, `You don't have ${action} permission on ${resource}`));
    }
    next();
  };
};

// ─── Middleware: Same School Check ─────────────────────────────────
const sameSchool = async (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN') return next();
  
  const targetSchoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;
  if (targetSchoolId && targetSchoolId !== req.user.schoolId) {
    return next(new ApiError(403, 'Access denied: different school'));
  }
  
  // Auto-inject school ID for non-super-admins
  req.body.schoolId = req.user.schoolId;
  next();
};

// ─── Middleware: Own Resource Check ─────────────────────────────────
const ownOrAdmin = (...adminRoles) => {
  return (req, res, next) => {
    const isAdmin = adminRoles.includes(req.user.role);
    const isOwn = req.params.userId === req.user.id;
    
    if (isAdmin || isOwn) return next();
    next(new ApiError(403, 'Access denied'));
  };
};

module.exports = { 
  authenticate, 
  authorize, 
  checkPermission,
  sameSchool,
  ownOrAdmin,
  ROLE_HIERARCHY, 
  PERMISSIONS 
};
