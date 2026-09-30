/**
 * Pahadnama Trails ? Client Application Logic
 */

let allTreks = [];
let currentTrek = null;
let selectedDateId = null;
let siteSettings = {};

// Helper: Escape HTML
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

// Toast notification helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// Format currency
function formatInr(num) {
  return '\u20B9' + Number(num || 0).toLocaleString('en-IN');
}

// Format date string
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', weekday: 'short' });
}

// API wrapper
async function api(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch {}
    throw new Error(err.error || 'Server request failed');
  }
  return res.json();
}

// Initialize application
async function initApp() {
  setupNav();
  setupFilters();
  await loadSettings();
  await loadTreks();
  await loadFeedback();
}

// Apply dynamic background color, photo, and visibility
function applyDynamicBackground(s) {
  if (!s) return;

  // 1. Background color
  const bgColor = s.site_bg_color || '#ffffff';
  document.documentElement.style.setProperty('--bg-page', bgColor);
  document.body.style.backgroundColor = bgColor;

  // 2. Background image & opacity
  let bgLayer = document.getElementById('siteCustomBgLayer');
  if (!bgLayer) {
    bgLayer = document.createElement('div');
    bgLayer.id = 'siteCustomBgLayer';
    document.body.prepend(bgLayer);
  }

  if (s.site_bg_image && s.site_bg_image.trim()) {
    bgLayer.style.backgroundImage = `url('${s.site_bg_image}')`;
    const opacityPct = isNaN(parseInt(s.site_bg_opacity, 10)) ? 15 : parseInt(s.site_bg_opacity, 10);
    const opacity = Math.min(1, Math.max(0, opacityPct / 100));
    bgLayer.style.opacity = opacity;
    bgLayer.style.display = 'block';
  } else {
    bgLayer.style.backgroundImage = 'none';
    bgLayer.style.display = 'none';
  }
}

// Load public settings
async function loadSettings() {
  try {
    siteSettings = await api('/api/settings');

    // Apply dynamic background theme (Color, Image, Opacity)
    applyDynamicBackground(siteSettings);

    const upiDisplay = document.getElementById('displayUpiId');
    if (upiDisplay && siteSettings.upi_id) upiDisplay.textContent = siteSettings.upi_id;

    const qrImg = document.getElementById('displayQrImg');
    if (qrImg && siteSettings.payment_qr) qrImg.src = siteSettings.payment_qr;

    const gform = document.getElementById('displayGformLink');
    if (gform && siteSettings.google_form_url) gform.href = siteSettings.google_form_url;

    if (siteSettings.brand_logo) {
      document.querySelectorAll('.brand-logo-img, .footer-logo-img').forEach(img => {
        img.src = siteSettings.brand_logo;
      });
    }
  } catch (e) {
    console.warn('Could not fetch settings:', e);
  }
}

