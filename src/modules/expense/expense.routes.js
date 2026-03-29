const router = require('express').Router();
const expenseController = require('./expense.controller');
const authenticate = require('../../middleware/authenticate');

router.use(authenticate);

router.post('/', expenseController.create);
router.get('/', expenseController.list);

module.exports = router;
