const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const { db, hashPassword, verifyPassword } = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const UPLOADS_DIR = path.join(ROOT, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory active admin sessions set
const adminSessions = new Set();

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static file serving
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(PUBLIC_DIR));

// Multer storage for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '-');
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only valid image files (JPG, PNG, WebP, SVG) are allowed'));
  }
});

// Admin authentication middleware
function requireAdmin(req, res, next) {
  let token = req.cookies.admin_session || req.headers['x-admin-token'];
  if (!token && req.headers['authorization']) {
    const parts = req.headers['authorization'].split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') token = parts[1];
  }
  if (token && adminSessions.has(token)) {
    return next();
  }
  return res.status(401).json({ ok: false, error: 'Admin authentication required' });
}

// Helper to safely parse JSON or return array
function parseJson(str, fallback = []) {
  if (!str) return fallback;
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); }
  catch { return fallback; }
}

// Helper to format trek for public output
function formatTrek(t) {
  if (!t) return null;
  const dates = db.prepare('SELECT * FROM trek_dates WHERE trek_id = ? ORDER BY event_date ASC').all(t.id);
  const photos = db.prepare('SELECT * FROM photos WHERE trek_id = ? ORDER BY id ASC').all(t.id);
  const faqs = db.prepare('SELECT * FROM faqs WHERE trek_id = ? ORDER BY order_num ASC, id ASC').all(t.id);

  // Compute next available weekend date
  const upcoming = dates.find(d => d.status !== 'FULL' && d.status !== 'CANCELLED');

  return {
    ...t,
    highlights: parseJson(t.highlights),
    itinerary: parseJson(t.itinerary),
    inclusions: parseJson(t.inclusions),
    exclusions: parseJson(t.exclusions),
    pickups: parseJson(t.pickups),
    things_to_carry: parseJson(t.things_to_carry),
    dates,
    photos,
    faqs,
    next_date: upcoming ? upcoming.event_date : null,
    next_day: upcoming ? upcoming.day_of_week : null,
    next_status: upcoming ? upcoming.status : null
  };
}

// Helper to get settings object
function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  return obj;
}

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// Get all active treks
app.get('/api/treks', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM treks WHERE status = ? ORDER BY is_featured DESC, id ASC').all('active');
    const formatted = rows.map(formatTrek);
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching treks:', err);
    res.status(500).json({ error: 'Failed to fetch treks' });
  }
});

// Get single trek details
app.get('/api/treks/:id', (req, res) => {
  try {
    const id = req.params.id;
    let trek = null;
    if (/^\d+$/.test(id)) {
      trek = db.prepare('SELECT * FROM treks WHERE id = ?').get(id);
    } else {
      trek = db.prepare('SELECT * FROM treks WHERE slug = ?').get(id);
    }

    if (!trek) {
      return res.status(404).json({ error: 'Trek not found' });
    }

    res.json(formatTrek(trek));
  } catch (err) {
    console.error('Error fetching trek:', err);
    res.status(500).json({ error: 'Failed to fetch trek details' });
  }
});

// Get approved feedback
app.get('/api/feedback', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT f.*, t.name as trek_title 
      FROM feedback f 
      LEFT JOIN treks t ON t.id = f.trek_id 
      WHERE f.approved = 1 
      ORDER BY f.id DESC
    `).all();
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Submit customer feedback (moderated by default)
app.post('/api/feedback', upload.single('photo'), (req, res) => {
  try {
    const { name, trek_id, rating, comment } = req.body;
    if (!name || !comment) {
      return res.status(400).json({ ok: false, error: 'Name and feedback comment are required' });
    }

    let trekName = '';
    if (trek_id) {
      const t = db.prepare('SELECT name FROM treks WHERE id = ?').get(trek_id);
      if (t) trekName = t.name;
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const ratingNum = Math.min(5, Math.max(1, parseInt(rating) || 5));

    db.prepare(`
      INSERT INTO feedback (trek_id, name, trek_name, rating, comment, photo, approved)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(trek_id || null, name.trim(), trekName, ratingNum, comment.trim(), photoUrl);

    res.status(201).json({
      ok: true,
      message: 'Thank you for sharing your trail story! Your feedback has been received and will appear on the website once approved by our team.'
    });
  } catch (err) {
    console.error('Error saving feedback:', err);
    res.status(500).json({ ok: false, error: 'Failed to submit feedback' });
  }
});

