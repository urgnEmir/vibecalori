const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const router = express.Router();
// Kişi 2: Buraya userController import et

// GET /api/user/profile
router.get('/profile', verifyToken, (req, res) => {
  // TODO: Kişi 2 - Kullanıcı profili getir
  res.status(200).json({ message: 'Profile endpoint - Kişi 2' });
});

// PUT /api/user/profile
router.put('/profile', verifyToken, (req, res) => {
  // TODO: Kişi 2 - Profili güncelle
  res.status(200).json({ message: 'Update profile - Kişi 2' });
});

// GET /api/user/trackers
router.get('/trackers', verifyToken, (req, res) => {
  // TODO: Kişi 2 - Tüm takipleri listele
  res.status(200).json({ message: 'Get all trackers - Kişi 2' });
});

module.exports = router;
