const express = require('express');
const router = express.Router();
const { calculateMacros, saveTargets, getTargets } = require('../controllers/nutritive.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// POST /api/nutritive/calculate
router.post('/calculate', calculateMacros);

// POST /api/nutritive/targets - save computed targets for the authenticated user
router.post('/targets', verifyToken, saveTargets);

// GET /api/nutritive/targets - get saved targets for the authenticated user
router.get('/targets', verifyToken, getTargets);

module.exports = router;
