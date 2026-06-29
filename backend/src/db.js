const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Cross-platform path: works on Windows locally and Linux on Render
const dataDir = process.env.DB_DATA_DIR || path.join(__dirname, '../data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'rental_chatbot.db');
console.log('🗄️  Database path:', dbPath);
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ──────────────────────────────────────
// Create Tables
// ──────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    email TEXT,
    property_type TEXT,
    category TEXT,
    city TEXT,
    area TEXT,
    bedrooms TEXT,
    budget_min REAL,
    budget_max REAL,
    priority_notes TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES leads(session_id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
`);

// ──────────────────────────────────────
// Lead Operations
// ──────────────────────────────────────
const createLead = (sessionId) => {
  const stmt = db.prepare('INSERT INTO leads (session_id) VALUES (?)');
  return stmt.run(sessionId);
};

const getLead = (sessionId) => {
  const stmt = db.prepare('SELECT * FROM leads WHERE session_id = ?');
  return stmt.get(sessionId);
};

const getLeadById = (id) => {
  const stmt = db.prepare('SELECT * FROM leads WHERE id = ?');
  return stmt.get(id);
};

const updateLead = (sessionId, data) => {
  const allowedFields = [
    'name', 'phone', 'email', 'property_type', 'category',
    'city', 'area', 'bedrooms', 'budget_min', 'budget_max',
    'priority_notes', 'status'
  ];

  const updates = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== null && value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (updates.length === 0) return null;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(sessionId);

  const sql = `UPDATE leads SET ${updates.join(', ')} WHERE session_id = ?`;
  const stmt = db.prepare(sql);
  return stmt.run(...values);
};

const updateLeadById = (id, data) => {
  const allowedFields = ['status', 'name', 'phone', 'email', 'priority_notes'];
  const updates = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== null && value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (updates.length === 0) return null;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const sql = `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`;
  const stmt = db.prepare(sql);
  return stmt.run(...values);
};

const getAllLeads = (filters = {}) => {
  let sql = 'SELECT * FROM leads WHERE 1=1';
  const params = [];

  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.city) {
    sql += ' AND city LIKE ?';
    params.push(`%${filters.city}%`);
  }

  if (filters.search) {
    sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR city LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  sql += ' ORDER BY created_at DESC';

  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

const deleteLeadById = (id) => {
  const lead = getLeadById(id);
  if (!lead) return null;

  // Delete messages first (FK cascade should handle this, but being explicit)
  db.prepare('DELETE FROM messages WHERE session_id = ?').run(lead.session_id);
  db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  return true;
};

const getStats = () => {
  const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;

  const today = new Date().toISOString().split('T')[0];
  const newToday = db.prepare(
    "SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) = ?"
  ).get(today).count;

  const byCity = db.prepare(
    "SELECT city, COUNT(*) as count FROM leads WHERE city IS NOT NULL GROUP BY city ORDER BY count DESC"
  ).all();

  const byStatus = db.prepare(
    "SELECT status, COUNT(*) as count FROM leads GROUP BY status ORDER BY count DESC"
  ).all();

  return { totalLeads, newToday, byCity, byStatus };
};

// ──────────────────────────────────────
// Message Operations
// ──────────────────────────────────────
const addMessage = (sessionId, role, content) => {
  const stmt = db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)');
  return stmt.run(sessionId, role, content);
};

const getMessages = (sessionId) => {
  const stmt = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC');
  return stmt.all(sessionId);
};

module.exports = {
  db,
  createLead,
  getLead,
  getLeadById,
  updateLead,
  updateLeadById,
  getAllLeads,
  deleteLeadById,
  getStats,
  addMessage,
  getMessages,
};
