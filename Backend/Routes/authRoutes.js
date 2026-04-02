// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, refreshToken, getMe, updatePassword } = require('../Controller/Auth/authController');
const { protect } = require('../MiddleWare/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;