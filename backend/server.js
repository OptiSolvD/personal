const path = require('path');
const fs = require('fs');

/* =========================
   LOAD .env FIRST (CRITICAL)
   ========================= */
const rootEnvPath = path.join(__dirname, '..', '.env');
const backendEnvPath = path.join(__dirname, '.env');

if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
  console.log('Loaded .env from project root');
} else if (fs.existsSync(backendEnvPath)) {
  require('dotenv').config({ path: backendEnvPath });
  console.log('Loaded .env from backend directory');
} else {
  require('dotenv').config();
  console.log('No .env file found, using system env');
}

/* DEBUG CHECK (TEMPORARY) */
console.log('ENV CHECK:', {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET ? 'OK' : 'MISSING',
  user1Username: process.env.USER1_USERNAME || 'NOT SET',
  user2Username: process.env.USER2_USERNAME || 'NOT SET',
  user1PasswordSet: process.env.USER1_PASSWORD ? 'SET' : 'NOT SET',
  user2PasswordSet: process.env.USER2_PASSWORD ? 'SET' : 'NOT SET',
});

/* =========================
   NOW import everything else
   ========================= */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const memoryRoutes = require('./routes/memoryRoutes');
const authRoutes = require('./routes/authRoutes');
const jwtAuth = require('./middleware/jwtAuth');

const app = express();
app.use(cors());
app.use(express.json());

// Public routes (no auth required)
app.use('/api/auth', authRoutes);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    database: dbStatus
  });
});

// Protected routes (require JWT)
app.use('/api/memories', jwtAuth, memoryRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI )
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error(err);
  });