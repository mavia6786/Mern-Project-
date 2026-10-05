const authService = require('../services/authService');
const { signToken } = require('../middleware/auth');

function serializeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone,
    shopId: user.shopId ? (user.shopId._id || user.shopId) : null,
    isActive: user.isActive,
  };
}

function serializeShop(shop) {
  if (!shop) return null;
  return {
    id: shop._id,
    name: shop.name,
    ownerName: shop.ownerName,
    phone: shop.phone,
    address: shop.address,
    city: shop.city,
    email: shop.email,
    type: shop.type,
    isActive: shop.isActive,
  };
}

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  const user = await authService.login(email, password);
  if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

  const token = signToken(user._id);
  res.json({
    token,
    user: serializeUser(user),
    shop: serializeShop(user.shopId),
  });
};

exports.register = async (req, res) => {
  const { fullName, email, password, phone } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Full name, email and password are required.' });
  }

  const result = await authService.register({ fullName, email, password, phone: phone || '' });
  if (!result.success) return res.status(409).json({ message: result.message });

  const token = signToken(result.user._id);
  res.json({ token, user: serializeUser(result.user), shop: null });
};

exports.registerShop = async (req, res) => {
  const { name, ownerName, phone, address, city, email, type } = req.body;
  if (!name || !type) return res.status(400).json({ message: 'Shop name and type are required.' });

  const result = await authService.registerShop(req.user._id, {
    name,
    ownerName: ownerName || '',
    phone: phone || '',
    address: address || '',
    city: city || '',
    email: email || null,
    type,
  });

  if (!result.success) return res.status(400).json({ message: result.message });

  res.json({
    message: result.message,
    user: serializeUser(result.user),
    shop: serializeShop(result.shop),
  });
};

exports.me = async (req, res) => {
  res.json({ user: serializeUser(req.user), shop: serializeShop(req.shop) });
};
