const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, maxlength: 200, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Owner, Manager, Staff
    role: { type: String, maxlength: 50, default: 'Manager' },
    phone: { type: String, maxlength: 20, default: '' },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

module.exports = mongoose.model('User', userSchema);
