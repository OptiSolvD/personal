const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Login endpoint (no auth required)
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Debug: Log what we're receiving and what's in env (without exposing passwords)
  console.log('Login attempt:', { 
    receivedUsername: username,
    user1Username: process.env.USER1_USERNAME || 'NOT SET',
    user2Username: process.env.USER2_USERNAME || 'NOT SET',
    user1PasswordSet: process.env.USER1_PASSWORD ? 'SET' : 'NOT SET',
    user2PasswordSet: process.env.USER2_PASSWORD ? 'SET' : 'NOT SET'
  });

  const users = [
    { username: process.env.USER1_USERNAME || '', password: process.env.USER1_PASSWORD || '' },
    { username: process.env.USER2_USERNAME || '', password: process.env.USER2_PASSWORD || '' },
  ];

  // Debug: Check each user
  console.log('Checking users:', users.map(u => ({ 
    username: u.username, 
    passwordLength: u.password ? u.password.length : 0 
  })));

  const user = users.find(
    (u) => u.username && u.password && u.username === username && u.password === password
  );

  if (!user) {
    console.log('Login failed - no matching user found');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Create JWT token (expires in 7 days)
  const jwtSecret = process.env.JWT_SECRET || 'raj-loves-saloni-secret-key-2024';
  const token = jwt.sign(
    { username: user.username },
    jwtSecret,
    { expiresIn: '7d' }
  );

  res.json({ token, username: user.username });
});

// Verify token endpoint
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'raj-loves-saloni-secret-key-2024';
    const decoded = jwt.verify(token, jwtSecret);
    res.json({ valid: true, username: decoded.username });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;

