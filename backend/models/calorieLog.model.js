const mongoose = require('mongoose');

const CalorieLogSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trackerId: { type: mongoose.Schema.Types.ObjectId, ref: 'CalorieTracker', required: true, index: true },

    
    date: { type: Date, required: true, index: true },

    calories: { type: Number, required: true, min: 0 },
    note: { type: String }, 

   
    items: [
      {
        name: { type: String },
        calories: { type: Number, min: 0 }
      }
    ],
  },
  { timestamps: true }
);


CalorieLogSchema.index({ ownerId: 1, trackerId: 1, date: 1 });

module.exports = mongoose.model('CalorieLog', CalorieLogSchema);