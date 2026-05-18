const express = require('express');
const ctrl = require('../controllers/attempts.controller');
const authRequired = require('../middleware/authRequired');

const router = express.Router();

router.post('/start', authRequired, ctrl.start);
router.post('/:id/answer', authRequired, ctrl.answer);
router.post('/:id/finish', authRequired, ctrl.finish);
router.get('/me', authRequired, ctrl.listMine);
router.get('/:id', authRequired, ctrl.getOne);

module.exports = router;
