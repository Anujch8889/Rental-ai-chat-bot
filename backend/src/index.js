require('dotenv').config();

const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// ──────────────────────────────────────
// Middleware
// ──────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ──────────────────────────────────────
// Routes
// ──────────────────────────────────────
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Rental AI Chatbot Backend',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ──────────────────────────────────────
// Start Server
// ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏠 Rental AI Chatbot Backend`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`👑 Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
// Trigger reload for new API key
