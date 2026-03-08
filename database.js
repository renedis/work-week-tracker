const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'schedule.db');

let db;

function init() {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  db = new Database(DB_PATH);
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS weeks (
      week_start TEXT PRIMARY KEY,
      entries TEXT,
      scheduled_hours REAL,
      actual_hours REAL,
      difference REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  
  console.log('Database initialized at:', DB_PATH);
}

function saveWeek(weekStart, entries, scheduledHours, actualHours, difference) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO weeks (week_start, entries, scheduled_hours, actual_hours, difference)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(weekStart, JSON.stringify(entries), scheduledHours, actualHours, difference);
}

function getWeek(weekStart) {
  const stmt = db.prepare('SELECT * FROM weeks WHERE week_start = ?');
  const row = stmt.get(weekStart);
  if (row) {
    return {
      weekStart: row.week_start,
      entries: JSON.parse(row.entries),
      scheduledHours: row.scheduled_hours,
      actualHours: row.actual_hours,
      difference: row.difference
    };
  }
  return null;
}

function getAllWeeks() {
  const stmt = db.prepare('SELECT * FROM weeks ORDER BY week_start DESC');
  const rows = stmt.all();
  return rows.map(row => ({
    weekStart: row.week_start,
    entries: JSON.parse(row.entries),
    scheduledHours: row.scheduled_hours,
    actualHours: row.actual_hours,
    difference: row.difference
  }));
}

function getCumulativeOvertime() {
  const stmt = db.prepare('SELECT SUM(difference) as total FROM weeks');
  const row = stmt.get();
  return row.total || 0;
}

module.exports = {
  init,
  saveWeek,
  getWeek,
  getAllWeeks,
  getCumulativeOvertime
};
