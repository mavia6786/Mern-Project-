const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/supplierController');
const { requireAuth, requireShop } = require('../middleware/auth');

router.use(requireAuth, requireShop);

router.get('/', ctrl.getAll);
router.get('/overview', ctrl.getOverview);

// purchase orders
router.get('/orders', ctrl.getOrders);
router.get('/orders/pending-total', ctrl.getTotalPending);
router.post('/orders', ctrl.createOrder);
router.put('/orders/:id', ctrl.updateOrder);
router.post('/orders/:id/payments', ctrl.addPayment);
router.delete('/orders/:id/payments/:paymentId', ctrl.removePayment);
router.post('/orders/:id/receive', ctrl.receiveOrder);
router.post('/orders/:id/cancel', ctrl.cancelOrder);

router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
