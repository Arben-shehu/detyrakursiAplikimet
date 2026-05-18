// Konfigurimi i Express-it: middleware globale + lidhja e routes-ave.

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const categoriesRoutes = require('./routes/categories.routes');
const questionsRoutes = require('./routes/questions.routes');
const attemptsRoutes = require('./routes/attempts.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
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
