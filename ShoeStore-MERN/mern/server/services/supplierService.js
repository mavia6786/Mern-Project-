const Supplier = require('../models/Supplier');
const SupplierOrder = require('../models/SupplierOrder');
const Counter = require('../models/Counter');
const ShoeProduct = require('../models/shoes/Product');
const ClothingProduct = require('../models/clothes/ClothingProduct');
const { monthRange, localParts } = require('../utils/dates');

const productModelFor = (shop) => (shop.type === 'Clothes' ? ClothingProduct : ShoeProduct);
const live = (o) => o.status !== 'Cancelled';
const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);

// ── Suppliers ───────────────────────────────────────────────────────────────
function statsOf(orders) {
  const active = orders.filter(live);
  const received = active.filter((o) => o.status === 'Delivered');
  return {
    totalOrders: active.length,
    pendingDeliveries: active.filter((o) => o.status !== 'Delivered').length,
    totalPurchased: sum(active, (o) => o.totalAmount),
    totalPaid: sum(active, (o) => o.paidAmount),
    totalPending: sum(active, (o) => o.totalAmount - o.paidAmount),
    unitsReceived: sum(received, (o) => sum(o.items || [], (i) => i.quantity)),
    lastOrderDate: orders.length ? orders.map((o) => o.orderDate).sort((a, b) => b - a)[0] : null,
  };
}

// every supplier + their stock / payment ledger numbers
exports.getAllWithStats = async (shopId) => {
  const [suppliers, orders] = await Promise.all([
    Supplier.find({ shopId, isActive: true }).sort({ companyName: 1 }),
    SupplierOrder.find({ shopId }),
  ]);
  return suppliers.map((s) => ({
    ...s.toObject(),
    stats: statsOf(orders.filter((o) => String(o.supplierId) === String(s._id))),
  }));
};

exports.getById = (id, shopId) => Supplier.findOne({ _id: id, shopId });

exports.getDetail = async (id, shopId) => {
  const supplier = await exports.getById(id, shopId);
  if (!supplier) return null;
  const orders = await SupplierOrder.find({ supplierId: id, shopId }).sort({ orderDate: -1 });
  return { ...supplier.toObject(), orders, stats: statsOf(orders) };
};

exports.create = (data) =>
  Supplier.create({
    companyName: data.companyName, contactPerson: data.contactPerson, phone: data.phone, email: data.email,
    address: data.address, city: data.city, productsSupplied: data.productsSupplied, notes: data.notes,
    shopId: data.shopId, createdAt: new Date(),
  });

const SUPPLIER_EDITABLE = ['companyName', 'contactPerson', 'phone', 'email', 'address', 'city', 'productsSupplied', 'notes', 'isActive'];
exports.update = (id, data, shopId) => {
  const set = {};
  SUPPLIER_EDITABLE.forEach((k) => { if (data[k] !== undefined) set[k] = data[k]; });
  return Supplier.findOneAndUpdate({ _id: id, shopId }, set, { new: true });
};

exports.remove = (id, shopId) => Supplier.findOneAndUpdate({ _id: id, shopId }, { isActive: false });

// ── Orders (purchases) ──────────────────────────────────────────────────────
exports.getOrders = (shopId, status, supplierId) => {
  const query = { shopId };
  if (status) query.status = status;
  if (supplierId) query.supplierId = supplierId;
  return SupplierOrder.find(query).populate('supplierId').sort({ orderDate: -1 });
};

exports.createOrder = async (data, shopId) => {
  const supplier = await Supplier.findOne({ _id: data.supplierId, shopId });
  if (!supplier) throw new Error('Supplier not found');

  const items = (data.items || [])
    .filter((i) => i.productName && Number(i.quantity) > 0)
    .map((i) => ({ productId: i.productId || null, productName: i.productName, quantity: Number(i.quantity), unitCost: Number(i.unitCost) || 0 }));

  // total comes from the items when given, otherwise from the typed amount
  const totalAmount = items.length ? sum(items, (i) => i.quantity * i.unitCost) : Number(data.totalAmount) || 0;
  if (!(totalAmount > 0)) throw new Error('Order total must be greater than 0');

  const initialPaid = Math.min(Number(data.initialPayment) || 0, totalAmount);
  const year = new Date().getFullYear();
  const seq = await Counter.next(`po:${shopId}:${year}`);

  return SupplierOrder.create({
    supplierId: supplier._id,
    shopId,
    orderNumber: `PO-${year}-${String(seq).padStart(4, '0')}`,
    itemsDescription: data.itemsDescription || items.map((i) => `${i.productName} x${i.quantity}`).join(', '),
    items,
    totalAmount,
    paidAmount: initialPaid,
    payments: initialPaid > 0 ? [{ amount: initialPaid, date: new Date(), method: data.paymentMethod || 'Cash', note: 'Advance with order' }] : [],
    status: 'Pending',
    orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
    expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : null,
    notes: data.notes || '',
  });
};

