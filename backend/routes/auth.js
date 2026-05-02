const express = require('express');
const router = express.Router();
const { login, loginValidation } = require('../controllers/authController');

// POST /api/login
router.post('/login', loginValidation, login);

module.exports = router;