// Setup navigation drawer
function setupNav() {
  const menuToggle = document.getElementById('menuToggle');
  const drawerClose = document.getElementById('drawerClose');
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('drawerBackdrop');

  function openDrawer() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (menuToggle) menuToggle.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', closeDrawer);
  });

  // Sticky header elevation & scrollspy
  const header = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.desktop-nav .nav-link');
  const sections = document.querySelectorAll('main section[id]');

  window.addEventListener('scroll', () => {
    if (header) {
      if (window.scrollY > 15) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
    }

    let currentSection = '';
    const scrollPos = window.scrollY + 140;
    sections.forEach(sec => {
      if (scrollPos >= sec.offsetTop) {
        currentSection = sec.getAttribute('id');
      }
    });

    if (currentSection) {
      navLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        if (href === `#${currentSection}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  }, { passive: true });
}

// Setup trek category filter buttons
function setupFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      renderTreks(filter);
    });
  });
}

// Load treks from server
async function loadTreks() {
  const grid = document.getElementById('treksGrid');
  try {
    allTreks = await api('/api/treks');
    renderTreks('all');
    populateTrekSelects();
  } catch (err) {
    grid.innerHTML = `<div class="loading-placeholder"><p>Unable to load treks. Please refresh.</p></div>`;
  }
}

// Render trek cards
function renderTreks(filter = 'all') {
  const grid = document.getElementById('treksGrid');
  if (!grid) return;

  let filtered = allTreks;
  if (filter === 'Beginner Friendly') {
    filtered = allTreks.filter(t => t.difficulty.toLowerCase().includes('easy'));
  } else if (filter === 'Moderate') {
    filtered = allTreks.filter(t => t.difficulty.toLowerCase().includes('moderate'));
  } else if (filter === 'Thrilling') {
    filtered = allTreks.filter(t => t.difficulty.toLowerCase().includes('hard') || t.difficulty.toLowerCase().includes('thrill'));
  }

  if (!filtered.length) {
    grid.innerHTML = `<div class="loading-placeholder"><p>No trails match this category at present.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(t => {
    // Next weekend date slot pill
    let dateSlotHtml = '';
    if (t.next_date) {
      const statusClass = (t.next_status || 'AVAILABLE').toLowerCase().replace('_', '-');
      const statusText = t.next_status === 'FAST_FILLING' ? 'Fast Filling' : (t.next_status === 'FULL' ? 'Full' : 'Available');
      dateSlotHtml = `
        <div class="card-date-slot">
          <div class="slot-left">
            <span class="slot-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
            <span>${esc(formatDate(t.next_date))} (${esc(t.next_day || 'Weekend')})</span>
          </div>
          <span class="slot-status ${statusClass}">${statusText}</span>
        </div>
      `;
    } else {
      dateSlotHtml = `
        <div class="card-date-slot">
          <div class="slot-left">
            <span class="slot-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
            <span>Batches on Sat &amp; Sun</span>
          </div>
          <span class="slot-status available">Inquire</span>
        </div>
      `;
    }

    const coverPhoto = t.cover_photo || '/brand/pahadnama-logo.png';

    return `
      <article class="trek-card" id="trek-card-${t.id}">
        <div class="card-media" onclick="openTrekModal(${t.id})" style="cursor:pointer">
          <img src="${esc(coverPhoto)}" alt="${esc(t.name)}" loading="lazy">
          <span class="card-difficulty-badge">${esc(t.difficulty)}</span>
          <span class="card-duration-badge">${esc(t.duration)}</span>
        </div>

        <div class="card-body">
          <div class="card-location"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:2px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg> ${esc(t.location)}</div>
          <h3 class="card-title" onclick="openTrekModal(${t.id})" style="cursor:pointer">${esc(t.name)}</h3>
          <p class="card-desc">${esc(t.short_description || t.description)}</p>

          ${dateSlotHtml}

          <div class="card-footer">
            <div class="price-block">
              <small>Starting from</small>
              <div>
                <span class="price-amount">${formatInr(t.price)}</span>
                ${t.original_price ? `<span class="price-cut">${formatInr(t.original_price)}</span>` : ''}
              </div>
            </div>

            <div class="card-actions">
              <button class="btn btn-sm btn-outline" onclick="openTrekModal(${t.id})">Details</button>
              <button class="btn btn-sm btn-primary" onclick="quickBookTrek(${t.id})">Book Now</button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Populate trek dropdowns in forms
function populateTrekSelects() {
  const fbSelect = document.getElementById('fbTrek');
  if (fbSelect) {
    fbSelect.innerHTML = '<option value="">General Pahadnama Experience</option>' +
      allTreks.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
  }
}

// Open Dedicated Trek Modal
async function openTrekModal(id) {
  const modal = document.getElementById('trekModal');
  const body = document.getElementById('trekModalBody');
  body.innerHTML = `<div class="loading-placeholder"><div class="spinner"></div><p>Loading trail details…</p></div>`;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  try {
    currentTrek = await api('/api/treks/' + id);
    renderTrekModalContent(currentTrek);
  } catch (err) {
    body.innerHTML = `<p style="color:red">Failed to load trek details: ${esc(err.message)}</p>`;
  }
}

// Render Trek Modal Content
function renderTrekModalContent(t) {
  const body = document.getElementById('trekModalBody');
  selectedDateId = null;

  // Cover photo
  const coverImg = t.cover_photo || '/brand/pahadnama-logo.png';

  // Gallery thumbnails
  let galleryHtml = '';
  if (t.photos && t.photos.length > 0) {
    galleryHtml = `
      <div class="modal-head">
        <h4 class="modal-section-title">Genuine Trail Gallery (${t.photos.length} Photos)</h4>
        <div class="gallery-scroller" id="galleryScroller">
          ${t.photos.map((p, idx) => `
            <img src="${esc(p.url)}" alt="${esc(t.name)}" class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="swapModalHero('${esc(p.url)}', this)">
          `).join('')}
        </div>
      </div>
    `;
  }

  // Itinerary items
  const itineraryHtml = (t.itinerary && t.itinerary.length) ? `
    <div class="itinerary-timeline">
      ${t.itinerary.map(item => `<div class="timeline-item">${esc(item)}</div>`).join('')}
    </div>
  ` : '<p style="color:var(--text-muted)">Itinerary will be updated shortly by our coordinators.</p>';

  // Inclusions & Exclusions
  const inclusionsList = (t.inclusions && t.inclusions.length) ? t.inclusions.map(i => `<li>? ${esc(i)}</li>`).join('') : '<li>? Transport & Local Guides</li>';
  const exclusionsList = (t.exclusions && t.exclusions.length) ? t.exclusions.map(e => `<li>? ${esc(e)}</li>`).join('') : '<li>? Personal expenses</li>';

  // Dates selection chips
  let datesChipsHtml = '';
  if (t.dates && t.dates.length > 0) {
    datesChipsHtml = t.dates.map(d => {
      const isFull = d.status === 'FULL' || d.status === 'CANCELLED';
      const statusLabel = d.status === 'FULL' ? 'Full' : (d.status === 'FAST_FILLING' ? 'Few Left' : 'Available');
      const statusClass = (d.status || 'AVAILABLE').toLowerCase().replace('_', '-');
      return `
        <button type="button" class="date-chip-btn ${isFull ? 'full' : ''}" ${isFull ? 'disabled' : ''} onclick="selectModalDate(${d.id}, '${esc(d.event_date)}', '${esc(d.day_of_week)}', this)">
          <div>
            <strong>${esc(formatDate(d.event_date))}</strong>
            <small style="display:block;color:var(--text-muted)">${esc(d.day_of_week)}</small>
          </div>
          <span class="slot-status ${statusClass}">${statusLabel}</span>
        </button>
      `;
    }).join('');
  } else {
    datesChipsHtml = '<p style="color:var(--text-muted)">No upcoming dates published yet. Contact on WhatsApp for custom dates.</p>';
  }

  // FAQs
  let faqsHtml = '';
  if (t.faqs && t.faqs.length > 0) {
    faqsHtml = `
      <div style="margin-bottom: 2rem;">
        <h4 class="modal-section-title">Trail FAQs</h4>
        <div class="accordion">
          ${t.faqs.map(f => `
            <div class="accordion-item">
              <button class="accordion-header" onclick="toggleFaq(this)">
                <span>${esc(f.question)}</span>
                <span class="accordion-icon">+</span>
              </button>
              <div class="accordion-body">
                <p>${esc(f.answer)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  body.innerHTML = `
    <div class="trek-modal-hero" id="modalHero">
      <img src="${esc(coverImg)}" alt="${esc(t.name)}" id="modalHeroImg">
      <span class="trek-modal-hero-badge">${esc(t.difficulty)} &bull; ${esc(t.region || t.location)}</span>
    </div>

    ${galleryHtml}

    <div class="modal-head">
      <div class="card-location"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:2px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg> ${esc(t.location)}</div>
      <h2 style="font-family:var(--font-heading);font-size:2rem;font-weight:800;color:var(--primary-dark);line-height:1.2;margin-bottom:0.6rem">${esc(t.name)}</h2>
      <p style="font-size:1.05rem;color:var(--text-muted);line-height:1.6">${esc(t.description || t.short_description)}</p>
    </div>

    <div class="trek-quick-meta">
      <div class="meta-item">
        <small>Duration</small>
        <strong>${esc(t.duration)}</strong>
      </div>
      <div class="meta-item">
        <small>Distance</small>
        <strong>${esc(t.distance || '8 km')}</strong>
      </div>
      <div class="meta-item">
        <small>Elevation</small>
        <strong>${esc(t.height || '3,500 ft')}</strong>
      </div>
      <div class="meta-item">
        <small>Best Season</small>
        <strong>${esc(t.season || 'Monsoon & Winter')}</strong>
      </div>
    </div>

    <!-- Available Saturday & Sunday Slots -->
    <div class="modal-dates-picker">
      <h4 class="modal-section-title" style="border:none;margin-bottom:0.2rem">Choose Weekend Date (Saturday / Sunday)</h4>
      <p style="font-size:0.85rem;color:var(--text-muted)">Select an available batch slot below:</p>
      <div class="dates-chips-grid">
        ${datesChipsHtml}
      </div>
    </div>

    <!-- Detailed Itinerary -->
    <div style="margin-bottom:2rem">
      <h4 class="modal-section-title">Batch Itinerary</h4>
      ${itineraryHtml}
    </div>

    <!-- Inclusions & Exclusions -->
    <div class="checklist-grid">
      <div class="checklist-card">
        <h4 style="font-family:var(--font-heading);font-size:1rem;color:var(--primary-dark);margin-bottom:0.75rem">What is Included</h4>
        <ul>${inclusionsList}</ul>
      </div>
      <div class="checklist-card">
        <h4 style="font-family:var(--font-heading);font-size:1rem;color:var(--primary-dark);margin-bottom:0.75rem">What is Not Included</h4>
        <ul>${exclusionsList}</ul>
      </div>
    </div>

    <!-- Meeting Point & Pickups -->
    ${t.meeting_point ? `
      <div style="background-color:var(--bg-subtle);border-radius:var(--radius-sm);padding:1.2rem;margin-bottom:2rem;border:1px solid var(--border-light)">
        <h4 style="font-family:var(--font-heading);font-size:0.95rem;color:var(--primary-dark);margin-bottom:0.35rem">&#128652; Mumbai Pickups &amp; Meeting Points</h4>
        <p style="font-size:0.88rem;color:var(--text-main)">${esc(t.meeting_point)}</p>
      </div>
    ` : ''}

    <!-- FAQs -->
    ${faqsHtml}

    <!-- Sticky Booking Footer -->
    <div class="modal-booking-bar">
      <div class="price-block">
        <small>Total Trek Fee</small>
        <div>
          <span class="price-amount">${formatInr(t.price)}</span>
          <span style="font-size:0.85rem;color:var(--text-muted)">/ person</span>
        </div>
      </div>

      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center">
        <button class="btn btn-whatsapp" onclick="bookOnWhatsAppCurrent()">
          <span>Book via WhatsApp</span>
        </button>
        <button class="btn btn-primary" onclick="openPaymentOptions()">
          <span>Book &amp; Pay Online &rarr;</span>
        </button>
        <button type="button" class="btn btn-outline" onclick="closeTrekModal()" title="Close details modal">
          <span>✕ Close</span>
        </button>
      </div>
    </div>
  `;

  // Auto-select first available date if exists
  const firstAvailableChip = document.querySelector('.date-chip-btn:not(.full)');
  if (firstAvailableChip) {
    firstAvailableChip.click();
  }
}

// Swap hero image in modal
function swapModalHero(imgUrl, thumbElem) {
  const heroImg = document.getElementById('modalHeroImg');
  if (heroImg) heroImg.src = imgUrl;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  if (thumbElem) thumbElem.classList.add('active');
}

// Select a weekend date
let currentSelectedDateStr = '';
function selectModalDate(dateId, dateStr, dayOfWeek, elem) {
  selectedDateId = dateId;
  currentSelectedDateStr = `${formatDate(dateStr)} (${dayOfWeek})`;
  document.querySelectorAll('.date-chip-btn').forEach(b => b.classList.remove('selected'));
  if (elem) elem.classList.add('selected');
}

// Close Trek Modal
function closeTrekModal() {
  const modal = document.getElementById('trekModal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

// Quick book action from card
function quickBookTrek(id) {
  openTrekModal(id);
}

// Book via WhatsApp for currently viewed trek
function bookOnWhatsAppCurrent() {
  if (!currentTrek) return;
  const phone = siteSettings.whatsapp_number || '919137761400';
  const dateInfo = currentSelectedDateStr ? currentSelectedDateStr : 'Upcoming Saturday / Sunday Batch';
  const text = encodeURIComponent(
    `Hi Pahadnama Trails!\nI would like to book the trek:\n- Trail: ${currentTrek.name}\n- Preferred Date: ${dateInfo}\n- Starting Price: ${formatInr(currentTrek.price)}\n- Participants: 1-2 people\n\nPlease confirm availability and payment details!`
  );
  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
}

// Open Payment options modal
function openPaymentOptions(defaultTab = 'razorpay') {
  if (!currentTrek) return;
  const modal = document.getElementById('bookingModal');
  const content = document.getElementById('bookingModalContent');
  const upiId = siteSettings.upi_id || 'pahadnamatrails@okaxis';
  const qrImg = siteSettings.payment_qr || '/brand/payment-qr.png';
  const dateInfo = currentSelectedDateStr ? currentSelectedDateStr : 'Upcoming Weekend Batch';

  // Build pickup options from currentTrek.pickups
  let pickupsHtml = '';
  if (Array.isArray(currentTrek.pickups) && currentTrek.pickups.length > 0) {
    pickupsHtml = currentTrek.pickups.map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('');
    pickupsHtml += `<option value="Direct Base Village / Own Vehicle">Direct Base Village (Own Transport)</option>`;
  } else {
    pickupsHtml = `
      <option value="Dadar Central (Pritam Hotel)">Dadar Central (Pritam Hotel)</option>
      <option value="Thane (Teen Hath Naka)">Thane (Teen Hath Naka)</option>
      <option value="Vashi (Old Toll Plaza)">Vashi (Old Toll Plaza)</option>
      <option value="Direct Base Village">Direct Base Village (Own Transport)</option>
    `;
  }

  content.innerHTML = `
    <div class="modal-head">
      <div class="badge-tag">INSTANT RESERVATION &bull; STEP 2 OF 2</div>
      <h3>Book Slot: ${esc(currentTrek.name)}</h3>
      <p style="margin-top:0.3rem">
        Chosen Batch: <strong style="color:var(--primary-dark)">${esc(dateInfo)}</strong> &bull; 
        Per Head: <strong>${formatInr(currentTrek.price)}</strong>
      </p>
    </div>

    <!-- Payment Methods Switcher Tabs -->
    <div class="payment-tabs-nav">
      <button type="button" class="pay-tab-btn ${defaultTab === 'razorpay' ? 'active' : ''}" id="tabBtnRazorpay" onclick="switchPaymentTab('razorpay')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        <span>Razorpay Test Pay</span>
      </button>
      <button type="button" class="pay-tab-btn ${defaultTab === 'whatsapp' ? 'active' : ''}" id="tabBtnWa" onclick="switchPaymentTab('whatsapp')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.074-2.029-.446-1.577-.614-2.583-2.203-2.66-2.308-.078-.105-.639-.851-.639-1.624 0-.773.405-1.156.549-1.311.144-.155.316-.195.421-.195.105 0 .211.001.303.006.098.005.228-.037.356.27.133.317.451 1.101.492 1.182.04.081.066.176.013.281-.052.105-.078.172-.156.262-.078.09-.163.2-.234.269-.078.077-.16.16-.068.318.092.158.408.673.876 1.09 1.031.919 1.583 1.026 1.764 1.117.181.09.287.078.393-.044.106-.123.456-.532.578-.716.123-.184.246-.154.41-.093.164.061 1.042.491 1.221.58.179.09.298.134.342.208.044.075.044.434-.1.839z"/></svg>
        <span>WhatsApp Booking</span>
      </button>
      <!-- MANUAL UPI QR TAB (COMMENTED OUT AS PER USER REQUEST)
      <button type="button" class="pay-tab-btn" id="tabBtnUpi" onclick="switchPaymentTab('upi')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>Manual UPI QR</span>
      </button>
      -->
    </div>

    <!-- TAB 1: RAZORPAY ONLINE PAYMENT -->
    <div id="paymentPaneRazorpay" class="payment-tab-pane ${defaultTab === 'razorpay' ? '' : 'hidden'}" style="display:${defaultTab === 'razorpay' ? 'block' : 'none'};">
      <div class="rzp-test-badge">
        <span class="rzp-badge-dot"></span>
        <span><strong>Razorpay Test Mode Active:</strong> Safe simulated checkout &bull; Instant booking voucher</span>
      </div>

      <form id="rzpCheckoutForm" onsubmit="handleRazorpayPayNow(event)">
        <div class="form-row">
          <div class="form-group">
            <label for="payCustomerName">Full Name *</label>
            <input type="text" id="payCustomerName" required placeholder="e.g. Rahul Patil">
          </div>
          <div class="form-group">
            <label for="payCustomerPhone">WhatsApp Mobile No. *</label>
            <input type="tel" id="payCustomerPhone" required placeholder="e.g. 9820012345">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="payCustomerEmail">Email Address (Optional)</label>
            <input type="email" id="payCustomerEmail" placeholder="e.g. rahul@example.com">
          </div>
          <div class="form-group">
            <label for="payParticipants">Participants Count *</label>
            <div class="qty-stepper">
              <button type="button" class="btn-qty" onclick="changeParticipants(-1)">&minus;</button>
              <input type="number" id="payParticipants" min="1" max="25" value="1" readonly onchange="updatePaymentTotal()">
              <button type="button" class="btn-qty" onclick="changeParticipants(1)">&plus;</button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="payPickupLocation">Select Pickup Point</label>
          <select id="payPickupLocation">
            ${pickupsHtml}
          </select>
        </div>

        <!-- Live Price Calculation Box -->
        <div class="price-breakup-card">
          <div class="breakup-row">
            <span>Trek Base Fee (<span id="calcParticipantsLabel">1</span> person)</span>
            <strong id="calcBasePrice">${formatInr(currentTrek.price)}</strong>
          </div>
          <div class="breakup-row">
            <span>Safety Gear, Leader &amp; Forest Permits</span>
            <span style="color:var(--success);font-weight:700">Included</span>
          </div>
          <div class="breakup-divider"></div>
          <div class="breakup-row breakup-total">
            <span>Total Payable:</span>
            <span class="breakup-total-val" id="calcTotalPrice">${formatInr(currentTrek.price)}</span>
          </div>
        </div>

        <div style="display:flex;gap:0.75rem;flex-direction:column">
          <button type="submit" class="btn btn-primary w-full" id="btnRazorpaySubmit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span id="btnPayText">Proceed to Pay ${formatInr(currentTrek.price)} &rarr;</span>
          </button>
          <button type="button" class="btn btn-outline w-full" onclick="closeBookingModal()">
            ✕ Cancel &amp; Exit
          </button>
        </div>

        <div class="payment-security-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <span>Cards, UPI, NetBanking &amp; Wallets supported. Official confirmation voucher generated instantly.</span>
        </div>
      </form>
    </div>

    <!-- TAB 2: WHATSAPP DIRECT BOOKING -->
    <div id="paymentPaneWa" class="payment-tab-pane ${defaultTab === 'whatsapp' ? '' : 'hidden'}" style="display:${defaultTab === 'whatsapp' ? 'block' : 'none'};">
      <div style="text-align:center;padding:1.2rem 0.5rem">
        <div style="width:60px;height:60px;background:#e4fce9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;color:#25d366">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.074-2.029-.446-1.577-.614-2.583-2.203-2.66-2.308-.078-.105-.639-.851-.639-1.624 0-.773.405-1.156.549-1.311.144-.155.316-.195.421-.195.105 0 .211.001.303.006.098.005.228-.037.356.27.133.317.451 1.101.492 1.182.04.081.066.176.013.281-.052.105-.078.172-.156.262-.078.09-.163.2-.234.269-.078.077-.16.16-.068.318.092.158.408.673.876 1.09 1.031.919 1.583 1.026 1.764 1.117.181.09.287.078.393-.044.106-.123.456-.532.578-.716.123-.184.246-.154.41-.093.164.061 1.042.491 1.221.58.179.09.298.134.342.208.044.075.044.434-.1.839z"/></svg>
        </div>
        <h4 style="font-family:var(--font-heading);font-size:1.25rem;font-weight:800;color:var(--primary-dark);margin-bottom:0.4rem">WhatsApp Direct Coordinator Booking</h4>
        <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:1.2rem">Prefer chatting directly with our trail coordinator? We will instantly confirm your slot, verify transport pickup, and share trek preparation details.</p>
        
        <div style="background:var(--bg-subtle);border-radius:var(--radius-sm);padding:1rem;margin-bottom:1.25rem;text-align:left;border:1px solid var(--border-light);font-size:0.88rem;line-height:1.6">
          <div>Selected Trail: <strong>${esc(currentTrek.name)}</strong></div>
          <div>Batch Date: <strong>${esc(dateInfo)}</strong></div>
          <div>Starting Fee: <strong>${formatInr(currentTrek.price)} / person</strong></div>
        </div>

        <div style="display:flex;gap:0.75rem;flex-direction:column">
          <button class="btn btn-whatsapp w-full" onclick="bookOnWhatsAppCurrent()">
            <span>Chat &amp; Book on WhatsApp &rarr;</span>
          </button>
          <button type="button" class="btn btn-outline w-full" onclick="closeBookingModal()">
            ✕ Cancel &amp; Exit
          </button>
        </div>
      </div>
    </div>

    <!-- MANUAL UPI QR TAB (COMMENTED OUT AS PER USER REQUEST)
    <div id="paymentPaneUpi" class="payment-tab-pane hidden">
      <div style="background-color:var(--bg-subtle);border-radius:var(--radius-md);padding:1.4rem;text-align:center;margin-bottom:1.2rem;border:1px solid var(--border-light)">
        <p style="font-size:0.82rem;font-weight:700;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:0.75rem">SCAN WITH GOOGLE PAY / PHONEPE / PAYTM</p>
        <img src="${esc(qrImg)}" alt="UPI QR Code" style="width:190px;margin:0 auto 1rem;border-radius:var(--radius-sm);background:#fff;padding:8px;box-shadow:var(--shadow-sm)">
        <div class="upi-box" style="margin-bottom:0.5rem">
          <div class="upi-info">
            <span class="upi-label">VERIFIED UPI ID</span>
            <span class="upi-val">${esc(upiId)}</span>
          </div>
          <button class="btn btn-sm btn-outline" onclick="copyText('${esc(upiId)}')">Copy</button>
        </div>
        <small style="color:var(--text-muted)">Verified Merchant: <strong>Pahadnama Trails</strong></small>
      </div>

      <div class="payment-steps" style="margin-bottom:1.5rem">
        <div class="step-item">
          <div class="step-num">1</div>
          <div>
            <strong>Pay Amount via UPI</strong>
            <p>Scan the QR or enter UPI ID to transfer ${formatInr(currentTrek.price)}.</p>
          </div>
        </div>
        <div class="step-item">
          <div class="step-num">2</div>
          <div>
            <strong>Share Screenshot on WhatsApp</strong>
            <p>Send payment screenshot with your name &amp; date to +91 91377 61400 to secure slot.</p>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:0.75rem;flex-direction:column">
        <button class="btn btn-whatsapp w-full" onclick="confirmPaymentWhatsApp()">
          <span>Confirm Payment on WhatsApp &rarr;</span>
        </button>
      </div>
    </div>
    -->
  `;

  modal.classList.add('open');
  switchPaymentTab(defaultTab);
}

function switchPaymentTab(tab) {
  const rzpPane = document.getElementById('paymentPaneRazorpay');
  const waPane = document.getElementById('paymentPaneWa');
  const rzpBtn = document.getElementById('tabBtnRazorpay');
  const waBtn = document.getElementById('tabBtnWa');

  if (tab === 'razorpay') {
    if (rzpPane) {
      rzpPane.classList.remove('hidden');
      rzpPane.style.display = 'block';
    }
    if (waPane) {
      waPane.classList.add('hidden');
      waPane.style.display = 'none';
    }
    if (rzpBtn) rzpBtn.classList.add('active');
    if (waBtn) waBtn.classList.remove('active');
  } else if (tab === 'whatsapp') {
    if (rzpPane) {
      rzpPane.classList.add('hidden');
      rzpPane.style.display = 'none';
    }
    if (waPane) {
      waPane.classList.remove('hidden');
      waPane.style.display = 'block';
    }
    if (rzpBtn) rzpBtn.classList.remove('active');
    if (waBtn) waBtn.classList.add('active');
  }
}

function changeParticipants(delta) {
  const input = document.getElementById('payParticipants');
  if (!input) return;
  const cur = parseInt(input.value) || 1;
  const next = Math.min(25, Math.max(1, cur + delta));
  input.value = next;
  updatePaymentTotal();
}

function updatePaymentTotal() {
  if (!currentTrek) return;
  const input = document.getElementById('payParticipants');
  const count = Math.max(1, parseInt(input ? input.value : 1) || 1);
  const total = count * currentTrek.price;

  const countLabel = document.getElementById('calcParticipantsLabel');
  if (countLabel) countLabel.textContent = count;

  const basePrice = document.getElementById('calcBasePrice');
  if (basePrice) basePrice.textContent = `${count} \u00D7 ${formatInr(currentTrek.price)}`;

  const totalPrice = document.getElementById('calcTotalPrice');
  if (totalPrice) totalPrice.textContent = formatInr(total);

  const btnText = document.getElementById('btnPayText');
  if (btnText) btnText.textContent = `Proceed to Pay ${formatInr(total)} \u2192`;
}

async function handleRazorpayPayNow(e) {
  if (e) e.preventDefault();
  if (!currentTrek) return;

  const nameInput = document.getElementById('payCustomerName');
  const phoneInput = document.getElementById('payCustomerPhone');
  const emailInput = document.getElementById('payCustomerEmail');
  const countInput = document.getElementById('payParticipants');
  const pickupInput = document.getElementById('payPickupLocation');
  const submitBtn = document.getElementById('btnRazorpaySubmit');

  const customer_name = nameInput ? nameInput.value.trim() : '';
  const customer_phone = phoneInput ? phoneInput.value.trim() : '';
  const customer_email = emailInput ? emailInput.value.trim() : '';
  const participants = Math.max(1, parseInt(countInput ? countInput.value : 1) || 1);
  const pickup_location = pickupInput ? pickupInput.value : '';
  const total_amount = participants * currentTrek.price;
  const batch_date = currentSelectedDateStr || 'Upcoming Weekend Batch';

  if (!customer_name || !customer_phone) {
    alert('Please enter your full name and WhatsApp mobile number.');
    return;
  }

  submitBtn.disabled = true;
// Ensure Razorpay SDK is loaded
async function ensureRazorpayLoaded() {
  if (typeof window.Razorpay === 'function') return true;
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      if (typeof window.Razorpay === 'function') return resolve(true);
      existing.addEventListener('load', () => resolve(typeof window.Razorpay === 'function'));
      existing.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(typeof window.Razorpay === 'function'), 3000);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(typeof window.Razorpay === 'function');
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
    setTimeout(() => resolve(typeof window.Razorpay === 'function'), 3000);
  });
}

async function handleRazorpayPayNow(e) {
  if (e) e.preventDefault();
  if (!currentTrek) return;

  const nameInput = document.getElementById('payCustomerName');
  const phoneInput = document.getElementById('payCustomerPhone');
  const emailInput = document.getElementById('payCustomerEmail');
  const countInput = document.getElementById('payParticipants');
  const pickupInput = document.getElementById('payPickupLocation');
  const submitBtn = document.getElementById('btnRazorpaySubmit');

  const customer_name = nameInput ? nameInput.value.trim() : '';
  const customer_phone = phoneInput ? phoneInput.value.trim() : '';
  const customer_email = emailInput ? emailInput.value.trim() : '';
  const participants = Math.max(1, parseInt(countInput ? countInput.value : 1) || 1);
  const pickup_location = pickupInput ? pickupInput.value : '';
  const total_amount = participants * currentTrek.price;
  const batch_date = currentSelectedDateStr || 'Upcoming Weekend Batch';

  if (!customer_name || !customer_phone) {
    alert('Please enter your full name and WhatsApp mobile number.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>Connecting to Razorpay...</span>`;

  try {
    // 1. Ensure Razorpay script is loaded
    const isLoaded = await ensureRazorpayLoaded();
    if (!isLoaded || typeof window.Razorpay !== 'function') {
      throw new Error('Razorpay Checkout popup script load nahi ho saka. Kripya apna internet connection check karein ya browser adblocker (Brave Shields, uBlock) disable karein.');
    }

    // 2. Create order on backend
    const orderData = await api('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trek_id: currentTrek.id,
        trek_name: currentTrek.name,
        batch_date,
        customer_name,
        customer_phone,
        customer_email,
        participants,
        pickup_location,
        total_amount
      })
    });

    if (!orderData.ok) {
      throw new Error(orderData.error || 'Failed to initiate order');
    }

    const keyToUse = (orderData.key_id || (siteSettings && siteSettings.razorpay_key_id) || '').trim();
    if (!keyToUse) {
      throw new Error('Razorpay Key ID missing hai. Admin Panel (/admin) mein jaakar Key ID enter karein.');
    }

    submitBtn.innerHTML = `<span>Opening Razorpay Checkout...</span>`;

    // 3. Prepare Razorpay Checkout options
    const options = {
      key: keyToUse,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'Pahadnama Trails',
      description: `${currentTrek.name} (${participants} person${participants > 1 ? 's' : ''})`,
      image: '/brand/pahadnama-logo.png',
      prefill: {
        name: customer_name,
        contact: customer_phone,
        email: customer_email
      },
      theme: {
        color: '#d76d2e'
      },
      handler: async function (resp) {
        submitBtn.innerHTML = `<span>Verifying Payment...</span>`;
        await verifyPaymentOnBackend(
          orderData.booking_code,
          resp.razorpay_order_id || orderData.order_id,
          resp.razorpay_payment_id || ('pay_' + Date.now()),
          resp.razorpay_signature || 'verified_test'
        );
      },
      modal: {
        ondismiss: function () {
          showToast('Checkout window closed. Slot remains pending.');
          submitBtn.disabled = false;
          updatePaymentTotal();
        }
      }
    };

    // CRITICAL: ONLY attach order_id if it's an authentic Razorpay order ID (created by api.razorpay.com)
    // Avoid passing fallback 'order_test_...' to checkout.js as it causes Razorpay SDK to crash on unrecognized order ID
    if (orderData.order_id && orderData.order_id.startsWith('order_') && !orderData.order_id.startsWith('order_test_')) {
      options.order_id = orderData.order_id;
    }

    const rzpInstance = new window.Razorpay(options);
    rzpInstance.on('payment.failed', function (failResp) {
      console.warn('Razorpay payment failed:', failResp);
      alert('Payment could not be completed: ' + (failResp.error?.description || 'Transaction cancelled'));
      submitBtn.disabled = false;
      updatePaymentTotal();
    });

    // OPEN THE OFFICIAL RAZORPAY POPUP DIRECTLY!
    rzpInstance.open();

  } catch (err) {
    console.error('Payment initiation error:', err);
    alert('Payment Notice: ' + err.message);
    submitBtn.disabled = false;
    updatePaymentTotal();
  }
}

// Render test mode prompt for safe sandbox simulation
function renderTestModePaymentPrompt(orderData, totalAmount, name, phone, dateStr, participants, errorDetail) {
  const content = document.getElementById('bookingModalContent');
  content.innerHTML = `
    <div class="modal-head" style="text-align:center">
      <div class="badge-tag">RAZORPAY DEMO / TEST GATEWAY</div>
      <h3>Simulate Test Mode Payment</h3>
      <p>Testing sandbox online payment of <strong>${formatInr(totalAmount)}</strong> for ${esc(currentTrek?.name || 'Sahyadri Trek')}.</p>
    </div>

    ${errorDetail ? `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:var(--radius-sm);padding:0.75rem 1rem;margin-bottom:1rem;font-size:0.84rem;color:#991b1b">
        <strong>Razorpay API Notice:</strong> ${esc(errorDetail)}
      </div>
    ` : ''}

    <div class="rzp-simulator-card">
      <div class="simulator-row">
        <span>Order Reference:</span>
        <code>${esc(orderData.order_id)}</code>
      </div>
      <div class="simulator-row">
        <span>Booking Code:</span>
        <strong>${esc(orderData.booking_code)}</strong>
      </div>
      <div class="simulator-row">
        <span>Lead Trekker:</span>
        <span>${esc(name)} (${esc(phone)})</span>
      </div>
      <div class="simulator-row">
        <span>Batch:</span>
        <span>${esc(dateStr)} &bull; ${participants} seat(s)</span>
      </div>
      <div class="simulator-row" style="font-size:1.1rem;font-weight:800;color:var(--primary-dark);border-top:1px dashed var(--border-light);padding-top:0.75rem;margin-top:0.75rem">
        <span>Simulated Charge:</span>
        <span style="color:var(--accent)">${formatInr(totalAmount)}</span>
      </div>
    </div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:var(--radius-sm);padding:0.85rem 1.1rem;margin-bottom:1.2rem;font-size:0.84rem;color:#1e40af;line-height:1.5">
      <strong>💡 Official Razorpay Checkout Popup Note:</strong>
      <p style="margin:0.25rem 0 0 0">
        Asli Razorpay popup (cards, UPI modal, netbanking) chalane ke liye <a href="/admin" target="_blank" style="color:#2563eb;text-decoration:underline;font-weight:700">Admin Panel (/admin)</a> &rarr; <strong>Booking Settings</strong> mein jaakar apni free Razorpay Test Keys (<code>rzp_test_...</code>) daalein aur '⚡ Test Connection' karein.
      </p>
    </div>

    <div style="display:flex;gap:0.75rem;flex-direction:column">
      <button class="btn btn-primary w-full" id="btnSimulateSuccess" onclick="triggerSimulatedPaymentSuccess('${esc(orderData.booking_code)}', '${esc(orderData.order_id)}')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Complete Test Mode Payment (${formatInr(totalAmount)}) &rarr;</span>
      </button>

      ${orderData.key_id ? `
        <button class="btn btn-outline w-full" style="display:inline-flex;align-items:center;justify-content:center;gap:0.4rem;font-size:0.86rem" onclick="forceOpenRazorpayCheckout('${esc(orderData.key_id)}', ${orderData.amount}, '${esc(orderData.booking_code)}', '${esc(name)}', '${esc(phone)}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <span>Attempt Official Razorpay Popup Modal</span>
        </button>
      ` : ''}

      <button class="btn btn-outline w-full" onclick="openPaymentOptions()">
        &larr; Back to Payment Options
      </button>
    </div>
  `;
}

function forceOpenRazorpayCheckout(keyId, amount, bookingCode, name, phone) {
  if (typeof window.Razorpay !== 'function') {
    alert('Razorpay script is not ready. Please refresh or check connection.');
    return;
  }
  try {
    const opts = {
      key: keyId,
      amount: amount,
      currency: 'INR',
      name: 'Pahadnama Trails',
      description: `${currentTrek?.name || 'Sahyadri Trek'} (Test Mode)`,
      image: '/brand/pahadnama-logo.png',
      prefill: {
        name: name,
        contact: phone
      },
      theme: {
        color: '#d76d2e'
      },
      handler: async function (resp) {
        showToast('Payment successful via Razorpay popup!');
        await verifyPaymentOnBackend(
          bookingCode,
          resp.razorpay_order_id || `order_test_${Date.now()}`,
          resp.razorpay_payment_id || `pay_test_${Date.now()}`,
          resp.razorpay_signature || 'demo_test_signature'
        );
      },
      modal: {
        ondismiss: function () {
          showToast('Checkout window closed.');
        }
      }
    };
    const rzp = new window.Razorpay(opts);
    rzp.on('payment.failed', function (failResp) {
      alert('Payment declined: ' + (failResp.error?.description || 'Transaction failed'));
    });
    rzp.open();
  } catch (err) {
    alert('Could not open Razorpay checkout: ' + err.message);
  }
}

async function triggerSimulatedPaymentSuccess(bookingCode, orderId) {
  const btn = document.getElementById('btnSimulateSuccess');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Verifying Cryptographic Payment...</span>';
  }
  const dummyPayId = `pay_test_${Date.now()}`;
  await verifyPaymentOnBackend(bookingCode, orderId, dummyPayId, 'demo_test_signature');
}

async function verifyPaymentOnBackend(bookingCode, orderId, paymentId, signature) {
  try {
    const res = await api('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_code: bookingCode,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature
      })
    });

    if (res.ok && res.booking) {
      showToast('Payment Verified! Booking Confirmed.');
      renderBookingSuccessVoucher(res.booking);
    } else {
      throw new Error(res.error || 'Verification failed');
    }
  } catch (err) {
    alert('Payment Verification Issue: ' + err.message);
  }
}

