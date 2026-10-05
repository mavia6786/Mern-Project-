const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const { requireAuth, requireShop } = require('../middleware/auth');

router.get('/current', requireAuth, requireShop, (req, res) => res.json(req.shop));

router.put('/current', requireAuth, requireShop, async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(req.shop._id, { ...req.body, updatedAt: new Date() }, { new: true });
  res.json(shop);
});

module.exports = router;
