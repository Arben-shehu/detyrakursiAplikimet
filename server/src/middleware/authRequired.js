// Verifikon JWT nga header `Authorization: Bearer <token>`.
// Nese eshte valide, vendos req.user = { id, username, role }.

const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Mungon token-i i autentifikimit' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, username: payload.username, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token i pavlefshem ose i skaduar' });
  }
}

module.exports = authRequired;
