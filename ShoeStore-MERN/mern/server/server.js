require('dotenv').config();
try { require('express-async-errors'); } catch (e) { console.warn('Run `npm install` (express-async-errors missing)'); } // async route errors -> error handler instead of crashing
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const shoesRoutes = require('./routes/shoesRoutes');
const clothesRoutes = require('./routes/clothesRoutes');
const financeRoutes = require('./routes/financeRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/shoes', shoesRoutes);
app.use('/api/clothes', clothesRoutes);
app.use('/api/finance', financeRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Central error handler
app.use((err, req, res, next) => {
  if (err.name === 'CastError' || err.name === 'ValidationError') {
    return res.status(400).json({ message: err.name === 'CastError' ? 'Invalid id or value.' : err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please close the other process or use a different port.`);
  } else {
    console.error('Server error:', err);
  }
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    const mongoose = require('mongoose');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
  setTimeout(() => process.exit(1), 5000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
