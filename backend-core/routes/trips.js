const router = require('express').Router();
const { getAll, getOne, createDraft, dispatch, complete, cancel } = require('../controllers/tripController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/',                   authenticate, getAll);
router.get('/:id',                authenticate, getOne);
router.post('/',                  authenticate, authorize('MANAGER', 'DISPATCHER'), createDraft);
router.post('/dispatch',          authenticate, authorize('MANAGER', 'DISPATCHER'), dispatch);
router.patch('/:id/complete',     authenticate, authorize('MANAGER', 'DISPATCHER'), complete);
router.patch('/:id/cancel',       authenticate, authorize('MANAGER', 'DISPATCHER'), cancel);

module.exports = router;
