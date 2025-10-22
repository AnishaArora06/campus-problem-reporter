const jwt = require('jsonwebtoken');

function auth(requiredRole) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      req.user = { id: payload.id, role: payload.role };

      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

module.exports = { auth };
