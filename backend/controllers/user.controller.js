const User = require('../models/user.model');
const Water = require('../models/water.model');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ===========================
// Helper Fonksiyonları
// ===========================

// Gün başlangıcını hesapla
function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Profil tamamlanma yüzdesini hesapla (0-100)
function calculateProfileCompletion(user) {
  const fields = [
    'age',
    'height',
    'weight',
    'dailyCalorieGoal',
    'dailyWaterGoal',
    'avatarUrl',
    'theme'
  ];

  let completedFields = 0;
  for (const field of fields) {
    if (user[field]) completedFields++;
  }

  // Notifications alt alanları
  if (user.notifications && typeof user.notifications === 'object') {
    if (user.notifications.push !== undefined) completedFields++;
    if (user.notifications.email !== undefined) completedFields++;
    if (user.notifications.reminders !== undefined) completedFields++;
  }

  const totalFields = fields.length + 3; // 7 + 3 notification fields
  return Math.round((completedFields / totalFields) * 100);
}

// ===========================
// Profil Fonksiyonları
// ===========================

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const user = await User.findById(userId).select('-passwordHash -__v');
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    // Güncellenebilir alanlar
    const allowedNumericFields = ['age', 'height', 'weight', 'dailyCalorieGoal', 'dailyWaterGoal'];
    const allowedStringFields = ['theme'];
    const updates = {};

    // Numeric alanları valide et
    for (const key of allowedNumericFields) {
      if (req.body[key] !== undefined) {
        const val = Number(req.body[key]);
        if (isNaN(val)) {
          return res.status(400).json({ success: false, error: { message: `${key} must be a number` } });
        }
        if (val < 0) {
          return res.status(400).json({ success: false, error: { message: `${key} must be positive` } });
        }
        updates[key] = val;
      }
    }

    // String alanları valide et
    for (const key of allowedStringFields) {
      if (req.body[key] !== undefined) {
        if (key === 'theme' && !['light', 'dark'].includes(req.body[key])) {
          return res.status(400).json({ 
            success: false, 
            error: { message: 'theme must be "light" or "dark"' } 
          });
        }
        updates[key] = req.body[key];
      }
    }

    // Notifications nesnesini güncelle
    if (req.body.notifications && typeof req.body.notifications === 'object') {
      updates.notifications = {
        push: req.body.notifications.push !== undefined ? req.body.notifications.push : true,
        email: req.body.notifications.email !== undefined ? req.body.notifications.email : true,
        reminders: req.body.notifications.reminders !== undefined ? req.body.notifications.reminders : true,
      };
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No valid fields to update' } });
    }

    // Profil tamamlanmayı hesapla ve ekle
    const user = await User.findById(userId);
    const mergedUser = { ...user.toObject(), ...updates };
    updates.profileCompletion = calculateProfileCompletion(mergedUser);

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select('-passwordHash -__v');

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// ===========================
// Avatar Fonksiyonları
// ===========================

exports.updateAvatar = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { avatarUrl } = req.body;
    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return res.status(400).json({ success: false, error: { message: 'avatarUrl is required and must be a string' } });
    }

    const user = await User.findById(userId);
    const mergedUser = { ...user.toObject(), avatarUrl };
    const completion = calculateProfileCompletion(mergedUser);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { avatarUrl, profileCompletion: completion } },
      { new: true }
    ).select('-passwordHash -__v');

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

exports.removeAvatar = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const user = await User.findById(userId);
    const mergedUser = { ...user.toObject(), avatarUrl: null };
    const completion = calculateProfileCompletion(mergedUser);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { avatarUrl: null, profileCompletion: completion } },
      { new: true }
    ).select('-passwordHash -__v');

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// ===========================
// İstatistik Fonksiyonları
// ===========================

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const user = await User.findById(userId).select('averageDailyCalories averageDailyWater streak dailyCalorieGoal dailyWaterGoal');
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    // Bugünün su tüketimini hesapla
    const start = startOfDay();
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const waterAgg = await Water.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId), date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayWater = (waterAgg[0] && waterAgg[0].total) || 0;

    // TODO: Kalori modeli integrasyonu yapılınca güncellenecek
    const todayCalories = 0;

    res.status(200).json({
      success: true,
      data: {
        todayCalories,
        todayWater,
        averageDailyCalories: user.averageDailyCalories || 0,
        averageDailyWater: user.averageDailyWater || 0,
        streak: user.streak || 0,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// ===========================
// Güvenlik Fonksiyonları
// ===========================

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { oldPassword, newPassword } = req.body;

    // Validasyon
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'oldPassword and newPassword are required' } 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'New password must be at least 8 characters' } 
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'New password must be different from old password' } 
      });
    }

    // Kullanıcıyı getir
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    // Eski şifre doğrulaması
    if (!user.passwordHash) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'No password set for this account' } 
      });
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: { message: 'Old password is incorrect' } 
      });
    }

    // Yeni şifreyi hash'le
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Güncelle
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          passwordHash: newPasswordHash,
          passwordUpdatedAt: new Date()
        }
      },
      { new: true }
    ).select('-passwordHash -__v');

    res.status(200).json({ 
      success: true, 
      message: 'Password changed successfully',
      data: updatedUser 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

exports.logout = async (req, res) => {
  try {
    // JWT kullanıyorsan, logout işlemi client-side'de token'ı sil anlamına gelir.
    // Eğer token blacklist sistemi varsa burada blacklist'e ekle.
    res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
