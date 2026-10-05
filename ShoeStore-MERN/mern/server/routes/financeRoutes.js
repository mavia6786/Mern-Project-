const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/financeController');
const { requireAuth, requireShop } = require('../middleware/auth');

router.use(requireAuth, requireShop);

router.get('/monthly', ctrl.monthly);            // 12-month profit & loss
router.get('/month-detail', ctrl.monthDetail);   // best sellers / payment mix for one month
router.get('/forecast', ctrl.forecast);          // next-months prediction + reorder suggestions

router.get('/expense-categories', ctrl.categories);
router.get('/expenses', ctrl.listExpenses);
router.post('/expenses', ctrl.addExpense);
router.delete('/expenses/:id', ctrl.removeExpense);

module.exports = router;
