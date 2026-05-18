// Konfigurimi i Express-it: middleware globale + lidhja e routes-ave.

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const categoriesRoutes = require('./routes/categories.routes');
const questionsRoutes = require('./routes/questions.routes');
const attemptsRoutes = require('./routes/attempts.routes');
const usersRoutes = require('./routes/users.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();

// CORS: lejo nje liste URL-ash te ndarura me presje ne CLIENT_ORIGIN.
// Per development: http://localhost:5173
// Per produksion: https://your-app.vercel.app,https://your-other-domain.com
// Normalizon trailing slashes per matching me te forte.
function normalize(o) { return (o || '').replace(/\/+$/, '').toLowerCase(); }

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => normalize(s.trim()))
  .filter(Boolean);

console.log('[cors] Lejuar:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Lejo kerkesa pa origin (curl, healthcheck) ose te perputhura
    if (!origin || allowedOrigins.includes(normalize(origin))) {
      return callback(null, true);
    }
    // Mos hidh gabim - kthe false qe mos te dale 500
    console.warn('[cors] Refuzuar origin:', origin);
    return callback(null, false);
  },
  credentials: false,
}));

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/attempts', attemptsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint nuk u gjet' });
});

// Error handler i pergjithshem
app.use((err, req, res, _next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Gabim server' });
});

module.exports = app;
