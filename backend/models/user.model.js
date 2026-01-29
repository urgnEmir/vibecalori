const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Temel bilgiler
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  passwordUpdatedAt: { type: Date },

  // Profil bilgileri
  age: { type: Number },
  height: { type: Number }, // cm
  weight: { type: Number }, // kg
  avatarUrl: { type: String },

  // Hedefler
  dailyCalorieGoal: { type: Number, default: 2000 },
  dailyWaterGoal: { type: Number, default: 2 }, // litres

  // İstatistikler
  streak: { type: Number, default: 0 },
  averageDailyCalories: { type: Number, default: 0 },
  averageDailyWater: { type: Number, default: 0 },

  // Ayarlar
  theme: { 
    type: String, 
    enum: ['light', 'dark'], 
    default: 'light' 
  },
  notifications: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true }
  },

  // Profil tamamlanma (0-100)
  profileCompletion: { type: Number, default: 0, min: 0, max: 100 },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
