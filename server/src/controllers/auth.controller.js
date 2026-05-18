// Auth: register, login, me

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res) {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email dhe password jane te detyrueshme' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password duhet te kete te pakten 6 karaktere' });
  }

  try {
    const existing = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Username ose email ekziston' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, username, email, role, created_at`,
      [username, email, password_hash]
    );

    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('[auth.register]', err);
    res.status(500).json({ error: 'Gabim server ne register' });
  }
}

async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username dhe password te detyrueshme' });
  }

  try {
    const result = await query(
      'SELECT id, username, email, password_hash, role FROM users WHERE username = $1',
      [username]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Kredenciale te pasakta' });
    }
    const row = result.rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Kredenciale te pasakta' });
    }
    const user = { id: row.id, username: row.username, email: row.email, role: row.role };
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error('[auth.login]', err);
    res.status(500).json({ error: 'Gabim server ne login' });
  }
}

async function me(req, res) {
  try {
    const result = await query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Perdoruesi nuk u gjet' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[auth.me]', err);
    res.status(500).json({ error: 'Gabim server' });
  }
}

module.exports = { register, login, me };