exports.updateOrder = async (id, data, shopId) => {
  const order = await SupplierOrder.findOne({ _id: id, shopId });
  if (!order) throw new Error('Order not found');
  if (data.notes !== undefined) order.notes = data.notes;
  if (data.expectedDelivery !== undefined) order.expectedDelivery = data.expectedDelivery ? new Date(data.expectedDelivery) : null;
  if (data.status === 'Confirmed' && order.status === 'Pending') order.status = 'Confirmed';
  await order.save();
  return order;
};

exports.cancelOrder = async (id, shopId) => {
  const order = await SupplierOrder.findOne({ _id: id, shopId });
  if (!order) throw new Error('Order not found');
  if (order.stockApplied) throw new Error('Stock from this order is already in inventory and cannot be cancelled');
  order.status = 'Cancelled';
  await order.save();
  return order;
};

// ── Payments (partial payments supported) ───────────────────────────────────
exports.addPayment = async (id, shopId, { amount, date, method, note }) => {
  const order = await SupplierOrder.findOne({ _id: id, shopId });
  if (!order) throw new Error('Order not found');
  if (order.status === 'Cancelled') throw new Error('Cannot pay a cancelled order');
  const amt = Number(amount);
  if (!(amt > 0)) throw new Error('Payment amount must be greater than 0');
  const pending = order.totalAmount - order.paidAmount;
  if (amt > pending) throw new Error(`Payment exceeds pending amount (Rs. ${pending})`);
  if (!order.payments) order.payments = [];
  order.payments.push({ amount: amt, date: date ? new Date(date) : new Date(), method: method || 'Cash', note: note || '' });
  order.paidAmount += amt;
  await order.save();
  return order;
};

exports.removePayment = async (id, paymentId, shopId) => {
  const order = await SupplierOrder.findOne({ _id: id, shopId });
  if (!order) throw new Error('Order not found');
  const p = order.payments.id(paymentId);
  if (!p) throw new Error('Payment not found');
  order.paidAmount = Math.max(0, order.paidAmount - p.amount);
  p.deleteOne();
  await order.save();
  return order;
};

// ── Receive stock ───────────────────────────────────────────────────────────
// Marks the order delivered and adds the quantities to inventory. Cost price is
// updated using a weighted average, so profit reports stay realistic.
exports.receiveOrder = async (id, shop) => {
  const order = await SupplierOrder.findOne({ _id: id, shopId: shop._id });
  if (!order) throw new Error('Order not found');
  if (order.status === 'Cancelled') throw new Error('Order is cancelled');
  if (order.stockApplied) throw new Error('Stock for this order was already received');

  const Product = productModelFor(shop);
  const skipped = [];
  for (const item of order.items) {
    if (!item.productId) { skipped.push(item.productName); continue; }
    const p = await Product.findOne({ _id: item.productId, shopId: shop._id });
    if (!p) { skipped.push(item.productName); continue; }
    const oldQty = Math.max(0, p.stockQuantity);
    const oldCost = p.costPrice || 0;
    const newQty = oldQty + item.quantity;
    if (item.unitCost > 0) p.costPrice = Math.round(((oldQty * oldCost + item.quantity * item.unitCost) / newQty) * 100) / 100;
    p.stockQuantity = newQty;
    p.updatedAt = new Date();
    await p.save();
  }
  order.status = 'Delivered';
  order.actualDelivery = new Date();
  order.stockApplied = true;
  await order.save();
  return { order, skipped };
};

// ── Totals ──────────────────────────────────────────────────────────────────
exports.getTotalPendingAmount = async (shopId) => {
  const orders = await SupplierOrder.find({ shopId, status: { $ne: 'Cancelled' } });
  return sum(orders, (o) => o.totalAmount - o.paidAmount);
};

exports.getOverview = async (shopId) => {
  const orders = await SupplierOrder.find({ shopId });
  const active = orders.filter(live);
  const { year, month } = localParts(new Date());
  const { start, end } = monthRange(year, month);
  const inMonth = active.filter((o) => o.orderDate >= start && o.orderDate < end);
  const paidThisMonth = sum(active, (o) => sum((o.payments || []).filter((p) => p.date >= start && p.date < end), (p) => p.amount));
  return {
    totalPurchased: sum(active, (o) => o.totalAmount),
    totalPaid: sum(active, (o) => o.paidAmount),
    totalPending: sum(active, (o) => o.totalAmount - o.paidAmount),
    openDeliveries: active.filter((o) => o.status !== 'Delivered').length,
    purchasedThisMonth: sum(inMonth, (o) => o.totalAmount),
    paidThisMonth,
  };
};
