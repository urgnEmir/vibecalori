
const mongoose = require('mongoose');

const CalorieTrackerSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    weightGoal: { type: String, enum: ['gain', 'lose', 'maintain'], required: true },
    age: { type: Number, required: true, min: 1, max: 120 },
    exerciseDaysPerWeek: { type: Number, required: true, min: 0, max: 7 },

    gender: { type: String, enum: ['male', 'female'], required: true },
    height: { type: Number, required: true }, // cm
    weight: { type: Number, required: true }, // kg

    pal: { type: Number, required: true },
    bmr: { type: Number, required: true },
    tdee: { type: Number, required: true },
    targetCalories: { type: Number, required: true },
  },
  { timestamps: true } // createdAt, updatedAt
);

module.exports = mongoose.model('CalorieTracker', CalorieTrackerSchema);
