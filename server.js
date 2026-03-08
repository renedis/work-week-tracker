const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'schedule-tracker-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Hardcoded credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'adminpass';

// Default schedule (in minutes from midnight, -1 = day off)
const DEFAULT_SCHEDULE = {
  monday: { start: -1, end: -1 },
  tuesday: { start: -1, end: -1 },
  wednesday: { start: 11 * 60, end: 17 * 60 },  // 11:00 - 17:00
  thursday: { start: 7 * 60, end: 17 * 60 },    // 07:00 - 17:00
  friday: { start: 7 * 60 + 30, end: 17 * 60 }, // 07:30 - 17:00
  saturday: { start: 7 * 60, end: 17 * 60 }     // 07:00 - 17:00
};

// Translations
const translations = {
  en: {
    appTitle: 'Schedule Tracker',
    login: 'Login',
    username: 'Username',
    password: 'Password',
    loginBtn: 'Sign In',
    logout: 'Logout',
    invalidCredentials: 'Invalid username or password',
    weeklySchedule: 'Weekly Schedule',
    day: 'Day',
    scheduled: 'Scheduled',
    actual: 'Actual',
    start: 'Start',
    end: 'End',
    dayOff: 'Day Off',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    weekTotalScheduled: 'Week Total Scheduled',
    weekTotalActual: 'Week Total Actual',
    weekDifference: 'Week Difference',
    cumulativeOvertime: 'Cumulative Overtime/Undertime',
    hours: 'hours',
    save: 'Save Week',
    selectWeek: 'Select Week',
    baseWorkweek: 'Base Workweek',
    currentWeek: 'Current Week',
    previousWeeks: 'Previous Weeks',
    noData: 'No data saved yet',
    saved: 'Week saved successfully!',
    overtime: 'Overtime',
    undertime: 'Undertime'
  },
  uk: {
    appTitle: 'Трекер Розкладу',
    login: 'Вхід',
    username: "Ім'я користувача",
    password: 'Пароль',
    loginBtn: 'Увійти',
    logout: 'Вийти',
    invalidCredentials: "Невірне ім'я користувача або пароль",
    weeklySchedule: 'Тижневий Розклад',
    day: 'День',
    scheduled: 'Заплановано',
    actual: 'Фактично',
    start: 'Початок',
    end: 'Кінець',
    dayOff: 'Вихідний',
    monday: 'Понеділок',
    tuesday: 'Вівторок',
    wednesday: 'Середа',
    thursday: 'Четвер',
    friday: "П'ятниця",
    saturday: 'Субота',
    weekTotalScheduled: 'Всього заплановано за тиждень',
    weekTotalActual: 'Всього фактично за тиждень',
    weekDifference: 'Різниця за тиждень',
    cumulativeOvertime: 'Накопичені понаднормові/недопрацювання',
    hours: 'годин',
    save: 'Зберегти тиждень',
    selectWeek: 'Вибрати тиждень',
    baseWorkweek: 'Базовий робочий тиждень',
    currentWeek: 'Поточний тиждень',
    previousWeeks: 'Попередні тижні',
    noData: 'Даних ще немає',
    saved: 'Тиждень успішно збережено!',
    overtime: 'Понаднормові',
    undertime: 'Недопрацювання'
  }
};

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.redirect('/login');
}

// Routes
app.get('/', requireAuth, (req, res) => {
  const lang = req.session.lang || 'en';
  const t = translations[lang];
  const weeks = db.getAllWeeks();
  const cumulative = db.getCumulativeOvertime();
  
  res.render('index', { 
    t, 
    lang, 
    weeks,
    cumulative,
    defaultSchedule: DEFAULT_SCHEDULE
  });
});

app.get('/login', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/');
  }
  const lang = req.query.lang || req.session.lang || detectLanguage(req) || 'en';
  req.session.lang = lang;
  const t = translations[lang];
  res.render('login', { t, lang, error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const lang = req.session.lang || 'en';
  const t = translations[lang];
  
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.authenticated = true;
    res.redirect('/');
  } else {
    res.render('login', { t, lang, error: t.invalidCredentials });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.post('/api/set-language', (req, res) => {
  const { lang } = req.body;
  if (translations[lang]) {
    req.session.lang = lang;
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid language' });
  }
});

app.get('/api/week/:weekStart', requireAuth, (req, res) => {
  const week = db.getWeek(req.params.weekStart);
  res.json(week || { entries: {} });
});

app.post('/api/week', requireAuth, (req, res) => {
  const { weekStart, entries } = req.body;
  
  // Calculate scheduled hours from defaults
  let scheduledMinutes = 0;
  Object.values(DEFAULT_SCHEDULE).forEach(day => {
    if (day.start >= 0 && day.end >= 0) {
      scheduledMinutes += (day.end - day.start);
    }
  });
  
  // Calculate actual hours
  let actualMinutes = 0;
  Object.values(entries).forEach(day => {
    if (day.start !== '' && day.end !== '' && day.start !== undefined && day.end !== undefined) {
      const startParts = day.start.split(':');
      const endParts = day.end.split(':');
      const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      if (endMin > startMin) {
        actualMinutes += (endMin - startMin);
      }
    }
  });
  
  const scheduledHours = scheduledMinutes / 60;
  const actualHours = actualMinutes / 60;
  const difference = actualHours - scheduledHours;
  
  db.saveWeek(weekStart, entries, scheduledHours, actualHours, difference);
  
  const cumulative = db.getCumulativeOvertime();
  
  res.json({ 
    success: true, 
    scheduledHours,
    actualHours,
    difference,
    cumulative
  });
});

app.get('/api/cumulative', requireAuth, (req, res) => {
  const cumulative = db.getCumulativeOvertime();
  res.json({ cumulative });
});

function detectLanguage(req) {
  const acceptLang = req.headers['accept-language'] || '';
  if (acceptLang.toLowerCase().includes('uk')) {
    return 'uk';
  }
  return 'en';
}

// Initialize database and start server
db.init();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Schedule Tracker running on http://localhost:${PORT}`);
});
