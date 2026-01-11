module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Restricted"');
    return res.status(401).send('Authentication required');
  }

  const base64 = authHeader.split(' ')[1] || '';
  let decoded = '';
  try {
    decoded = Buffer.from(base64, 'base64').toString();
  } catch (e) {
    res.set('WWW-Authenticate', 'Basic realm="Restricted"');
    return res.status(401).send('Invalid authentication header');
  }

  const sepIndex = decoded.indexOf(':');
  if (sepIndex === -1) {
    res.set('WWW-Authenticate', 'Basic realm="Restricted"');
    return res.status(401).send('Invalid authentication token');
  }

  const username = decoded.slice(0, sepIndex);
  const password = decoded.slice(sepIndex + 1);

  const users = [
    { username: process.env.USER1_USERNAME || '', password: process.env.USER1_PASSWORD || '' },
    { username: process.env.USER2_USERNAME || '', password: process.env.USER2_PASSWORD || '' },
  ];

  const ok = users.some(u => u.username && u.password && u.username === username && u.password === password);
  if (!ok) {
    res.set('WWW-Authenticate', 'Basic realm="Restricted"');
    return res.status(401).send('Invalid credentials');
  }

  next();
};
