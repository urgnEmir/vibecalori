const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getProfile,
  updateProfile,
  updateAvatar,
  removeAvatar,
  getUserStats,
  changePassword,
  logout,
} = require('../controllers/user.controller');

const router = express.Router();

// ===========================
// Profil Endpointleri
// ===========================

// GET /api/user/profile - Profil bilgilerini getir
router.get('/profile', verifyToken, getProfile);

// PUT /api/user/profile - Profil bilgilerini güncelle
router.put('/profile', verifyToken, updateProfile);

// ===========================
// Avatar Endpointleri
// ===========================

// PUT /api/user/avatar - Avatar URL'sini güncelle
router.put('/avatar', verifyToken, updateAvatar);

// DELETE /api/user/avatar - Avatar'ı sil
router.delete('/avatar', verifyToken, removeAvatar);

// ===========================
// İstatistik Endpointleri
// ===========================

// GET /api/user/stats - Kullanıcı istatistiklerini getir
router.get('/stats', verifyToken, getUserStats);

// ===========================
// Güvenlik Endpointleri
// ===========================

// PUT /api/user/change-password - Şifre değiştir
router.put('/change-password', verifyToken, changePassword);

// POST /api/user/logout - Çıkış yap
router.post('/logout', verifyToken, logout);

module.exports = router;
