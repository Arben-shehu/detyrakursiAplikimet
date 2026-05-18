const express = require('express');
const ctrl = require('../controllers/auth.controller');
const authRequired = require('../middleware/authRequired');

const router = express.Router();

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', authRequired, ctrl.me);

module.exports = router;