// Render official confirmation voucher
function renderBookingSuccessVoucher(b) {
  const content = document.getElementById('bookingModalContent');
  const shareText = encodeURIComponent(
    `*Pahadnama Trails — Booking Voucher*\n\n` +
    `Booking ID: ${b.booking_code}\n` +
    `Trail: ${b.trek_name}\n` +
    `Batch: ${b.batch_date}\n` +
    `Customer: ${b.customer_name} (${b.customer_phone})\n` +
    `Participants: ${b.participants}\n` +
    `Pickup: ${b.pickup_location || 'Confirmed'}\n` +
    `Total Paid: ${formatInr(b.total_amount)}\n` +
    `Payment Status: CONFIRMED (PAID)\n` +
    `Razorpay ID: ${b.razorpay_payment_id || b.razorpay_order_id}\n\n` +
    `See you in the Sahyadri mountains! \u{1F3D4}`
  );
  const waUrl = `https://wa.me/${siteSettings.whatsapp_number || '919137761400'}?text=${shareText}`;

  content.innerHTML = `
    <div class="voucher-success-header">
      <div class="voucher-check-icon">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span class="voucher-status-badge">PAYMENT CONFIRMED &bull; TEST MODE</span>
      <h3 style="font-family:var(--font-heading);font-size:1.6rem;font-weight:800;color:var(--primary-dark);margin:0.4rem 0">Booking Officially Confirmed!</h3>
      <p style="font-size:0.92rem;color:var(--text-muted)">Your weekend adventure slot with Pahadnama Trails is locked in.</p>
    </div>

    <!-- Official Voucher Card -->
    <div class="official-voucher-card" id="printVoucherArea">
      <div class="voucher-card-top">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <img src="/brand/pahadnama-logo.png" alt="Pahadnama Trails" style="width:44px;height:44px;border-radius:10px;object-fit:cover;background:#1e2c22">
          <div>
            <div style="font-family:var(--font-heading);font-weight:800;font-size:1rem;color:var(--primary-dark)">PAHADNAMA TRAILS</div>
            <div style="font-size:0.75rem;color:var(--accent);font-weight:700;letter-spacing:0.05em">OFFICIAL TREK PASS</div>
          </div>
        </div>
        <div class="voucher-code-badge" onclick="copyText('${esc(b.booking_code)}')" title="Click to copy">
          <small>BOOKING REF</small>
          <strong>${esc(b.booking_code)}</strong>
        </div>
      </div>

      <div class="voucher-grid">
        <div class="voucher-item">
          <span class="v-label">TRAIL DESTINATION</span>
          <strong class="v-val">${esc(b.trek_name)}</strong>
        </div>
        <div class="voucher-item">
          <span class="v-label">BATCH DATE</span>
          <strong class="v-val">${esc(b.batch_date)}</strong>
        </div>
        <div class="voucher-item">
          <span class="v-label">LEAD TREKKER</span>
          <strong class="v-val">${esc(b.customer_name)}</strong>
        </div>
        <div class="voucher-item">
          <span class="v-label">PARTICIPANTS</span>
          <strong class="v-val">${esc(b.participants)} Person(s)</strong>
        </div>
        <div class="voucher-item">
          <span class="v-label">PICKUP POINT</span>
          <strong class="v-val">${esc(b.pickup_location || 'Dadar / Direct Base')}</strong>
        </div>
        <div class="voucher-item">
          <span class="v-label">TOTAL AMOUNT PAID</span>
          <strong class="v-val" style="color:var(--success)">${formatInr(b.total_amount)}</strong>
        </div>
      </div>

      <div class="voucher-card-footer">
        <div>
          <small style="display:block;color:var(--text-muted);font-size:0.72rem">PAYMENT REFERENCE</small>
          <code style="font-size:0.78rem;color:var(--primary-dark)">${esc(b.razorpay_payment_id || b.razorpay_order_id || 'RZP-TEST')}</code>
        </div>
        <div class="voucher-stamp">PAID &bull; VERIFIED</div>
      </div>
    </div>

    <!-- Actions -->
    <div style="display:flex;gap:0.75rem;flex-direction:column;margin-top:1.5rem">
      <a href="${waUrl}" target="_blank" class="btn btn-whatsapp w-full">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.074-2.029-.446-1.577-.614-2.583-2.203-2.66-2.308-.078-.105-.639-.851-.639-1.624 0-.773.405-1.156.549-1.311.144-.155.316-.195.421-.195.105 0 .211.001.303.006.098.005.228-.037.356.27.133.317.451 1.101.492 1.182.04.081.066.176.013.281-.052.105-.078.172-.156.262-.078.09-.163.2-.234.269-.078.077-.16.16-.068.318.092.158.408.673.876 1.09 1.031.919 1.583 1.026 1.764 1.117.181.09.287.078.393-.044.106-.123.456-.532.578-.716.123-.184.246-.154.41-.093.164.061 1.042.491 1.221.58.179.09.298.134.342.208.044.075.044.434-.1.839z"/></svg>
        <span>Share Voucher on WhatsApp &rarr;</span>
      </a>
      <div style="display:flex;gap:0.75rem">
        <button type="button" class="btn btn-outline" style="flex:1" onclick="window.print()">
          <span>Print / Save PDF</span>
        </button>
        <button type="button" class="btn btn-outline" style="flex:1" onclick="closeBookingModal()">
          <span>Done &amp; Close</span>
        </button>
      </div>
    </div>
  `;
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('open');
}

