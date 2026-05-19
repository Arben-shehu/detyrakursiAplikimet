const express = require('express');
const ctrl = require('../controllers/users.controller');
const authRequired = require('../middleware/authRequired');
const adminRequired = require('../middleware/adminRequired');

const router = express.Router();

router.get('/', authRequired, adminRequired, ctrl.list);
router.delete('/:id', authRequired, adminRequired, ctrl.remove);
router.post('/:id/reset-password', authRequired, adminRequired, ctrl.resetPassword);

module.exports = router;
