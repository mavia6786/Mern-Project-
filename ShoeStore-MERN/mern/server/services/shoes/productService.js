const Product = require('../../models/shoes/Product');

exports.getAll = (shopId) => Product.find({ shopId, isActive: true }).sort({ createdAt: -1 });

exports.getLowStock = (shopId) =>
  Product.find({ shopId, isActive: true, $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] } }).sort({ stockQuantity: 1 });

// Every by-id operation is scoped to the shop, so one shop can never touch another shop's data.
exports.getById = (id, shopId) => Product.findOne({ _id: id, shopId });

exports.create = (data) => Product.create({ ...data, updatedAt: new Date() });

const EDITABLE = ['name', 'brand', 'category', 'subCategory', 'costPrice', 'price', 'originalPrice', 'stockQuantity',
  'lowStockThreshold', 'sizesJson', 'colorsJson', 'imageUrl', 'description', 'isActive'];

exports.update = async (id, data, shopId) => {
  const set = { updatedAt: new Date() };
  EDITABLE.forEach((k) => { if (data[k] !== undefined) set[k] = data[k]; });
  return Product.findOneAndUpdate({ _id: id, shopId }, set, { new: true });
};

exports.remove = (id, shopId) => Product.findOneAndUpdate({ _id: id, shopId }, { isActive: false });

exports.updateStock = (id, newQuantity, shopId) =>
  Product.findOneAndUpdate({ _id: id, shopId }, { stockQuantity: Math.max(0, Number(newQuantity) || 0), updatedAt: new Date() }, { new: true });

exports.getBrands = async (shopId) => (await Product.distinct('brand', { shopId, isActive: true })).sort();

exports.getTotalProducts = (shopId) => Product.countDocuments({ shopId, isActive: true });

exports.getLowStockCount = (shopId) =>
  Product.countDocuments({ shopId, isActive: true, $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] } });

exports.getOutOfStockCount = (shopId) => Product.countDocuments({ shopId, isActive: true, stockQuantity: 0 });
