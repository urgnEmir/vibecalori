const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const router = express.Router();
const { createWaterTracker, getWaterTracker, logWater } = require('../controllers/water.controller');

// POST /api/water/create
router.post('/create', verifyToken, createWaterTracker);

// GET /api/water/:id
router.get('/:id', verifyToken, getWaterTracker);

// POST /api/water/:id/log
router.post('/:id/log', verifyToken, logWater);

module.exports = router;
