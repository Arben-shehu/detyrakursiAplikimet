const express = require('express');
const ctrl = require('../controllers/categories.controller');
const authRequired = require('../middleware/authRequired');
const adminRequired = require('../middleware/adminRequired');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', authRequired, adminRequired, ctrl.create);
router.put('/:id', authRequired, adminRequired, ctrl.update);
router.delete('/:id', authRequired, adminRequired, ctrl.remove);

module.exports = router;
