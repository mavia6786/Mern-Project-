const mongoose = require('mongoose');

const supplierOrderSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  orderNumber: { type: String, maxlength: 100, default: '' },
  itemsDescription: { type: String, maxlength: 1000, default: '' },
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  // Pending, Confirmed, Delivered, Cancelled
  status: { type: String, maxlength: 50, default: 'Pending' },
  orderDate: { type: Date, default: Date.now },
  expectedDelivery: { type: Date, default: null },
  actualDelivery: { type: Date, default: null },
  notes: { type: String, maxlength: 500, default: '' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
});

// Mirrors the C# [NotMapped] PendingAmount computed property
supplierOrderSchema.virtual('pendingAmount').get(function () {
  return this.totalAmount - this.paidAmount;
});
supplierOrderSchema.set('toJSON', { virtuals: true });
supplierOrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SupplierOrder', supplierOrderSchema);