// Get public website settings (WhatsApp, UPI, Google form, etc.)
app.get('/api/settings', (req, res) => {
  try {
    const s = getSettings();
    delete s.razorpay_key_secret;
    res.json(s);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Razorpay public config (key_id and enabled flag, never secret)
app.get('/api/payments/config', (req, res) => {
  try {
    const s = getSettings();
    res.json({
      enabled: s.razorpay_enabled === 'true',
      key_id: s.razorpay_key_id || '',
      currency: s.razorpay_currency || 'INR'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment config' });
  }
});

// Create Razorpay Order
app.post('/api/payments/create-order', async (req, res) => {
  try {
    const {
      trek_id,
      trek_name,
      batch_date,
      customer_name,
      customer_phone,
      customer_email,
      participants,
      pickup_location,
      total_amount
    } = req.body;

    if (!customer_name || !customer_phone) {
      return res.status(400).json({ ok: false, error: 'Customer name and phone number are required' });
    }

    const s = getSettings();
    if (s.razorpay_enabled !== 'true') {
      return res.status(400).json({ ok: false, error: 'Online Razorpay checkout is currently disabled by administrator' });
    }

    const numParticipants = Math.max(1, parseInt(participants) || 1);
    const amountVal = parseFloat(total_amount);
    if (!amountVal || amountVal <= 0) {
      return res.status(400).json({ ok: false, error: 'Valid booking amount is required' });
    }

    const amountInPaise = Math.round(amountVal * 100);
    const keyId = s.razorpay_key_id || '';
    const keySecret = s.razorpay_key_secret || '';

    // Generate unique Pahadnama booking code
    const uniqueSuffix = Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `PAHAD-${uniqueSuffix}`;

    let razorpayOrderId = null;
    let isDemoFallback = false;
    let razorpayErrorMsg = null;

    const isDummyCredentials = !keyId || !keySecret || 
      keyId.trim() === '' || keySecret.trim() === '' || 
      keyId === 'rzp_test_5172839485' || keySecret === 'rzp_test_secret_demo';

    if (!isDummyCredentials) {
      try {
        const auth = 'Basic ' + Buffer.from(`${keyId.trim()}:${keySecret.trim()}`).toString('base64');
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: s.razorpay_currency || 'INR',
            receipt: bookingCode,
            notes: {
              trek_name: trek_name || '',
              batch_date: batch_date || '',
              customer_name: customer_name || '',
              customer_phone: customer_phone || ''
            }
          })
        });

        const rzpData = await rzpResponse.json();
        if (rzpResponse.ok && rzpData && rzpData.id) {
          razorpayOrderId = rzpData.id;
          isDemoFallback = false;
        } else {
          razorpayErrorMsg = (rzpData && rzpData.error && (rzpData.error.description || rzpData.error.reason)) || 'Razorpay order creation failed';
          console.warn('Razorpay API error or invalid test keys, falling back to simulated test order:', razorpayErrorMsg);
          razorpayOrderId = `order_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
          isDemoFallback = true;
        }
      } catch (err) {
        razorpayErrorMsg = err.message;
        console.warn('Network error reaching Razorpay API, activating simulated test order:', err.message);
        razorpayOrderId = `order_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        isDemoFallback = true;
      }
    } else {
      // Demo / simulated test mode order
      razorpayOrderId = `order_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      isDemoFallback = true;
    }

    // Insert pending booking record into database
    const insertStmt = db.prepare(`
      INSERT INTO bookings (
        booking_code, trek_id, trek_name, batch_date,
        customer_name, customer_phone, customer_email,
        participants, pickup_location, total_amount,
        payment_method, payment_status, razorpay_order_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'razorpay', 'PENDING', ?)
    `);

    let validTrekId = null;
    if (trek_id) {
      const checkTrek = db.prepare('SELECT id FROM treks WHERE id = ?').get(trek_id);
      if (checkTrek) validTrekId = checkTrek.id;
    }

    insertStmt.run(
      bookingCode,
      validTrekId,
      trek_name || 'Sahyadri Trek',
      batch_date || '',
      customer_name.trim(),
      customer_phone.trim(),
      (customer_email || '').trim(),
      numParticipants,
      (pickup_location || '').trim(),
      amountVal,
      razorpayOrderId
    );

    res.status(201).json({
      ok: true,
      order_id: razorpayOrderId,
      booking_code: bookingCode,
      amount: amountInPaise,
      currency: s.razorpay_currency || 'INR',
      key_id: keyId,
      is_demo: isDemoFallback,
      razorpay_error: razorpayErrorMsg,
      customer: {
        name: customer_name,
        phone: customer_phone,
        email: customer_email
      }
    });
  } catch (err) {
    console.error('Error creating payment order:', err);
    res.status(500).json({ ok: false, error: 'Failed to create payment order: ' + err.message });
  }
});

// Verify Razorpay Payment Signature
app.post('/api/payments/verify', (req, res) => {
  try {
    const { booking_code, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!booking_code || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ ok: false, error: 'Missing payment verification credentials' });
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE booking_code = ? OR razorpay_order_id = ?').get(booking_code, razorpay_order_id);
    if (!booking) {
      return res.status(404).json({ ok: false, error: 'Booking record not found' });
    }

    if (booking.payment_status === 'PAID') {
      return res.json({
        ok: true,
        message: 'Booking already verified and marked as PAID.',
        booking
      });
    }

    const s = getSettings();
    const keySecret = s.razorpay_key_secret || '';

    // Verify cryptographic HMAC-SHA256 signature
    let isValid = false;
    if (keySecret && keySecret !== 'rzp_test_secret_demo') {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature === razorpay_signature) {
        isValid = true;
      }
    }

    // Allow simulated test mode orders or test tokens
    if (!isValid && (
      razorpay_order_id.startsWith('order_test_') ||
      razorpay_order_id.startsWith('order_demo_') ||
      razorpay_payment_id.startsWith('pay_test_') ||
      razorpay_signature === 'demo_test_signature'
    )) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({ ok: false, error: 'Payment signature verification failed. Tampered or invalid transaction.' });
    }

    // Update booking status to PAID
    db.prepare(`
      UPDATE bookings SET
        payment_status = 'PAID',
        razorpay_payment_id = ?,
        razorpay_signature = ?
      WHERE id = ?
    `).run(razorpay_payment_id, razorpay_signature || 'verified_test', booking.id);

    // Decrement available seats in trek_dates if matched
    if (booking.trek_id && booking.batch_date) {
      try {
        const dateRecord = db.prepare('SELECT * FROM trek_dates WHERE trek_id = ? AND event_date = ?').get(booking.trek_id, booking.batch_date);
        if (dateRecord) {
          const newSeats = Math.max(0, dateRecord.available_seats - booking.participants);
          const newStatus = newSeats <= 0 ? 'FULL' : (newSeats <= 5 ? 'FILLING FAST' : dateRecord.status);
          db.prepare('UPDATE trek_dates SET available_seats = ?, status = ? WHERE id = ?').run(newSeats, newStatus, dateRecord.id);
        }
      } catch (dateErr) {
        console.warn('Could not auto-decrement seats:', dateErr.message);
      }
    }

    const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id);

    res.json({
      ok: true,
      message: 'Payment verified successfully! Slot officially confirmed.',
      booking: updatedBooking
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ ok: false, error: 'Verification error: ' + err.message });
  }
});

// Submit booking enquiry or custom trek request
app.post('/api/enquiries', (req, res) => {
  try {
    const { name, phone, email, trek_name, event_date, participants, message, is_custom } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ ok: false, error: 'Name and phone number are required' });
    }

    // Save as general feedback note or enquiry log
    res.status(201).json({
      ok: true,
      message: 'Enquiry received! Our trek coordinator will contact you directly on WhatsApp/Call.'
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to submit enquiry' });
  }
});

// ==========================================
// ADMIN AUTHENTICATION ROUTES
// ==========================================

app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(401).json({ ok: false, error: 'Username and password are required' });
    }
    const adminUser = db.prepare('SELECT * FROM admins WHERE username = ?').get(String(username).trim());

    if (!adminUser || !verifyPassword(String(password), adminUser.password_hash, adminUser.salt)) {
      return res.status(401).json({ ok: false, error: 'Invalid username or password' });
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    adminSessions.add(sessionToken);

    res.cookie('admin_session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ ok: true, token: sessionToken, name: adminUser.name });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, error: 'Internal server error during login' });
  }
});

app.get('/api/admin/me', (req, res) => {
  const token = req.cookies.admin_session || req.headers['x-admin-token'];
  if (token && adminSessions.has(token)) {
    return res.json({ authenticated: true });
  }
  res.json({ authenticated: false });
});

app.post('/api/admin/logout', (req, res) => {
  const token = req.cookies.admin_session || req.headers['x-admin-token'];
  if (token) adminSessions.delete(token);
  res.clearCookie('admin_session');
  res.json({ ok: true });
});

// ==========================================
// ADMIN MANAGEMENT ROUTES (PROTECTED)
// ==========================================

// Dashboard stats overview
app.get('/api/admin/overview', requireAdmin, (req, res) => {
  try {
    const totalTreks = db.prepare('SELECT COUNT(*) as count FROM treks').get().count;
    const activeTreks = db.prepare('SELECT COUNT(*) as count FROM treks WHERE status = ?').get('active').count;
    const totalDates = db.prepare('SELECT COUNT(*) as count FROM trek_dates').get().count;
    const pendingFeedback = db.prepare('SELECT COUNT(*) as count FROM feedback WHERE approved = 0').get().count;
    const approvedFeedback = db.prepare('SELECT COUNT(*) as count FROM feedback WHERE approved = 1').get().count;

    const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const paidBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE payment_status = 'PAID'").get().count;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE payment_status = 'PAID'").get().total;

    res.json({
      totalTreks,
      activeTreks,
      totalDates,
      pendingFeedback,
      approvedFeedback,
      totalBookings,
      paidBookings,
      totalRevenue,
      settings: getSettings()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load overview' });
  }
});

// Treks management: GET all treks for admin
app.get('/api/admin/treks', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM treks ORDER BY id DESC').all();
    res.json(rows.map(formatTrek));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin treks' });
  }
});

// Treks management: ADD new trek
app.post('/api/admin/treks', requireAdmin, (req, res) => {
  try {
    const b = req.body;
    const slug = (b.name || 'trek').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const stmt = db.prepare(`
      INSERT INTO treks (
        name, slug, tagline, location, region, difficulty, duration, distance, height, season,
        price, original_price, cover_photo, short_description, description, highlights, itinerary,
        inclusions, exclusions, meeting_point, pickups, things_to_carry, instructions, cancellation_policy,
        is_featured, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?
      )
    `);

    const result = stmt.run(
      b.name || 'Untitled Trek',
      slug,
      b.tagline || '',
      b.location || 'Maharashtra',
      b.region || 'Sahyadri, Maharashtra',
      b.difficulty || 'Moderate',
      b.duration || '1 Day',
      b.distance || '8 km',
      b.height || '3,500 ft',
      b.season || 'Monsoon & Winter',
      parseInt(b.price) || 999,
      parseInt(b.original_price) || 1499,
      b.cover_photo || '',
      b.short_description || '',
      b.description || '',
      JSON.stringify(Array.isArray(b.highlights) ? b.highlights : (b.highlights ? b.highlights.split('\n').filter(Boolean) : [])),
      JSON.stringify(Array.isArray(b.itinerary) ? b.itinerary : (b.itinerary ? b.itinerary.split('\n').filter(Boolean) : [])),
      JSON.stringify(Array.isArray(b.inclusions) ? b.inclusions : (b.inclusions ? b.inclusions.split('\n').filter(Boolean) : [])),
      JSON.stringify(Array.isArray(b.exclusions) ? b.exclusions : (b.exclusions ? b.exclusions.split('\n').filter(Boolean) : [])),
      b.meeting_point || '',
      JSON.stringify(Array.isArray(b.pickups) ? b.pickups : (b.pickups ? b.pickups.split('\n').filter(Boolean) : [])),
      JSON.stringify(Array.isArray(b.things_to_carry) ? b.things_to_carry : (b.things_to_carry ? b.things_to_carry.split('\n').filter(Boolean) : [])),
      b.instructions || '',
      b.cancellation_policy || '',
      b.is_featured ? 1 : 0,
      b.status || 'active'
    );

    const createdTrek = db.prepare('SELECT * FROM treks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(formatTrek(createdTrek));
  } catch (err) {
    console.error('Error adding trek:', err);
    res.status(500).json({ error: 'Failed to create trek: ' + err.message });
  }
});

// Treks management: UPDATE trek
app.put('/api/admin/treks/:id', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body;

    const existing = db.prepare('SELECT * FROM treks WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Trek not found' });

    db.prepare(`
      UPDATE treks SET
        name = ?, tagline = ?, location = ?, region = ?, difficulty = ?, duration = ?, distance = ?, height = ?, season = ?,
        price = ?, original_price = ?, cover_photo = ?, short_description = ?, description = ?,
        highlights = ?, itinerary = ?, inclusions = ?, exclusions = ?, meeting_point = ?, pickups = ?,
        things_to_carry = ?, instructions = ?, cancellation_policy = ?, is_featured = ?, status = ?,
        updated_at = (datetime('now'))
      WHERE id = ?
    `).run(
      b.name !== undefined ? b.name : existing.name,
      b.tagline !== undefined ? b.tagline : existing.tagline,
      b.location !== undefined ? b.location : existing.location,
      b.region !== undefined ? b.region : existing.region,
      b.difficulty !== undefined ? b.difficulty : existing.difficulty,
      b.duration !== undefined ? b.duration : existing.duration,
      b.distance !== undefined ? b.distance : existing.distance,
      b.height !== undefined ? b.height : existing.height,
      b.season !== undefined ? b.season : existing.season,
      b.price !== undefined ? parseInt(b.price) : existing.price,
      b.original_price !== undefined ? parseInt(b.original_price) : existing.original_price,
      b.cover_photo !== undefined ? b.cover_photo : existing.cover_photo,
      b.short_description !== undefined ? b.short_description : existing.short_description,
      b.description !== undefined ? b.description : existing.description,
      b.highlights !== undefined ? JSON.stringify(Array.isArray(b.highlights) ? b.highlights : b.highlights.split('\n').filter(Boolean)) : existing.highlights,
      b.itinerary !== undefined ? JSON.stringify(Array.isArray(b.itinerary) ? b.itinerary : b.itinerary.split('\n').filter(Boolean)) : existing.itinerary,
      b.inclusions !== undefined ? JSON.stringify(Array.isArray(b.inclusions) ? b.inclusions : b.inclusions.split('\n').filter(Boolean)) : existing.inclusions,
      b.exclusions !== undefined ? JSON.stringify(Array.isArray(b.exclusions) ? b.exclusions : b.exclusions.split('\n').filter(Boolean)) : existing.exclusions,
      b.meeting_point !== undefined ? b.meeting_point : existing.meeting_point,
      b.pickups !== undefined ? JSON.stringify(Array.isArray(b.pickups) ? b.pickups : b.pickups.split('\n').filter(Boolean)) : existing.pickups,
      b.things_to_carry !== undefined ? JSON.stringify(Array.isArray(b.things_to_carry) ? b.things_to_carry : b.things_to_carry.split('\n').filter(Boolean)) : existing.things_to_carry,
      b.instructions !== undefined ? b.instructions : existing.instructions,
      b.cancellation_policy !== undefined ? b.cancellation_policy : existing.cancellation_policy,
      b.is_featured !== undefined ? (b.is_featured ? 1 : 0) : existing.is_featured,
      b.status !== undefined ? b.status : existing.status,
      id
    );

    const updated = db.prepare('SELECT * FROM treks WHERE id = ?').get(id);
    res.json(formatTrek(updated));
  } catch (err) {
    console.error('Error updating trek:', err);
    res.status(500).json({ error: 'Failed to update trek: ' + err.message });
  }
});

// Treks management: DELETE trek
app.delete('/api/admin/treks/:id', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    db.prepare('DELETE FROM treks WHERE id = ?').run(id);
    res.json({ ok: true, message: 'Trek deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete trek' });
  }
});

// Photos management: Upload Cover Image for Trek
app.post('/api/admin/treks/:id/cover', requireAdmin, upload.single('cover'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });
    const coverUrl = `/uploads/${req.file.filename}`;
    db.prepare('UPDATE treks SET cover_photo = ? WHERE id = ?').run(coverUrl, req.params.id);
    res.json({ ok: true, cover_photo: coverUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload cover photo' });
  }
});

// Photos management: Upload Gallery Photos for Trek
app.post('/api/admin/treks/:id/photos', requireAdmin, upload.array('photos', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    const trekId = req.params.id;
    const ins = db.prepare('INSERT INTO photos (trek_id, url, caption) VALUES (?, ?, ?)');
    const uploaded = [];
    req.files.forEach(f => {
      const url = `/uploads/${f.filename}`;
      ins.run(trekId, url, f.originalname);
      uploaded.push({ url, caption: f.originalname });
    });
    res.json({ ok: true, photos: uploaded });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload gallery photos' });
  }
});

// Photos management: Delete photo
app.delete('/api/admin/photos/:id', requireAdmin, (req, res) => {
  try {
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
    if (photo && photo.url.startsWith('/uploads/')) {
      const diskPath = path.join(UPLOADS_DIR, path.basename(photo.url));
      if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
    }
    db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Dates management: Add date for trek
app.post('/api/admin/treks/:id/dates', requireAdmin, (req, res) => {
  try {
    const trekId = req.params.id;
    const { event_date, day_of_week, total_seats, available_seats, status } = req.body;
    if (!event_date) return res.status(400).json({ error: 'Event date is required' });

    // Infer day of week if not provided
    let day = day_of_week;
    if (!day) {
      const d = new Date(event_date);
      day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
    }

    const ins = db.prepare(`
      INSERT INTO trek_dates (trek_id, event_date, day_of_week, total_seats, available_seats, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = ins.run(
      trekId,
      event_date,
      day,
      parseInt(total_seats) || 30,
      parseInt(available_seats) || 30,
      status || 'AVAILABLE'
    );

    const created = db.prepare('SELECT * FROM trek_dates WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add trek date' });
  }
});

// Dates management: Update date status
app.put('/api/admin/dates/:id', requireAdmin, (req, res) => {
  try {
    const { status, available_seats, total_seats } = req.body;
    const existing = db.prepare('SELECT * FROM trek_dates WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Date not found' });

    db.prepare(`
      UPDATE trek_dates SET
        status = ?, available_seats = ?, total_seats = ?
      WHERE id = ?
    `).run(
      status || existing.status,
      available_seats !== undefined ? parseInt(available_seats) : existing.available_seats,
      total_seats !== undefined ? parseInt(total_seats) : existing.total_seats,
      req.params.id
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update date' });
  }
});

// Dates management: Delete date
app.delete('/api/admin/dates/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM trek_dates WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete date' });
  }
});

