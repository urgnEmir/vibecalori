// Controller for nutritive values: BMR, TDEE, and macronutrient targets
// This endpoint returns detailed computation steps and LaTeX formula strings
const calculateMacros = (req, res) => {
  try {
    const { gender, age, height, weight, activityLevel } = req.body;
    if (!gender || !age || !height || !weight || !activityLevel) {
      return res.status(400).json({ error: 'Missing required fields: gender, age, height, weight, activityLevel' });
    }

    const w = Number(weight); // kg
    const h = Number(height); // cm
    const a = Number(age); // years
    if (Number.isNaN(w) || Number.isNaN(h) || Number.isNaN(a)) {
      return res.status(400).json({ error: 'Invalid numeric values for weight/height/age' });
    }

    // Mifflin-St Jeor (recommended)
    // Male: BMR = 10*w + 6.25*h - 5*a + 5
    // Female: BMR = 10*w + 6.25*h - 5*a - 161
    let bmr = 10 * w + 6.25 * h - 5 * a + (gender === 'male' ? 5 : -161);

    // Provide alternative formula (Harris-Benedict) for reference
    // HB (revised): men: 88.362 + (13.397*w) + (4.799*h) - (5.677*a)
    // women: 447.593 + (9.247*w) + (3.098*h) - (4.330*a)
    const hb = gender === 'male'
      ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
      : 447.593 + 9.247 * w + 3.098 * h - 4.330 * a;

    // Activity multipliers (PAL)
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    const pal = activityMultipliers[activityLevel] || 1.2;

    // TDEE = BMR * PAL
    const tdee = bmr * pal;

    // Macronutrient distribution - adjusted by activity level
    // These are sensible example splits; adjust for goals if needed
    const splitsByActivity = {
      sedentary: { protein: 0.20, fat: 0.30, carbs: 0.50 },
      light: { protein: 0.22, fat: 0.28, carbs: 0.50 },
      moderate: { protein: 0.25, fat: 0.30, carbs: 0.45 },
      active: { protein: 0.28, fat: 0.30, carbs: 0.42 },
      very_active: { protein: 0.30, fat: 0.25, carbs: 0.45 }
    };

    const splits = splitsByActivity[activityLevel] || splitsByActivity.sedentary;

    const proteinCals = tdee * splits.protein;
    const fatCals = tdee * splits.fat;
    const carbCals = tdee * splits.carbs;

    const macros = {
      protein_g: Math.round(proteinCals / 4),
      fat_g: Math.round(fatCals / 9),
      carbs_g: Math.round(carbCals / 4),
      protein_pct: splits.protein,
      fat_pct: splits.fat,
      carbs_pct: splits.carbs
    };

    // Recommended protein per kg range
    const proteinPerKg = {
      sedentary: [0.8, 1.0],
      light: [1.0, 1.2],
      moderate: [1.2, 1.6],
      active: [1.6, 1.8],
      very_active: [1.8, 2.0]
    };

    const proteinKgRange = proteinPerKg[activityLevel] || proteinPerKg.sedentary;

    // Return detailed result including LaTeX formulas for display
    res.json({
      inputs: { gender, age: a, height: h, weight: w, activityLevel, pal },
      formulas: {
        mifflin_st_jeor: {
          latex: "BMR_{Mifflin} = 10\\times w + 6.25\\times h - 5\\times a + {5\\text{ (male)}\\;\\text{or}\\;-161\\text{ (female)}}",
          computed: Math.round(bmr)
        },
        harris_benedict: {
          latex: "BMR_{HB} = \\begin{cases}88.362 + 13.397w + 4.799h - 5.677a & \\text{(male)} \\\\ 447.593 + 9.247w + 3.098h - 4.330a & \\text{(female)}\\end{cases}",
          computed: Math.round(hb)
        },
        tdee: {
          latex: "TDEE = BMR \\times PAL",
          computed: Math.round(tdee)
        }
      },
      macros: macros,
      macro_calories: {
        protein_cals: Math.round(proteinCals),
        fat_cals: Math.round(fatCals),
        carb_cals: Math.round(carbCals)
      },
      protein_per_kg: { range_g_per_kg: proteinKgRange },
      notes: 'Macros are example distributions. Adjust per personal goals (cutting/bulking/maintain).'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { calculateMacros };

const MacroTarget = require('../models/macroTarget.model');

// Save computed targets for the authenticated user
const saveTargets = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });

    const { pal, bmr, tdee, macros } = req.body;
    if (!macros) return res.status(400).json({ error: 'Missing macros in body' });

    const doc = await MacroTarget.findOneAndUpdate(
      { ownerId },
      { ownerId, pal, bmr, tdee, macros },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get saved targets for authenticated user
const getTargets = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });
    const doc = await MacroTarget.findOne({ ownerId });
    if (!doc) return res.json(null);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { calculateMacros, saveTargets, getTargets };