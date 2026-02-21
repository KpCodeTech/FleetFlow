require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes        = require('./routes/auth');
const vehicleRoutes     = require('./routes/vehicles');
const driverRoutes      = require('./routes/drivers');
const tripRoutes        = require('./routes/trips');
const maintenanceRoutes = require('./routes/maintenance');
const expenseRoutes     = require('./routes/expenses');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/vehicles',    vehicleRoutes);
app.use('/api/drivers',     driverRoutes);
app.use('/api/trips',       tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/expenses',    expenseRoutes);

// ── Health Check ────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'FleetFlow Core API', port: PORT, timestamp: new Date() })
);

// ── 404 Handler ─────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global Error Handler ────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ── Start Server ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 FleetFlow Core API running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Kill the existing process first.`);
    process.exit(1);
  }
});