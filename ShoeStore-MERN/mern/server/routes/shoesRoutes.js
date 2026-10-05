const express = require('express');
const router = express.Router();
const { requireAuth, requireShop } = require('../middleware/auth');
const productCtrl = require('../controllers/shoes/productController');
const saleCtrl = require('../controllers/shoes/saleController');
const salesmanCtrl = require('../controllers/shoes/salesmanController');
const staffRoutes = require('./common/staffRoutes');

router.use(requireAuth, requireShop);

// Products
router.get('/products', productCtrl.getAll);
router.get('/products/low-stock', productCtrl.getLowStock);
router.get('/products/brands', productCtrl.getBrands);
router.get('/products/stats', productCtrl.getStats);
router.get('/products/:id', productCtrl.getById);
router.post('/products', productCtrl.create);
router.put('/products/:id', productCtrl.update);
router.delete('/products/:id', productCtrl.remove);
router.patch('/products/:id/stock', productCtrl.updateStock);

// Sales
router.get('/sales', saleCtrl.getAll);
router.get('/sales/dashboard-stats', saleCtrl.getDashboardStats);
router.get('/sales/:id', saleCtrl.getById);
router.post('/sales', saleCtrl.create);
router.post('/sales/:id/refund', saleCtrl.refund);

// Salesmen / attendance / advances / salary (shared payroll engine)
router.use('/salesmen', staffRoutes(salesmanCtrl));

module.exports = router;
