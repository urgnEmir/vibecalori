const mongoose = require('mongoose');

const MacroLogSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    protein: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    meals: [
      {
        name: { type: String },
        protein: { type: Number, min: 0 },
        fat: { type: Number, min: 0 },
        carbs: { type: Number, min: 0 }
      }
    ]
  },
  { timestamps: true }
);

MacroLogSchema.index({ ownerId: 1, date: 1 });

module.exports = mongoose.model('MacroLog', MacroLogSchema);
