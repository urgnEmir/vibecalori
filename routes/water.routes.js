const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const router = express.Router();
// Kişi 3: Buraya waterController import et

// POST /api/water/create
router.post('/create', verifyToken, (req, res) => {
  // TODO: Kişi 3 - Yeni su takibi oluştur
  res.status(201).json({ message: 'Water tracker created - Kişi 3' });
});

// GET /api/water/:id
router.get('/:id', verifyToken, (req, res) => {
  // TODO: Kişi 3 - Spesifik su takibini getir
  res.status(200).json({ message: 'Get water tracker - Kişi 3' });
});

// POST /api/water/:id/log
router.post('/:id/log', verifyToken, (req, res) => {
  // TODO: Kişi 3 - Su içme kaydı ekle
  res.status(201).json({ message: 'Water log added - Kişi 3' });
});

module.exports = router;
