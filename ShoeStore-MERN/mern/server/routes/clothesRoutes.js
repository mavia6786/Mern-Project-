const express = require('express');
const router = express.Router();
const { requireAuth, requireShop } = require('../middleware/auth');
const productCtrl = require('../controllers/clothes/clothingProductController');
const saleCtrl = require('../controllers/clothes/clothingSaleController');
const salesmanCtrl = require('../controllers/clothes/clothingSalesmanController');
const staffRoutes = require('./common/staffRoutes');

router.use(requireAuth, requireShop);

// Products
router.get('/products', productCtrl.getAll);
router.get('/products/active', productCtrl.getActive);
router.get('/products/search', productCtrl.search);
router.get('/products/low-stock', productCtrl.getLowStock);
router.get('/products/categories', productCtrl.getCategories);
router.get('/products/brands', productCtrl.getBrands);
router.get('/products/category/:category', productCtrl.getByCategory);
router.get('/products/:id', productCtrl.getById);
router.post('/products', productCtrl.create);
router.put('/products/:id', productCtrl.update);
router.patch('/products/:id/stock', productCtrl.updateStock);
router.delete('/products/:id', productCtrl.remove);

// Sales
router.get('/sales', saleCtrl.getAll);
router.get('/sales/range', saleCtrl.getByDateRange);
router.get('/sales/stats', saleCtrl.getStats);
router.get('/sales/invoice/:invoiceNumber', saleCtrl.getByInvoice);
router.get('/sales/:id/print', saleCtrl.printBill);
router.get('/sales/:id', saleCtrl.getById);
router.post('/sales', saleCtrl.create);
router.post('/sales/:id/refund', saleCtrl.refund);

// Salesmen / attendance / advances / salary (shared payroll engine)
router.use('/salesmen', staffRoutes(salesmanCtrl));

module.exports = router;
