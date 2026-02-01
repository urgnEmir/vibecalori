const MacroLog = require('../models/macroLog.model');

// Add or update daily macro log
const logMacros = async (req, res) => {
  try {
    const { protein, fat, carbs, mealName } = req.body;
    const ownerId = req.user?.id; // auth.middleware sets req.user.id
    if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });

    const p = Number(protein) || 0;
    const f = Number(fat) || 0;
    const c = Number(carbs) || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let macroLog = await MacroLog.findOne({ ownerId, date: today });
    if (!macroLog) {
      macroLog = new MacroLog({ ownerId, date: today, protein: 0, fat: 0, carbs: 0, meals: [] });
    }
    macroLog.protein = (macroLog.protein || 0) + p;
    macroLog.fat = (macroLog.fat || 0) + f;
    macroLog.carbs = (macroLog.carbs || 0) + c;
    macroLog.meals.push({ name: mealName || 'Meal', protein: p, fat: f, carbs: c });
    await macroLog.save();
    res.json({ protein: macroLog.protein, fat: macroLog.fat, carbs: macroLog.carbs, meals: macroLog.meals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get today's macro log
const getTodayMacros = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const macroLog = await MacroLog.findOne({ ownerId, date: today });
    if (!macroLog) return res.json({ protein: 0, fat: 0, carbs: 0, meals: [] });
    res.json({ protein: macroLog.protein, fat: macroLog.fat, carbs: macroLog.carbs, meals: macroLog.meals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { logMacros, getTodayMacros };