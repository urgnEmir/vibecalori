const express = require('express');
const router = express.Router();
const { logMacros, getTodayMacros } = require('../controllers/macro.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// POST /api/macros/log - log a meal's macros
router.post('/log', verifyToken, logMacros);

// GET /api/macros/today - get today's macro log
router.get('/today', verifyToken, getTodayMacros);

module.exports = router;
