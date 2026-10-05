const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Shop = require('../models/Shop');

async function login(email, password) {
  const user = await User.findOne({ email }).populate('shopId');
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

async function register({ fullName, email, password, phone }) {
  const exists = await User.findOne({ email });
  if (exists) return { success: false, message: 'An account with this email already exists.' };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email,
    passwordHash,
    phone,
    role: 'Owner',
    isActive: true,
  });

  return { success: true, user };
}

async function registerShop(userId, { name, ownerName, phone, address, city, email, type }) {
  const user = await User.findById(userId);
  if (!user) return { success: false, message: 'You must be logged in to register a shop.' };

  const shop = await Shop.create({
    name,
    ownerName,
    phone,
    address,
    city,
    email,
    type,
  });

  user.shopId = shop._id;
  user.role = 'Owner';
  await user.save();

  return { success: true, message: `${type} shop '${name}' created successfully!`, shop, user };
}

module.exports = { login, register, registerShop };
