const express = require('express');
const ctrl = require('../controllers/analytics.controller');
const authRequired = require('../middleware/authRequired');
const adminRequired = require('../middleware/adminRequired');

const router = express.Router();

router.get('/overview', authRequired, adminRequired, ctrl.overview);

module.exports = router;
