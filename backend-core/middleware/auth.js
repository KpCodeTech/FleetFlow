const jwt = require('jsonwebtoken');

/**
 * Middleware: Verify JWT and attach user to req.user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized – no token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized – invalid or expired token' });
  }
};

/**
 * Middleware: Restrict access to specific roles
 * Usage: authorize('MANAGER', 'DISPATCHER')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Forbidden – requires role: ${roles.join(' or ')}` });
  }
  next();
};

module.exports = { authenticate, authorize };
