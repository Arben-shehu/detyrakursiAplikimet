// Lejon vetem perdoruesit me role='admin'. Duhet te perdoret PAS authRequired.

function adminRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Pa autentifikim' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses i ndaluar - kerkohet admin' });
  }
  next();
}

module.exports = adminRequired;
