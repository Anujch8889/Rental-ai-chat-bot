require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');

// Frontend build path (relative to repo root when deployed)
const FRONTEND_DIST = path.join(__dirname, '../../frontend/dist');

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

// ──────────────────────────────────────
// Serve Frontend (React App)
// ──────────────────────────────────────
app.use(express.static(FRONTEND_DIST));

// React Router — sab unknown routes ke liye index.html
app.get('*', (req, res) => {
  const indexPath = path.join(FRONTEND_DIST, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ success: false, error: 'Route not found' });
    }
  });
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
