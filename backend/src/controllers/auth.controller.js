// backend/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../prisma/client');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');

const generateTokens = (userId, role, schoolId) => {
  const accessToken = jwt.sign(
    { userId, role, schoolId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password, schoolCode } = req.body;

    if (!email || !password) throw new ApiError(400, 'Email and password required');

    // Find school if code provided
    let schoolId;
    if (schoolCode) {
      const school = await prisma.school.findUnique({ where: { code: schoolCode } });
      if (!school || !school.isActive) throw new ApiError(404, 'School not found or inactive');
      schoolId = school.id;
    }

    // Find user
    const whereClause = schoolId 
      ? { email, schoolId } 
      : { email };

    const user = await prisma.user.findFirst({
      where: { ...whereClause, isActive: true },
      include: {
        school: { select: { id: true, name: true, code: true, logoUrl: true, aiProvider: true } },
        teacherProfile: { select: { firstName: true, lastName: true } },
        studentProfile: { select: { firstName: true, lastName: true, admissionNo: true } },
        staffProfile: { select: { firstName: true, lastName: true } },
        principalProfile: { select: { firstName: true, lastName: true } },
        parentProfile: { select: { fatherName: true, motherName: true } },
      }
    });

    if (!user) throw new ApiError(401, 'Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new ApiError(401, 'Invalid credentials');

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.schoolId);

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        resource: 'Auth',
        ip: req.ip,
      }
    });

    const profile = user.teacherProfile || user.studentProfile || 
                    user.staffProfile || user.principalProfile || 
                    user.parentProfile;

    const displayName = profile 
      ? (profile.firstName 
          ? `${profile.firstName} ${profile.lastName || ''}`
          : profile.fatherName || 'User')
      : user.email;

    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(200).json(new ApiResponse(200, {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        profilePicUrl: user.profilePicUrl,
        displayName,
        school: user.school,
      }
    }, 'Login successful'));
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) throw new ApiError(401, 'Refresh token required');

    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      decoded.userId, stored.user.role, stored.user.schoolId
    );

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token } });
    await prisma.refreshToken.create({
      data: {
        userId: decoded.userId,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    res.cookie('refreshToken', newRefreshToken, cookieOptions);
    return res.status(200).json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/logout
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }
    res.clearCookie('refreshToken');
    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new ApiError(400, 'Current password incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId } });

    return res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        school: { select: { id: true, name: true, code: true, logoUrl: true, boardType: true } },
        teacherProfile: true,
        studentProfile: { include: { class: true, parent: true } },
        staffProfile: true,
        principalProfile: true,
        parentProfile: { include: { children: { include: { class: true } } } },
      }
    });

    return res.status(200).json(new ApiResponse(200, user, 'User fetched'));
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/create-user (Admin only)
const createUser = async (req, res, next) => {
  try {
    const { email, password, role, schoolId, profileData, phone } = req.body;

    // School admins can only create within their school
    const targetSchoolId = req.user.role === 'SUPER_ADMIN' ? schoolId : req.user.schoolId;

    const existing = await prisma.user.findFirst({
      where: { email, schoolId: targetSchoolId }
    });
    if (existing) throw new ApiError(409, 'User with this email already exists in this school');

    const passwordHash = await bcrypt.hash(password || 'Welcome@123', 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email, phone, passwordHash, role,
          schoolId: targetSchoolId,
        }
      });

      // Create role-specific profile
      if (profileData) {
        switch (role) {
          case 'TEACHER':
          case 'VICE_PRINCIPAL':
            await tx.teacher.create({ data: { userId: newUser.id, ...profileData } });
            break;
          case 'PRINCIPAL':
            await tx.principal.create({ data: { userId: newUser.id, ...profileData } });
            break;
          case 'STAFF':
          case 'WATCHMAN':
          case 'PEON':
            await tx.staff.create({ data: { userId: newUser.id, staffType: role === 'WATCHMAN' ? 'WATCHMAN' : role === 'PEON' ? 'PEON' : 'OTHER', ...profileData } });
            break;
          case 'STUDENT':
            await tx.student.create({ data: { userId: newUser.id, ...profileData } });
            break;
          case 'PARENT':
            await tx.parent.create({ data: { userId: newUser.id, ...profileData } });
            break;
        }
      }

      return newUser;
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        resource: 'User',
        resourceId: user.id,
        details: { role, email },
      }
    });

    return res.status(201).json(new ApiResponse(201, { id: user.id, email, role }, 'User created successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = { login, refreshToken, logout, changePassword, getMe, createUser };
