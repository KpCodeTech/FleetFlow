const router = require('express').Router();
const { getAll, getOne, create, remove } = require('../controllers/maintenanceController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/',       authenticate, getAll);
router.get('/:id',    authenticate, getOne);
router.post('/',      authenticate, authorize('MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'), create);
router.delete('/:id', authenticate, authorize('MANAGER'), remove);

module.exports = router;
