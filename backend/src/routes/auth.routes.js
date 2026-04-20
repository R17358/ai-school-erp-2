// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { login, refreshToken, logout, changePassword, getMe, createUser } = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);
router.post('/create-user', authenticate, authorize('SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'), createUser);

module.exports = router;
