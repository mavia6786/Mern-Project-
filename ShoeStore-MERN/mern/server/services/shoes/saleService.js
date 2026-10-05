const Sale = require('../../models/shoes/Sale');
const Product = require('../../models/shoes/Product');
const Counter = require('../../models/Counter');

async function generateInvoiceNumber(shopId) {
  const year = new Date().getFullYear();
  const seq = await Counter.next(`shoe-inv:${shopId}:${year}`);
  return `INV-${year}-${String(seq).padStart(4, '0')}`;
}

exports.createSale = async (shopId, cashierId, { customerName, customerPhone, paymentMethod, discountAmount, cartItems, notes }) => {
  // 1) validate every line against real stock (and this shop's products) BEFORE touching anything
  const products = new Map();
  for (const item of cartItems) {
    const product = await Product.findOne({ _id: item.productId, shopId });
    if (!product) throw new Error(`Product not found: ${item.productName}`);
    const already = cartItems.filter((c) => String(c.productId) === String(item.productId)).reduce((n, c) => n + c.quantity, 0);
    if (product.stockQuantity < already) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
    }
    products.set(String(product._id), product);
  }

  const subTotal = cartItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  let total = subTotal - (discountAmount || 0);
  if (total < 0) total = 0;

  const invoiceNumber = await generateInvoiceNumber(shopId);

  const sale = await Sale.create({
    invoiceNumber,
    shopId,
    cashierId: cashierId || null,
    customerName: customerName && customerName.trim() ? customerName : 'Walk-in Customer',
    customerPhone: customerPhone || '',
    paymentMethod: paymentMethod || 'Cash',
    subTotal,
    discountAmount: discountAmount || 0,
    taxAmount: 0,
    total,
    status: 'Completed',
    saleDate: new Date(),
    notes: notes || '',
    items: cartItems.map((ci) => ({
      productId: ci.productId,
      productName: ci.productName,
      size: ci.size,
      color: ci.color,
      quantity: ci.quantity,
      unitPrice: ci.unitPrice,
      unitCost: products.get(String(ci.productId))?.costPrice || 0, // cost snapshot -> accurate profit later
    })),
  });

  // 2) deduct stock atomically
  for (const item of cartItems) {
    await Product.updateOne({ _id: item.productId, shopId }, { $inc: { stockQuantity: -item.quantity }, $set: { updatedAt: new Date() } });
  }
  return sale;
};

// Refund: marks the sale refunded and puts the items back in stock.
exports.refundSale = async (saleId, shopId) => {
  const sale = await Sale.findOne({ _id: saleId, shopId });
  if (!sale) throw new Error('Sale not found');
  if (sale.status === 'Refunded') throw new Error('Sale already refunded');
  for (const item of sale.items) {
    if (item.productId) {
      await Product.updateOne({ _id: item.productId, shopId }, { $inc: { stockQuantity: item.quantity }, $set: { updatedAt: new Date() } });
    }
  }
  sale.status = 'Refunded';
  await sale.save();
  return sale;
};

exports.getAllSales = (shopId, from, to) => {
  const query = { shopId };
  if (from || to) {
    query.saleDate = {};
    if (from) query.saleDate.$gte = new Date(from);
    if (to) query.saleDate.$lte = new Date(to);
  }
  return Sale.find(query).populate('cashierId').sort({ saleDate: -1 });
};

exports.getSaleById = (id, shopId) => Sale.findOne({ _id: id, shopId }).populate('cashierId').populate('items.productId');

exports.getTotalRevenue = async (shopId, from, to) => {
  const query = { shopId, status: 'Completed' };
  if (from || to) {
    query.saleDate = {};
    if (from) query.saleDate.$gte = new Date(from);
    if (to) query.saleDate.$lte = new Date(to);
  }
  const result = await Sale.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$total' } } }]);
  return result[0]?.total || 0;
};

exports.getTotalOrders = (shopId, from, to) => {
  const query = { shopId, status: 'Completed' };
  if (from || to) {
    query.saleDate = {};
    if (from) query.saleDate.$gte = new Date(from);
    if (to) query.saleDate.$lte = new Date(to);
  }
  return Sale.countDocuments(query);
};

exports.getAverageOrderValue = async (shopId) => {
  const count = await Sale.countDocuments({ shopId, status: 'Completed' });
  if (count === 0) return 0;
  const result = await Sale.aggregate([
    { $match: { shopId, status: 'Completed' } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  return (result[0]?.total || 0) / count;
};

exports.getLast7DaysSales = async (shopId) => {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const agg = await Sale.aggregate([
      { $match: { shopId, status: 'Completed', saleDate: { $gte: date, $lt: nextDay } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    result.push({ date, revenue: agg[0]?.total || 0 });
  }
  return result;
};

exports.getTopProducts = async (shopId, count = 5) => {
  const result = await Sale.aggregate([
    { $match: { shopId, status: 'Completed' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: { productId: '$items.productId', productName: '$items.productName' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: count },
  ]);
  return result.map((r) => ({
    productId: r._id.productId,
    productName: r._id.productName,
    totalQuantity: r.totalQuantity,
    totalRevenue: r.totalRevenue,
  }));
};
