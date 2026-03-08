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

// Credentials from environment variables with defaults
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'adminpass';

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
    undertime: 'Undertime',
    week: 'Week',
    // Navigation
    navSchedule: 'Schedule',
    navHolidays: 'Holidays',
    // Holiday page
    holidayHours: 'Holiday Hours',
    currentSaldo: 'Available',
    plannedSaldo: 'Planned',
    actualSaldo: 'Taken',
    yearlyAllocation: 'Yearly Allocation',
    addHoliday: 'Add Holiday',
    editHoliday: 'Edit Holiday',
    deleteHoliday: 'Delete',
    holidayDate: 'Date',
    holidayStatus: 'Status',
    planned: 'Planned',
    actualStatus: 'Taken',
    holidayList: 'Holiday Entries',
    noHolidays: 'No holiday entries yet',
    holidaySaved: 'Holiday saved successfully!',
    holidayDeleted: 'Holiday deleted!',
    selectYear: 'Select Year',
    cancel: 'Cancel',
    confirm: 'Confirm',
    confirmDelete: 'Are you sure you want to delete this entry?'
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
    undertime: 'Недопрацювання',
    week: 'Тиждень',
    // Navigation
    navSchedule: 'Розклад',
    navHolidays: 'Відпустка',
    // Holiday page
    holidayHours: 'Години відпустки',
    currentSaldo: 'Доступно',
    plannedSaldo: 'Заплановано',
    actualSaldo: 'Використано',
    yearlyAllocation: 'Річний ліміт',
    addHoliday: 'Додати відпустку',
    editHoliday: 'Редагувати відпустку',
    deleteHoliday: 'Видалити',
    holidayDate: 'Дата',
    holidayStatus: 'Статус',
    planned: 'Заплановано',
    actualStatus: 'Використано',
    holidayList: 'Записи відпусток',
    noHolidays: 'Записів відпусток ще немає',
    holidaySaved: 'Відпустку успішно збережено!',
    holidayDeleted: 'Відпустку видалено!',
    selectYear: 'Вибрати рік',
    cancel: 'Скасувати',
    confirm: 'Підтвердити',
    confirmDelete: 'Ви впевнені, що хочете видалити цей запис?'
  },
  nl: {
    appTitle: 'Rooster Tracker',
    login: 'Inloggen',
    username: 'Gebruikersnaam',
    password: 'Wachtwoord',
    loginBtn: 'Aanmelden',
    logout: 'Uitloggen',
    invalidCredentials: 'Ongeldige gebruikersnaam of wachtwoord',
    weeklySchedule: 'Weekrooster',
    day: 'Dag',
    scheduled: 'Gepland',
    actual: 'Werkelijk',
    start: 'Begin',
    end: 'Einde',
    dayOff: 'Vrije dag',
    monday: 'Maandag',
    tuesday: 'Dinsdag',
    wednesday: 'Woensdag',
    thursday: 'Donderdag',
    friday: 'Vrijdag',
    saturday: 'Zaterdag',
    weekTotalScheduled: 'Week totaal gepland',
    weekTotalActual: 'Week totaal werkelijk',
    weekDifference: 'Week verschil',
    cumulativeOvertime: 'Cumulatief overwerk/onderwerk',
    hours: 'uur',
    save: 'Week opslaan',
    selectWeek: 'Selecteer week',
    baseWorkweek: 'Basis werkweek',
    currentWeek: 'Huidige week',
    previousWeeks: 'Vorige weken',
    noData: 'Nog geen gegevens opgeslagen',
    saved: 'Week succesvol opgeslagen!',
    overtime: 'Overwerk',
    undertime: 'Onderwerk',
    week: 'Week',
    // Navigation
    navSchedule: 'Rooster',
    navHolidays: 'Vakantie',
    // Holiday page
    holidayHours: 'Vakantie-uren',
    currentSaldo: 'Beschikbaar',
    plannedSaldo: 'Gepland',
    actualSaldo: 'Opgenomen',
    yearlyAllocation: 'Jaarlijkse toewijzing',
    addHoliday: 'Vakantie toevoegen',
    editHoliday: 'Vakantie bewerken',
    deleteHoliday: 'Verwijderen',
    holidayDate: 'Datum',
    holidayStatus: 'Status',
    planned: 'Gepland',
    actualStatus: 'Opgenomen',
    holidayList: 'Vakantie-items',
    noHolidays: 'Nog geen vakantie-items',
    holidaySaved: 'Vakantie succesvol opgeslagen!',
    holidayDeleted: 'Vakantie verwijderd!',
    selectYear: 'Selecteer jaar',
    cancel: 'Annuleren',
    confirm: 'Bevestigen',
    confirmDelete: 'Weet u zeker dat u dit item wilt verwijderen?'
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
    defaultSchedule: DEFAULT_SCHEDULE,
    activePage: 'schedule'
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

// Validate that time is on 15-minute interval (00, 15, 30, 45)
function isValid15MinuteInterval(timeStr) {
  if (!timeStr || timeStr === '') return true; // Empty is allowed
  const parts = timeStr.split(':');
  if (parts.length !== 2) return false;
  const minutes = parseInt(parts[1]);
  return [0, 15, 30, 45].includes(minutes);
}

// Round to nearest 15-minute interval
function roundTo15Minutes(timeStr) {
  if (!timeStr || timeStr === '') return timeStr;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return timeStr;
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const roundedMinutes = Math.round(minutes / 15) * 15;
  const finalHours = roundedMinutes === 60 ? hours + 1 : hours;
  const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
  return `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
}

app.post('/api/week', requireAuth, (req, res) => {
  const { weekStart, entries } = req.body;
  
  // Baseline work week is 32 hours
  const BASELINE_HOURS = 32;
  
  // Calculate actual hours and validate/round 15-minute intervals
  let actualMinutes = 0;
  const validatedEntries = {};
  
  Object.entries(entries).forEach(([day, dayEntry]) => {
    // Round times to nearest 15-minute interval
    const startTime = roundTo15Minutes(dayEntry.start);
    const endTime = roundTo15Minutes(dayEntry.end);
    
    validatedEntries[day] = { start: startTime, end: endTime };
    
    if (startTime !== '' && endTime !== '' && startTime !== undefined && endTime !== undefined) {
      const startParts = startTime.split(':');
      const endParts = endTime.split(':');
      const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      if (endMin > startMin) {
        actualMinutes += (endMin - startMin);
      }
    }
  });
  
  const scheduledHours = BASELINE_HOURS;
  const actualHours = actualMinutes / 60;
  const difference = actualHours - BASELINE_HOURS;
  
  db.saveWeek(weekStart, validatedEntries, scheduledHours, actualHours, difference);
  
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

// Holiday Routes
app.get('/holidays', requireAuth, (req, res) => {
  const lang = req.session.lang || 'en';
  const t = translations[lang];
  const currentYear = new Date().getFullYear();
  const year = parseInt(req.query.year) || currentYear;
  
  const holidays = db.getHolidaysByYear(year);
  const summary = db.getHolidaySummary(year);
  
  res.render('holidays', {
    t,
    lang,
    year,
    currentYear,
    holidays,
    summary,
    activePage: 'holidays'
  });
});

app.get('/api/holidays/:year', requireAuth, (req, res) => {
  const year = parseInt(req.params.year);
  const holidays = db.getHolidaysByYear(year);
  const summary = db.getHolidaySummary(year);
  res.json({ holidays, summary });
});

app.post('/api/holiday', requireAuth, (req, res) => {
  const { date, hours, status } = req.body;
  
  if (!date || !hours || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (!['planned', 'actual'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  const result = db.saveHoliday(date, parseFloat(hours), status);
  const year = new Date(date).getFullYear();
  const summary = db.getHolidaySummary(year);
  
  res.json({ success: true, id: result.lastInsertRowid, summary });
});

app.put('/api/holiday/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { date, hours, status } = req.body;
  
  if (!date || !hours || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.updateHoliday(id, date, parseFloat(hours), status);
  const year = new Date(date).getFullYear();
  const summary = db.getHolidaySummary(year);
  
  res.json({ success: true, summary });
});

app.delete('/api/holiday/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const holiday = db.getHoliday(id);
  
  if (!holiday) {
    return res.status(404).json({ error: 'Holiday not found' });
  }
  
  db.deleteHoliday(id);
  const summary = db.getHolidaySummary(holiday.year);
  
  res.json({ success: true, summary });
});

function detectLanguage(req) {
  const acceptLang = req.headers['accept-language'] || '';
  const langLower = acceptLang.toLowerCase();
  if (langLower.includes('uk')) {
    return 'uk';
  }
  if (langLower.includes('nl')) {
    return 'nl';
  }
  return 'en';
}

// Initialize database and start server
db.init();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Schedule Tracker running on http://localhost:${PORT}`);
});
