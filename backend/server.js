require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vibe-tracker')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes - Her kişinin backend'i
app.use('/api/auth', require('./routes/auth.routes')); // Kişi 1: Login/Register
app.use('/api/user', require('./routes/user.routes')); // Kişi 2: Profil & Main Menu
app.use('/api/water', require('./routes/water.routes')); // Kişi 3: Su Takibi
app.use('/api/calories', require('./routes/calories.routes')); // Kişi 4: Kalori Takibi

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
