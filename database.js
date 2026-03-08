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
    
    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      hours REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('planned', 'actual')),
      year INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
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

// Holiday functions
const YEARLY_HOLIDAY_HOURS = 128; // 128 hours per year for 32-hour contract

function saveHoliday(date, hours, status) {
  const year = new Date(date).getFullYear();
  const stmt = db.prepare(`
    INSERT INTO holidays (date, hours, status, year)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(date, hours, status, year);
}

function updateHoliday(id, date, hours, status) {
  const year = new Date(date).getFullYear();
  const stmt = db.prepare(`
    UPDATE holidays SET date = ?, hours = ?, status = ?, year = ?
    WHERE id = ?
  `);
  return stmt.run(date, hours, status, year, id);
}

function deleteHoliday(id) {
  const stmt = db.prepare('DELETE FROM holidays WHERE id = ?');
  return stmt.run(id);
}

function getHoliday(id) {
  const stmt = db.prepare('SELECT * FROM holidays WHERE id = ?');
  return stmt.get(id);
}

function getHolidaysByYear(year) {
  const stmt = db.prepare('SELECT * FROM holidays WHERE year = ? ORDER BY date ASC');
  return stmt.all(year);
}

function getHolidaySummary(year) {
  const stmt = db.prepare(`
    SELECT 
      status,
      SUM(hours) as total_hours
    FROM holidays
    WHERE year = ?
    GROUP BY status
  `);
  const rows = stmt.all(year);
  
  let plannedHours = 0;
  let actualHours = 0;
  
  rows.forEach(row => {
    if (row.status === 'planned') plannedHours = row.total_hours || 0;
    if (row.status === 'actual') actualHours = row.total_hours || 0;
  });
  
  const currentSaldo = YEARLY_HOLIDAY_HOURS - plannedHours - actualHours;
  
  return {
    yearlyAllocation: YEARLY_HOLIDAY_HOURS,
    plannedHours,
    actualHours,
    currentSaldo
  };
}

module.exports = {
  init,
  saveWeek,
  getWeek,
  getAllWeeks,
  getCumulativeOvertime,
  saveHoliday,
  updateHoliday,
  deleteHoliday,
  getHoliday,
  getHolidaysByYear,
  getHolidaySummary,
  YEARLY_HOLIDAY_HOURS
};
