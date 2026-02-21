const router = require('express').Router();
const { getAll, create, remove } = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/',       authenticate, getAll);
router.post('/',      authenticate, authorize('MANAGER', 'DISPATCHER', 'FINANCE'), create);
router.delete('/:id', authenticate, authorize('MANAGER', 'FINANCE'), remove);

module.exports = router;
