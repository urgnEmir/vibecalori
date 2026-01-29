const CalorieTracker = require('../models/calories.models');
const CalorieLog = require('../models/calorieLog.model');
const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const router = express.Router();


const round50 = (x) => Math.round(x / 50) * 50;
const getPal = (exerciseDaysPerWeek) => {
  if (exerciseDaysPerWeek <= 1) return 1.2;
  if (exerciseDaysPerWeek <= 3) return 1.375;
  if (exerciseDaysPerWeek <= 5) return 1.55;
  return 1.725;
};
const normalizeGender = (gender) => {
  const g = (gender || '').toLowerCase();
  return g === 'female' || g === 'kadin' ? 'female' : 'male';
};
// UTC gün başlangıcını döndüren yardımcı
const startOfUTCDay = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

// POST /api/calories/create
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { weightGoal, age, exerciseDaysPerWeek } = req.body;
    const { gender, height, weight, id: userId } = req.user;

    if (!['gain', 'lose', 'maintain'].includes(weightGoal)) {
      return res.status(400).json({
        message: 'Geçersiz kilo hedefi. gain, lose veya maintain seçeneklerinden birini seçiniz.'
      });
    }

    if (!age || age < 1 || age > 120) {
      return res.status(400).json({ message: 'Geçerli bir yaş giriniz (1-120).' });
    }

    if (exerciseDaysPerWeek === undefined || exerciseDaysPerWeek < 0 || exerciseDaysPerWeek > 7) {
      return res.status(400).json({ message: 'Geçerli bir egzersiz günü giriniz (0-7).' });
    }

    const genderNorm = normalizeGender(gender);
    const pal = getPal(exerciseDaysPerWeek);

    let bmr;
    if (genderNorm === 'male') bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    else bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    bmr = round50(bmr);

    const tdee = round50(bmr * pal);

    let targetCalories;
    if (weightGoal === 'lose') targetCalories = round50(tdee - 500);
    else if (weightGoal === 'gain') targetCalories = round50(tdee + 300);
    else targetCalories = tdee;

    // database e kaydetmek için bura
    const tracker = await CalorieTracker.create({
      ownerId: userId,
      weightGoal,
      age,
      exerciseDaysPerWeek,
      gender: genderNorm,
      height,
      weight,
      pal,
      bmr,
      tdee,
      targetCalories,
    });

    return res.status(201).json({
      message: 'Calorie tracker created',
      tracker
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/calories/:trackerId - belirli bir takvimi ve son log'ları getir
router.get('/:trackerId', verifyToken, async (req, res) => {
  try {
    const { trackerId } = req.params;
    const userId = req.user.id;
    const tracker = await CalorieTracker.findOne({ _id: trackerId, ownerId: userId });
    if (!tracker) return res.status(404).json({ message: 'Tracker not found' });
    const logs = await CalorieLog.find({ ownerId: userId, trackerId }).sort({ date: -1 }).limit(30);
    return res.status(200).json({ tracker, logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/calories/:trackerId/log - takvime yemek kaydı ekle veya güncelle
router.post('/:trackerId/log', verifyToken, async (req, res) => {
  try {
    const { trackerId } = req.params;
    const userId = req.user.id;
    const { calories, note, items, date, logId } = req.body;

    if (calories !== undefined && (typeof calories !== 'number' || calories < 0)) {
      return res.status(400).json({ message: 'Geçerli bir kalori değeri giriniz.' });
    }

    // tracker doğrulama
    const tracker = await CalorieTracker.findOne({ _id: trackerId, ownerId: userId });
    if (!tracker) return res.status(404).json({ message: 'Tracker not found' });

    const normalizedDate = date ? startOfUTCDay(new Date(date)) : startOfUTCDay();

    if (logId) {
      // Güncelleme
      const log = await CalorieLog.findOne({ _id: logId, ownerId: userId });
      if (!log) return res.status(404).json({ message: 'Log not found' });
      if (calories !== undefined) log.calories = calories;
      if (note !== undefined) log.note = note;
      if (items !== undefined) log.items = items;
      if (date !== undefined) log.date = normalizedDate;
      await log.save();
      return res.status(200).json({ message: 'Calorie log updated', log });
    } else {
      // Oluşturma
      const newLog = await CalorieLog.create({
        ownerId: userId,
        trackerId,
        date: normalizedDate,
        calories: calories || 0,
        note,
        items,
      });
      return res.status(201).json({ message: 'Calorie log created', log: newLog });
    }
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Aynı gün için zaten bir kayıt var.' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
