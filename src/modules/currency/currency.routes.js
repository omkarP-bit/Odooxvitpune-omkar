const router = require('express').Router();
const currencyController = require('./currency.controller');
const authenticate = require('../../middleware/authenticate');

router.get('/convert', authenticate, currencyController.convert);

module.exports = router;
