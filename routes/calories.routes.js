const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const router = express.Router();

// Helper functions
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

// POST /api/calories/create
router.post('/create', verifyToken, (req, res) => {
  const { weightGoal, age, exerciseDaysPerWeek } = req.body;
  const { gender, height, weight } = req.user;
  
  // Geçerli seçenekler: 'gain', 'lose', 'maintain'
  if (!['gain', 'lose', 'maintain'].includes(weightGoal)) {
    return res.status(400).json({ 
      message: 'Geçersiz kilo hedefi. gain, lose veya maintain seçeneklerinden birini seçiniz.' 
    });
  }

  // Yaş validasyonu
  if (!age || age < 1 || age > 120) {
    return res.status(400).json({ 
      message: 'Geçerli bir yaş giriniz (1-120).' 
    });
  }

  // Haftada egzersiz günü validasyonu
  if (exerciseDaysPerWeek === undefined || exerciseDaysPerWeek < 0 || exerciseDaysPerWeek > 7) {
    return res.status(400).json({ 
      message: 'Geçerli bir egzersiz günü giriniz (0-7).' 
    });
  }

  // Normalize gender
  const genderNorm = normalizeGender(gender);

  // Calculate PAL
  const pal = getPal(exerciseDaysPerWeek);

  // Calculate BMR using Mifflin–St Jeor
  let bmr;
  if (genderNorm === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  bmr = round50(bmr);

  // Calculate TDEE
  const tdee = round50(bmr * pal);

  // Apply goal adjustment
  let targetCalories;
  if (weightGoal === 'lose') {
    targetCalories = round50(tdee - 500);
  } else if (weightGoal === 'gain') {
    targetCalories = round50(tdee + 300);
  } else {
    targetCalories = tdee;
  }

  res.status(201).json({
    message: 'Calorie tracker created',
    weightGoal,
    age,
    exerciseDaysPerWeek,
    gender: genderNorm,
    height,
    weight,
    pal,
    bmr,
    tdee,
    targetCalories
  });
});

// GET /api/calories/:id burda ise ismini belirlediğimiz takvimi çağırıyoz o yüzden get
router.get('/:id', verifyToken, (req, res) => {
  // TODO: Kişi 4 - Spesifik kalori takibini getir
  res.status(200).json({ message: 'Get calorie tracker - Kişi 4' });
});

// POST /api/calories/:id/log burda ise belirlediğimiz takvime yemek kaydı ekliyoz
router.post('/:id/log', verifyToken, (req, res) => {
  // TODO: Kişi 4 - Yemek kaydı ekle
  res.status(201).json({ message: 'Calorie log added - Kişi 4' });
});

module.exports = router;
