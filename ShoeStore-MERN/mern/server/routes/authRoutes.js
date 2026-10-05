const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', ctrl.login);
router.post('/register', ctrl.register);
router.post('/register-shop', requireAuth, ctrl.registerShop);
router.get('/me', requireAuth, ctrl.me);

module.exports = router;
