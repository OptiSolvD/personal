const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const jwtSecret = process.env.JWT_SECRET || 'raj-loves-saloni-secret-key-2024';
    const decoded = jwt.verify(token, jwtSecret);

    // Verify user is one of the allowed users
    const allowedUsers = [
      process.env.USER1_USERNAME || '',
      process.env.USER2_USERNAME || '',
    ];

    if (!allowedUsers.includes(decoded.username)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

