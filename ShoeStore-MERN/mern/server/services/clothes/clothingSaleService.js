const ClothingSale = require('../../models/clothes/ClothingSale');
const ClothingProduct = require('../../models/clothes/ClothingProduct');
const Counter = require('../../models/Counter');

exports.getAllSales = (shopId) => {
  const query = shopId ? { shopId } : {};
  return ClothingSale.find(query).sort({ saleDate: -1 });
};

exports.getSalesByDateRange = (from, to, shopId) => {
  const query = { saleDate: { $gte: new Date(from), $lte: new Date(to) } };
  if (shopId) query.shopId = shopId;
  return ClothingSale.find(query).sort({ saleDate: -1 });
};

exports.getSaleById = (id, shopId) => {
  const query = shopId ? { _id: id, shopId } : { _id: id };
  return ClothingSale.findOne(query);
};

exports.getSaleByInvoice = (invoiceNumber, shopId) => {
  const query = shopId ? { invoiceNumber, shopId } : { invoiceNumber };
  return ClothingSale.findOne(query);
};

exports.getTotalRevenue = async (from, to, shopId) => {
  const match = { saleDate: { $gte: new Date(from), $lte: new Date(to) }, status: 'Completed' };
  if (shopId) match.shopId = shopId;
  const result = await ClothingSale.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]);
  return result[0]?.total || 0;
};

exports.getTotalTransactions = (from, to, shopId) => {
  const query = { saleDate: { $gte: new Date(from), $lte: new Date(to) }, status: 'Completed' };
  if (shopId) query.shopId = shopId;
  return ClothingSale.countDocuments(query);
};

exports.getTopSellingProducts = async (from, to, limit, shopId) => {
  const match = { saleDate: { $gte: new Date(from), $lte: new Date(to) }, status: 'Completed' };
  if (shopId) match.shopId = shopId;

  const result = await ClothingSale.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        productName: { $first: '$items.productName' },
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
  ]);

  const productIds = result.map((r) => r._id).filter(Boolean);
  const products = await ClothingProduct.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  return result.map((r) => ({
    product: productMap.get(String(r._id)) || null,
    productName: r.productName,
    totalSold: r.totalSold,
    totalRevenue: r.totalRevenue,
  }));
};

exports.processSale = async (saleData, shopId) => {
  // 1) validate stock for every line first (no partial deductions if one line fails)
  const products = new Map();
  for (const item of saleData.items) {
    const product = await ClothingProduct.findOne({ _id: item.productId, shopId });
    if (!product) throw new Error(`Product not found: ${item.productName}`);
    const wanted = saleData.items.filter((i) => String(i.productId) === String(item.productId)).reduce((n, i) => n + i.quantity, 0);
    if (product.stockQuantity < wanted) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
    }
    products.set(String(product._id), product);
  }

  // 2) atomic, per-shop, per-day invoice number
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = await Counter.next(`cloth-inv:${shopId}:${day}`);
  const invoiceNumber = `CL-${day}-${String(seq).padStart(4, '0')}`;

  const sale = await ClothingSale.create({
    ...saleData,
    items: saleData.items.map((i) => ({ ...i, unitCost: products.get(String(i.productId))?.costPrice || 0 })),
    shopId,
    saleDate: new Date(),
    status: 'Completed',
    invoiceNumber,
  });

  // 3) deduct stock only after the sale is safely saved
  for (const item of saleData.items) {
    await ClothingProduct.updateOne({ _id: item.productId, shopId }, { $inc: { stockQuantity: -item.quantity }, $set: { updatedAt: new Date() } });
  }
  return sale;
};

exports.refundSale = async (saleId, shopId) => {
  const sale = await ClothingSale.findById(saleId);
  if (!sale) throw new Error('Sale not found');
  if (shopId && String(sale.shopId) !== String(shopId)) throw new Error('Unauthorized');
  if (sale.status === 'Refunded') throw new Error('Sale already refunded');

  // Restore stock
  for (const item of sale.items) {
    const product = await ClothingProduct.findById(item.productId);
    if (product) {
      product.stockQuantity += item.quantity;
      product.updatedAt = new Date();
      await product.save();
    }
  }

  sale.status = 'Refunded';
  sale.updatedAt = new Date();
  await sale.save();
  return sale;
};