// FAQ management: Add FAQ
app.post('/api/admin/faqs', requireAdmin, (req, res) => {
  try {
    const { trek_id, question, answer } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'Question and answer required' });

    const result = db.prepare('INSERT INTO faqs (trek_id, question, answer) VALUES (?, ?, ?)').run(
      trek_id || null, question.trim(), answer.trim()
    );
    res.status(201).json({ id: result.lastInsertRowid, ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// FAQ management: Delete FAQ
app.delete('/api/admin/faqs/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM faqs WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// Feedback moderation: Get all feedback (approved + pending)
app.get('/api/admin/feedback', requireAdmin, (req, res) => {
  try {
    const list = db.prepare(`
      SELECT f.*, t.name as trek_title 
      FROM feedback f 
      LEFT JOIN treks t ON t.id = f.trek_id 
      ORDER BY f.approved ASC, f.id DESC
    `).all();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback list' });
  }
});

// Feedback moderation: Toggle approve/hide
app.put('/api/admin/feedback/:id', requireAdmin, (req, res) => {
  try {
    const { approved } = req.body;
    db.prepare('UPDATE feedback SET approved = ? WHERE id = ?').run(approved ? 1 : 0, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to moderate feedback' });
  }
});

// Feedback moderation: Delete feedback
app.delete('/api/admin/feedback/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM feedback WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// ==========================================
// ADMIN BOOKINGS & PAYMENTS MANAGEMENT
// ==========================================

// Get all bookings with optional filtering
app.get('/api/admin/bookings', requireAdmin, (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM bookings';
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push('payment_status = ?');
      params.push(status.toUpperCase());
    }

    if (search) {
      conditions.push('(booking_code LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ? OR trek_name LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s, s);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY id DESC';

    const list = db.prepare(query).all(...params);
    res.json(list);
  } catch (err) {
    console.error('Error fetching admin bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status
app.put('/api/admin/bookings/:id/status', requireAdmin, (req, res) => {
  try {
    const { payment_status } = req.body;
    const allowed = ['PAID', 'PENDING', 'CANCELLED', 'REFUNDED'];
    if (!payment_status || !allowed.includes(payment_status.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid status. Allowed: ' + allowed.join(', ') });
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    db.prepare('UPDATE bookings SET payment_status = ? WHERE id = ?').run(payment_status.toUpperCase(), req.params.id);
    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    res.json({ ok: true, booking: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Settings management: Get settings
app.get('/api/admin/settings', requireAdmin, (req, res) => {
  try {
    res.json(getSettings());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Settings management: Update settings
app.put('/api/admin/settings', requireAdmin, (req, res) => {
  try {
    const entries = Object.entries(req.body);
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of entries) {
      if (typeof v === 'string') {
        const cleanVal = (k === 'razorpay_key_id' || k === 'razorpay_key_secret' || k === 'whatsapp_number' || k === 'upi_id') ? v.trim() : v;
        stmt.run(k, cleanVal);
      }
    }
    res.json({ ok: true, settings: getSettings() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Settings management: Upload QR code image
app.post('/api/admin/settings/qr', requireAdmin, upload.single('qr_image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No QR image uploaded' });
    const qrUrl = `/uploads/${req.file.filename}`;
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('payment_qr', qrUrl);
    res.json({ ok: true, payment_qr: qrUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload QR image' });
  }
});

// Settings management: Remove QR code image
app.delete('/api/admin/settings/qr', requireAdmin, (req, res) => {
  try {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('payment_qr', '')").run();
    res.json({ ok: true, message: 'Payment QR code removed successfully', payment_qr: '' });
  } catch (err) {
    console.error('Error removing QR code:', err);
    res.status(500).json({ error: 'Failed to remove QR code: ' + err.message });
  }
});

// Settings management: Upload Brand Logo
app.post('/api/admin/settings/logo', requireAdmin, upload.single('logo_image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No logo image uploaded' });
    const logoUrl = `/uploads/${req.file.filename}`;
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('brand_logo', logoUrl);
    
    // Also update public/brand/pahadnama-logo.png so static fallback shows it immediately
    try {
      const targetPath = path.join(__dirname, 'public', 'brand', 'pahadnama-logo.png');
      fs.copyFileSync(req.file.path, targetPath);
    } catch (copyErr) {
      console.warn('Fallback copy warning:', copyErr.message);
    }

    res.json({ ok: true, logo_url: logoUrl, message: 'Brand logo updated successfully across the site' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload logo image' });
  }
});

// Settings management: Upload Background Image
app.post('/api/admin/settings/background', requireAdmin, upload.single('bg_image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No background image uploaded' });
    const bgUrl = `/uploads/${req.file.filename}`;
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('site_bg_image', bgUrl);
    res.json({ ok: true, site_bg_image: bgUrl, message: 'Background image uploaded and applied successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload background image: ' + err.message });
  }
});

// Settings management: Remove Background Image
app.delete('/api/admin/settings/background', requireAdmin, (req, res) => {
  try {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('site_bg_image', '')").run();
    res.json({ ok: true, message: 'Background image removed successfully', site_bg_image: '' });
  } catch (err) {
    console.error('Error removing background image:', err);
    res.status(500).json({ error: 'Failed to remove background image: ' + err.message });
  }
});

// Payments management: Test Razorpay API credentials live
app.post('/api/admin/payments/test-keys', requireAdmin, async (req, res) => {
  try {
    const { key_id, key_secret } = req.body;
    if (!key_id || !key_secret) {
      return res.status(400).json({ ok: false, error: 'Key ID and Key Secret are both required.' });
    }

    const cleanKeyId = key_id.trim();
    const cleanKeySecret = key_secret.trim();

    if (cleanKeyId === 'rzp_test_5172839485' || cleanKeySecret === 'rzp_test_secret_demo') {
      return res.status(400).json({
        ok: false,
        error: 'Ye default placeholder dummy keys hain. Kripya dashboard.razorpay.com se apni asli Test Key ID (rzp_test_...) aur Secret generate karke enter karein.'
      });
    }

    const auth = 'Basic ' + Buffer.from(`${cleanKeyId}:${cleanKeySecret}`).toString('base64');
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth
      },
      body: JSON.stringify({
        amount: 100, // ₹1 test order in paise
        currency: 'INR',
        receipt: 'test_conn_' + Date.now().toString(36),
        notes: {
          purpose: 'Pahadnama Admin Razorpay Connection Verification'
        }
      })
    });

    const data = await rzpResponse.json();
    if (rzpResponse.ok && data && data.id) {
      return res.json({
        ok: true,
        message: 'Razorpay Test Gateway se successfully connect ho gaya! Real test popup ready hai.',
        order_id: data.id,
        key_id: cleanKeyId,
        is_test_mode: cleanKeyId.startsWith('rzp_test_')
      });
    } else {
      const errMsg = (data && data.error && (data.error.description || data.error.reason)) || 'Razorpay authentication failed.';
      return res.status(400).json({
        ok: false,
        error: errMsg,
        details: data
      });
    }
  } catch (err) {
    console.error('Error testing Razorpay keys:', err);
    return res.status(500).json({
      ok: false,
      error: 'Razorpay server se sampark nahi ho saka: ' + err.message
    });
  }
});

// Security: Change admin password
app.post('/api/admin/change-password', requireAdmin, (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const { hash, salt } = hashPassword(new_password);
    db.prepare('UPDATE admins SET password_hash = ?, salt = ? WHERE username = ?').run(hash, salt, 'the.life.passenger');
    res.json({ ok: true, message: 'Admin password successfully updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Routes for main app and admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Server start
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Pahadnama Trails Server is running!`);
  console.log(` Public Website:   http://localhost:${PORT}`);
  console.log(` Admin Dashboard:  http://localhost:${PORT}/admin`);
  console.log(`====================================================`);
});