function confirmPaymentWhatsApp() {
  if (!currentTrek) return;
  const phone = siteSettings.whatsapp_number || '919137761400';
  const text = encodeURIComponent(
    `Hi Pahadnama Trails!\nI have made the payment for ${currentTrek.name} for the batch on ${currentSelectedDateStr || 'Upcoming Weekend'}. Attaching my transaction screenshot here for confirmation!`
  );
  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
}

// Copy UPI ID helper
function copyUpiId() {
  const upi = siteSettings.upi_id || 'pahadnamatrails@okaxis';
  copyText(upi);
}

function copyText(str) {
  navigator.clipboard.writeText(str).then(() => {
    showToast('Copied to clipboard: ' + str);
  }).catch(() => {
    prompt('Copy to clipboard:', str);
  });
}

// Custom Trek Request Modal (6+ people)
function openCustomTrekModal() {
  document.getElementById('customTrekModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCustomTrekModal() {
  document.getElementById('customTrekModal').classList.remove('open');
  document.body.style.overflow = '';
}

function handleCustomTrekSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('custName').value;
  const phone = document.getElementById('custPhone').value;
  const trek = document.getElementById('custTrekSelect').value;
  const date = document.getElementById('custDate').value;
  const count = document.getElementById('custCount').value;
  const pickup = document.getElementById('custPickup').value || 'Mumbai';
  const notes = document.getElementById('custNotes').value || 'None';

  const waPhone = siteSettings.whatsapp_number || '919137761400';
  const msg = encodeURIComponent(
    `Hi Pahadnama Trails! Custom Trek Request:\n- Organizer Name: ${name}\n- Contact: ${phone}\n- Group Size: ${count} participants (6+)\n- Preferred Trail: ${trek}\n- Preferred Date: ${date}\n- Pickup Area: ${pickup}\n- Special Notes: ${notes}\n\nPlease share itinerary and customized group quote!`
  );

  window.open(`https://wa.me/${waPhone}?text=${msg}`, '_blank');
  closeCustomTrekModal();
  showToast('Connecting to WhatsApp with your group details...');
}

