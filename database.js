const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const DB_PATH = path.join(__dirname, 'pahadnama.db');
const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Create tables
db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  name TEXT DEFAULT 'Admin',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS treks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT DEFAULT '',
  location TEXT NOT NULL,
  region TEXT DEFAULT 'Sahyadri, Maharashtra',
  difficulty TEXT DEFAULT 'Moderate',
  duration TEXT DEFAULT '1 Day',
  distance TEXT DEFAULT '8 km',
  height TEXT DEFAULT '3,500 ft',
  season TEXT DEFAULT 'Monsoon & Winter',
  price INTEGER DEFAULT 999,
  original_price INTEGER DEFAULT 1499,
  cover_photo TEXT DEFAULT '',
  short_description TEXT DEFAULT '',
  description TEXT DEFAULT '',
  highlights TEXT DEFAULT '[]',
  itinerary TEXT DEFAULT '[]',
  inclusions TEXT DEFAULT '[]',
  exclusions TEXT DEFAULT '[]',
  meeting_point TEXT DEFAULT '',
  pickups TEXT DEFAULT '[]',
  things_to_carry TEXT DEFAULT '[]',
  instructions TEXT DEFAULT '',
  cancellation_policy TEXT DEFAULT '',
  is_featured INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trek_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trek_id INTEGER NOT NULL,
  event_date TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  total_seats INTEGER DEFAULT 30,
  available_seats INTEGER DEFAULT 30,
  status TEXT DEFAULT 'AVAILABLE',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(trek_id) REFERENCES treks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trek_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(trek_id) REFERENCES treks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trek_id INTEGER,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_num INTEGER DEFAULT 0,
  FOREIGN KEY(trek_id) REFERENCES treks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trek_id INTEGER,
  name TEXT NOT NULL,
  trek_name TEXT DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  photo TEXT DEFAULT '',
  approved INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(trek_id) REFERENCES treks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_code TEXT UNIQUE NOT NULL,
  trek_id INTEGER,
  trek_name TEXT NOT NULL,
  batch_date TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_age INTEGER DEFAULT NULL,
  customer_email TEXT DEFAULT '',
  participants INTEGER DEFAULT 1,
  pickup_location TEXT DEFAULT '',
  total_amount REAL NOT NULL,
  payment_method TEXT DEFAULT 'razorpay',
  payment_status TEXT DEFAULT 'PENDING',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(trek_id) REFERENCES treks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

try {
  db.prepare("ALTER TABLE bookings ADD COLUMN customer_age INTEGER DEFAULT NULL").run();
} catch (e) {
  // column already exists
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  try {
    const check = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

// Ensure default settings exist
const defaultSettings = {
  whatsapp_number: '919137761400',
  contact_phone: '+91 91377 61400',
  contact_email: 'pahadnamatrails@gmail.com',
  instagram: '@pahadnama.trails',
  google_form_url: 'https://forms.gle/pahadnamatrails',
  upi_id: 'pahadnamatrails@okaxis',
  upi_name: 'Pahadnama Trails',
  payment_qr: '/brand/payment-qr.png',
  brand_logo: '/brand/pahadnama-logo.png',
  brand_tagline: 'Safar Jahan Manzil Se Zyada Khoobsurat Hai',
  booking_instructions: '1. Pay the advance/full amount via UPI or QR scan.\n2. Take a screenshot of the transaction.\n3. Send the screenshot along with your name, trek name, and chosen date on WhatsApp to confirm your slot!',
  razorpay_enabled: 'true',
  razorpay_key_id: 'rzp_test_5172839485',
  razorpay_key_secret: 'rzp_test_secret_demo',
  razorpay_currency: 'INR',
  site_bg_color: '#ffffff',
  site_bg_image: '',
  site_bg_opacity: '15'
};

const setStmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(defaultSettings)) {
  setStmt.run(key, value);
}

// Ensure the.life.passenger exists with password vivektrails
db.prepare("DELETE FROM admins WHERE username != 'the.life.passenger'").run();
const adminCheck = db.prepare('SELECT id FROM admins WHERE username = ?').get('the.life.passenger');
const { hash: lifeHash, salt: lifeSalt } = hashPassword('vivektrails');
if (!adminCheck) {
  db.prepare('INSERT INTO admins (username, password_hash, salt, name) VALUES (?, ?, ?, ?)').run(
    'the.life.passenger', lifeHash, lifeSalt, 'Vivek Chauhan'
  );
} else {
  db.prepare('UPDATE admins SET password_hash = ?, salt = ? WHERE username = ?').run(
    lifeHash, lifeSalt, 'the.life.passenger'
  );
}

module.exports = {
  db,
  hashPassword,
  verifyPassword
};
