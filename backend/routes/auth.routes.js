const express = require('express');
const router = express.Router();
// Kişi 1: Buraya authController import et ve endpoints'i oluştur

// POST /api/auth/register
router.post('/register', (req, res) => {
  // TODO: Kişi 1 - Register logic
  res.status(200).json({ message: 'Register endpoint - Kişi 1' });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  // TODO: Kişi 1 - Login logic ve JWT token döndür
  res.status(200).json({ message: 'Login endpoint - Kişi 1' });
});

module.exports = router;
