const express = require('express');
const ctrl = require('../controllers/leaderboard.controller');

const router = express.Router();

router.get('/', ctrl.top);

module.exports = router;
