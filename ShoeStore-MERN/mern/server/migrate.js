// One-time upgrade for databases created BEFORE profit/loss support.
//   npm run migrate
// Shoe products had no cost price. Profit needs one, so we fill a placeholder
// (70% of selling price) wherever it is missing. Edit real cost prices afterwards
// in Products -> Edit, or just receive stock from a Supplier order (cost is then averaged automatically).
require('dotenv').config();
const connectDB = require('./config/db');
const ShoeProduct = require('./models/shoes/Product');

(async () => {
  await connectDB();
  const missing = await ShoeProduct.find({ $or: [{ costPrice: { $exists: false } }, { costPrice: 0 }, { costPrice: null }] });
  for (const p of missing) {
    p.costPrice = Math.round((p.price || 0) * 0.7);
    await p.save();
  }
  console.log(`Shoe products updated with placeholder cost (70% of price): ${missing.length}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
