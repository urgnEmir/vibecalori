const Water = require('../models/water.model');

// Create a new water tracker
exports.createWaterTracker = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const newWaterTracker = new Water({
      user: userId,
      amount,
    });
    await newWaterTracker.save();
    res.status(201).json({ message: 'Water tracker created successfully', newWaterTracker });
  } catch (error) {
    res.status(500).json({ message: 'Error creating water tracker', error: error.message });
  }
};

// Get a specific water tracker
exports.getWaterTracker = async (req, res) => {
  try {
    const { id } = req.params;
    const waterTracker = await Water.findById(id);
    if (!waterTracker) {
      return res.status(404).json({ message: 'Water tracker not found' });
    }
    res.status(200).json({ waterTracker });
  } catch (error) {
    res.status(500).json({ message: 'Error getting water tracker', error: error.message });
  }
};

// Log water intake
exports.logWater = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const waterTracker = await Water.findByIdAndUpdate(
      id,
      { $inc: { amount: amount } },
      { new: true }
    );
    if (!waterTracker) {
      return res.status(404).json({ message: 'Water tracker not found' });
    }
    res.status(201).json({ message: 'Water log added successfully', waterTracker });
  } catch (error) {
    res.status(500).json({ message: 'Error adding water log', error: error.message });
  }
};
