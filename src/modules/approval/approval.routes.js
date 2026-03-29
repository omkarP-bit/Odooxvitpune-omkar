const router = require('express').Router();
const approvalController = require('./approval.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), approvalController.list);
router.post('/:id/approve', authorize('ADMIN', 'MANAGER'), approvalController.decide);

module.exports = router;
