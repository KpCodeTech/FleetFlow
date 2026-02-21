const router = require('express').Router();
const { getAll, getOne, createDraft, dispatch, dispatchDraft, complete, cancel } = require('../controllers/tripController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/',                   authenticate, getAll);
router.get('/:id',                authenticate, getOne);
router.post('/',                  authenticate, authorize('MANAGER', 'DISPATCHER'), createDraft);
router.post('/dispatch',          authenticate, authorize('MANAGER', 'DISPATCHER'), dispatch);
router.patch('/:id/dispatch',     authenticate, authorize('MANAGER', 'DISPATCHER'), dispatchDraft);
router.patch('/:id/complete',     authenticate, authorize('MANAGER', 'DISPATCHER'), complete);
router.patch('/:id/cancel',       authenticate, authorize('MANAGER', 'DISPATCHER'), cancel);

module.exports = router;