// Feedback / Reviews
async function loadFeedback() {
  const grid = document.getElementById('feedbackGrid');
  try {
    const reviews = await api('/api/feedback');
    if (!reviews.length) {
      grid.innerHTML = `<div class="loading-placeholder"><p>Be the first to share a Sahyadri trail story!</p></div>`;
      return;
    }

    grid.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-stars">${'\u2605'.repeat(r.rating)}${'\u2606'.repeat(5 - r.rating)}</div>
        <p class="review-comment">&ldquo;${esc(r.comment)}&rdquo;</p>
        <div class="review-meta">
          <div class="review-author">${esc(r.name)}</div>
          <div class="review-trek-badge">${esc(r.trek_title || r.trek_name || 'Sahyadri Explorer')}</div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<div class="loading-placeholder"><p>Reviews will appear here shortly.</p></div>`;
  }
}

function openFeedbackModal() {
  document.getElementById('feedbackModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeFeedbackModal() {
  document.getElementById('feedbackModal').classList.remove('open');
  document.body.style.overflow = '';
}

async function handleFeedbackSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('feedbackForm');
  const formData = new FormData(form);
  const submitBtn = document.getElementById('fbSubmitBtn');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit');

    form.reset();
    closeFeedbackModal();
    showToast(data.message || 'Thank you! Your review has been submitted for approval.');
  } catch (err) {
    alert(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Review';
  }
}

// Toggle FAQ Accordion
function toggleFaq(button) {
  const item = button.closest('.accordion-item');
  const body = item.querySelector('.accordion-body');
  const isOpen = item.classList.contains('active');

  // Close all other items in same accordion
  const parent = item.closest('.accordion');
  parent.querySelectorAll('.accordion-item').forEach(other => {
    if (other !== item) {
      other.classList.remove('active');
      other.querySelector('.accordion-body').style.maxHeight = null;
    }
  });

  if (isOpen) {
    item.classList.remove('active');
    body.style.maxHeight = null;
  } else {
    item.classList.add('active');
    body.style.maxHeight = body.scrollHeight + 'px';
  }
}

// Close modals on escape or outside click
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeTrekModal();
    closeFeedbackModal();
    closeCustomTrekModal();
    closeBookingModal();
  }
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      closeTrekModal();
      closeFeedbackModal();
      closeCustomTrekModal();
      closeBookingModal();
    }
  });
});

// Boot app
document.addEventListener('DOMContentLoaded', initApp);
