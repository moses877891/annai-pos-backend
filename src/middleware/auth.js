import jwt from 'jsonwebtoken';

export function auth(requiredRole) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '');
      if (!token) return res.status(401).json({ message: 'No token' });

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload; // { id, username, role }

      if (requiredRole && payload.role !== requiredRole && payload.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    } catch {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}