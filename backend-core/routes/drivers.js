const router = require('express').Router();
const { getAll, getOne, create, update, remove } = require('../controllers/driverController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/',       authenticate, getAll);
router.get('/:id',    authenticate, getOne);
router.post('/',      authenticate, authorize('MANAGER', 'DISPATCHER'), create);
router.patch('/:id',  authenticate, authorize('MANAGER', 'DISPATCHER'), update);
router.delete('/:id', authenticate, authorize('MANAGER'), remove);

module.exports = router;
