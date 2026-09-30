/**
 * Pahadnama Trails ? Admin Control Center Logic
 */
let currentTab = 'overview';
let activeTrekList = [];

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

function showToast(msg) {
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

async function adminApi(url, options = {}) {
  options.credentials = 'include';
  const res = await fetch(url, options);
  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch {}
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

async function checkAuth() {
  try {
    const res = await adminApi('/api/admin/me');
    if (res.authenticated) showDashboard();
    else showLogin();
  } catch {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('adminApp').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminApp').classList.remove('hidden');
  loadTab(currentTab);
}

function togglePassVisibility() {
  const input = document.getElementById('adminPass');
  const eyeOpen = document.getElementById('eyeOpenIcon');
  const eyeSlash = document.getElementById('eyeSlashIcon');
  const btn = document.getElementById('toggleEyeBtn');
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    if (eyeOpen) eyeOpen.classList.add('hidden');
    if (eyeSlash) eyeSlash.classList.remove('hidden');
    if (btn) btn.setAttribute('title', 'Hide password');
  } else {
    input.type = 'password';
    if (eyeOpen) eyeOpen.classList.remove('hidden');
    if (eyeSlash) eyeSlash.classList.add('hidden');
    if (btn) btn.setAttribute('title', 'Show password');
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginSubmitBtn');
  const errBox = document.getElementById('loginError');
  if (errBox) {
    errBox.classList.add('hidden');
    errBox.textContent = '';
  }

  btn.disabled = true;
  btn.innerHTML = '<span>Verifying credentials...</span>';
  try {
    const username = document.getElementById('adminUser').value.trim();
    const password = document.getElementById('adminPass').value;
    const res = await adminApi('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      showToast('Welcome, ' + (res.name || 'Trail Master') + '!');
      showDashboard();
    }
  } catch (err) {
    if (errBox) {
      errBox.innerHTML = `<strong>Authentication Failed:</strong> ${esc(err.message || 'Invalid username or password')}`;
      errBox.classList.remove('hidden');
    } else {
      alert('Login failed: ' + err.message);
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Sign In to Dashboard &rarr;</span>';
  }
}

async function handleAdminLogout() {
  await adminApi('/api/admin/logout', { method: 'POST' });
  location.reload();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    loadTab(item.dataset.tab);
  });
});

async function loadTab(tab) {
  currentTab = tab;
  const content = document.getElementById('adminContent');
  const title = document.getElementById('pageTitle');
  const topbarActions = document.getElementById('topbarActions');
  topbarActions.innerHTML = '';

  if (tab === 'overview') {
    title.textContent = 'Dashboard Overview';
    topbarActions.innerHTML = '<button class="btn-admin-primary" onclick="openAddTrekModal()">+ Add New Trek</button>';
    renderOverview();
  } else if (tab === 'treks') {
    title.textContent = 'Treks Management';
    topbarActions.innerHTML = '<button class="btn-admin-primary" onclick="openAddTrekModal()">+ Add New Trek</button>';
    renderTreksTab();
  } else if (tab === 'bookings') {
    title.textContent = 'Bookings & Online Payments';
    topbarActions.innerHTML = '<button class="btn-admin-outline" onclick="renderBookingsTab()"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>Refresh</button>';
    renderBookingsTab();
  } else if (tab === 'dates') {
    title.textContent = 'Weekend Slots & Availability';
    renderDatesTab();
  } else if (tab === 'photos') {
    title.textContent = 'Photo Gallery Manager';
    renderPhotosTab();
  } else if (tab === 'feedback') {
    title.textContent = 'Customer Review Moderation';
    renderFeedbackTab();
  } else if (tab === 'faqs') {
    title.textContent = 'FAQs Manager';
    topbarActions.innerHTML = '<button class="btn-admin-primary" onclick="openAddFaqModal()">+ Add FAQ</button>';
    renderFaqsTab();
  } else if (tab === 'settings') {
    title.textContent = 'Booking & Contact Settings';
    renderSettingsTab();
  } else if (tab === 'security') {
    title.textContent = 'Security & Password';
    renderSecurityTab();
  }
}

async function renderOverview() {
  const content = document.getElementById('adminContent');
  content.innerHTML = '<p>Loading metrics...</p>';
  try {
    const data = await adminApi('/api/admin/overview');
    document.getElementById('pendingCountBadge').textContent = data.pendingFeedback || 0;
    const bookingsBadge = document.getElementById('bookingsCountBadge');
    if (bookingsBadge) {
      bookingsBadge.textContent = data.totalBookings || 0;
      bookingsBadge.style.display = data.totalBookings > 0 ? 'inline-flex' : 'none';
    }

    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon-wrap"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><path d="M23 21l-9-17-5 9.5"/></svg></div>
          <div><div class="stat-val">${data.totalTreks}</div><div class="stat-label">Total Treks</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap" style="background:#ecfdf5;color:#16a34a"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div><div class="stat-val" style="color:#16a34a">${data.paidBookings || 0}</div><div class="stat-label">Confirmed Bookings (${data.totalBookings || 0} total)</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap" style="background:#eff6ff;color:#2563eb"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
          <div><div class="stat-val">&#8377;${Number(data.totalRevenue || 0).toLocaleString('en-IN')}</div><div class="stat-label">Verified Online Revenue</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
          <div><div class="stat-val">${data.pendingFeedback}</div><div class="stat-label">Reviews Awaiting Approval</div></div>
        </div>
      </div>
      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Quick Control Guide</h3></div>
        <div style="line-height:1.7;color:#475569">
          <p>&bull; <strong>Bookings &amp; Payments:</strong> View online bookings, customer contacts, and Razorpay test mode payment verification vouchers in real-time.</p>
          <p>&bull; <strong>Treks:</strong> Edit pricing, detailed itineraries, difficulty, and cover photos without touching source code.</p>
          <p>&bull; <strong>Weekend Slots:</strong> Add or remove Saturday and Sunday dates. Mark slots as <code>Full</code> or <code>Available</code>.</p>
          <p>&bull; <strong>Photos:</strong> Upload genuine trek photos directly from your phone or laptop into any trek gallery.</p>
          <p>&bull; <strong>Reviews:</strong> Moderate customer feedback before it appears publicly on the site.</p>
          <p>&bull; <strong>Settings:</strong> Update your official WhatsApp number, UPI ID, Google Form link, or Razorpay Test Mode keys anytime.</p>
        </div>
      </div>`;
  } catch (err) {
    content.innerHTML = '<p style="color:red">Failed to load overview: ' + esc(err.message) + '</p>';
  }
}

/* Treks Tab */
async function renderTreksTab() {
  const content = document.getElementById('adminContent');
  content.innerHTML = '<p>Loading treks...</p>';
  try {
    activeTrekList = await adminApi('/api/admin/treks');
    content.innerHTML = `
      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Published Maharashtra Treks (${activeTrekList.length})</h3></div>
        <table class="admin-table">
          <thead>
            <tr><th>Cover</th><th>Trek Name</th><th>Location</th><th>Price</th><th>Difficulty</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${activeTrekList.map(t => `
              <tr>
                <td><img src="${esc(t.cover_photo || '/brand/pahadnama-logo.png')}" alt="" class="table-thumb"></td>
                <td><strong>${esc(t.name)}</strong><br><small style="color:var(--admin-text-muted)">${esc(t.duration)} &bull; ${t.dates ? t.dates.length : 0} dates</small></td>
                <td>${esc(t.location)}</td>
                <td><strong>&#8377;${Number(t.price).toLocaleString('en-IN')}</strong></td>
                <td>${esc(t.difficulty)}</td>
                <td><span class="table-badge ${t.status}">${esc(t.status)}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="btn-admin-primary btn-admin-sm" onclick="openEditTrekModal(${t.id})">Edit</button>
                    <button class="btn-admin-outline btn-admin-sm" onclick="openDatesForTrek(${t.id})">Dates</button>
                    <button class="btn-admin-outline btn-admin-sm" onclick="openPhotosForTrek(${t.id})">Photos</button>
                    <button class="btn-admin-danger btn-admin-sm" onclick="handleDeleteTrek(${t.id}, '${esc(t.name)}')">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    content.innerHTML = '<p style="color:red">Failed to load treks: ' + esc(err.message) + '</p>';
  }
}

function openAddTrekModal() { openTrekFormModal(null); }
async function openEditTrekModal(id) {
  try {
    const trek = await adminApi('/api/treks/' + id);
    openTrekFormModal(trek);
  } catch (err) { alert('Failed to load trek: ' + err.message); }
}

function openTrekFormModal(t) {
  const isEdit = !!t;
  const modal = document.getElementById('adminModal');
  const body = document.getElementById('adminModalBody');

  const highlightsVal = t && t.highlights ? t.highlights.join('\n') : '';
  const itineraryVal = t && t.itinerary ? t.itinerary.join('\n') : '';
  const inclusionsVal = t && t.inclusions ? t.inclusions.join('\n') : '';
  const exclusionsVal = t && t.exclusions ? t.exclusions.join('\n') : '';
  const carryVal = t && t.things_to_carry ? t.things_to_carry.join('\n') : '';

  body.innerHTML = `
    <div style="margin-bottom:1.5rem">
      <h2 style="font-family:var(--font-heading);font-size:1.5rem;font-weight:800">${isEdit ? 'Edit Trek' : 'Add New Trek'}</h2>
      <p style="font-size:0.85rem;color:var(--admin-text-muted)">All information entered here reflects dynamically on the website.</p>
    </div>
    <form id="trekForm" onsubmit="handleSaveTrek(event, ${t ? t.id : 'null'})">
      <div class="form-grid">
        <div class="admin-form-group">
          <label>Trek Name *</label>
          <input type="text" name="name" value="${esc(t ? t.name : '')}" required placeholder="e.g. Harishchandragad &mdash; Kokankada">
        </div>
        <div class="admin-form-group">
          <label>Location *</label>
          <input type="text" name="location" value="${esc(t ? t.location : '')}" required placeholder="e.g. Pachnai, Ahmednagar">
        </div>
        <div class="admin-form-group">
          <label>Difficulty</label>
          <select name="difficulty">
            ${['Easy to Moderate', 'Moderate', 'Moderate to Thrilling', 'Difficult'].map(d => `
              <option ${t && t.difficulty === d ? 'selected' : ''}>${d}</option>
            `).join('')}
          </select>
        </div>
        <div class="admin-form-group">
          <label>Starting Price (&#8377;) *</label>
          <input type="number" name="price" value="${t ? t.price : 1199}" required>
        </div>
        <div class="admin-form-group">
          <label>Duration</label>
          <input type="text" name="duration" value="${esc(t ? t.duration : '1 Day')}" placeholder="e.g. 1 Day / 1 Night 1 Day">
        </div>
        <div class="admin-form-group">
          <label>Distance</label>
          <input type="text" name="distance" value="${esc(t ? t.distance : '8 km')}">
        </div>
        <div class="admin-form-group">
          <label>Altitude / Height</label>
          <input type="text" name="height" value="${esc(t ? t.height : '3,500 ft')}">
        </div>
        <div class="admin-form-group">
          <label>Best Season</label>
          <input type="text" name="season" value="${esc(t ? t.season : 'Monsoon & Winter')}">
        </div>
        <div class="admin-form-group full-width">
          <label>Short Description</label>
          <input type="text" name="short_description" value="${esc(t ? t.short_description : '')}">
        </div>
        <div class="admin-form-group full-width">
          <label>Full Description</label>
          <textarea name="description" rows="3">${esc(t ? t.description : '')}</textarea>
        </div>
        <div class="admin-form-group full-width">
          <label>Detailed Itinerary (One step per line) *</label>
          <textarea name="itinerary" rows="5" required>${esc(itineraryVal)}</textarea>
        </div>
        <div class="admin-form-group">
          <label>Highlights (One per line)</label>
          <textarea name="highlights" rows="4">${esc(highlightsVal)}</textarea>
        </div>
        <div class="admin-form-group">
          <label>Inclusions (One per line)</label>
          <textarea name="inclusions" rows="4">${esc(inclusionsVal)}</textarea>
        </div>
        <div class="admin-form-group">
          <label>Exclusions (One per line)</label>
          <textarea name="exclusions" rows="4">${esc(exclusionsVal)}</textarea>
        </div>
        <div class="admin-form-group">
          <label>Things to Carry (One per line)</label>
          <textarea name="things_to_carry" rows="4">${esc(carryVal)}</textarea>
        </div>
        <div class="admin-form-group full-width">
          <label>Meeting &amp; Pickup Points</label>
          <input type="text" name="meeting_point" value="${esc(t ? t.meeting_point : '')}">
        </div>
        <div class="admin-form-group">
          <label>Status</label>
          <select name="status">
            <option value="active" ${!t || t.status === 'active' ? 'selected' : ''}>Active (Published)</option>
            <option value="paused" ${t && t.status === 'paused' ? 'selected' : ''}>Paused</option>
            <option value="closed" ${t && t.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </div>
      </div>
      <div style="margin-top:2rem;display:flex;justify-content:flex-end;gap:1rem">
        <button type="button" class="btn-admin-outline" onclick="closeAdminModal()">Cancel</button>
        <button type="submit" class="btn-admin-primary">Save Trek</button>
      </div>
    </form>`;
  modal.classList.add('open');
}

async function handleSaveTrek(e, id) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());
  try {
    if (id) {
      await adminApi('/api/admin/treks/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      showToast('Trek updated successfully!');
    } else {
      await adminApi('/api/admin/treks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      showToast('New trek created!');
    }
    closeAdminModal();
    renderTreksTab();
  } catch (err) { alert('Error: ' + err.message); }
}

async function handleDeleteTrek(id, name) {
  if (confirm(`Delete "${name}" and all associated dates and photos?`)) {
    try {
      await adminApi('/api/admin/treks/' + id, { method: 'DELETE' });
      showToast('Trek deleted.');
      renderTreksTab();
    } catch (err) { alert('Delete failed: ' + err.message); }
  }
}

/* Weekend Dates Tab */
async function renderDatesTab(preselectTrekId = null) {
  const content = document.getElementById('adminContent');
  content.innerHTML = '<p>Loading weekend slots...</p>';
  try {
    const treks = await adminApi('/api/admin/treks');
    if (!treks.length) { content.innerHTML = '<p>Please add a trek first.</p>'; return; }
    const selectedTrekId = preselectTrekId || treks[0].id;
    const currentTrek = treks.find(t => t.id === selectedTrekId) || treks[0];

    content.innerHTML = `
      <div class="admin-panel">
        <div class="admin-panel-head">
          <h3>Manage Saturday &amp; Sunday Slots</h3>
          <div style="display:flex;align-items:center;gap:0.75rem">
            <label style="font-weight:700">Select Trek:</label>
            <select id="dateTrekSelector" onchange="renderDatesTab(parseInt(this.value))" style="padding:0.4rem 0.8rem;border-radius:6px;border:1px solid var(--admin-border)">
              ${treks.map(t => `<option value="${t.id}" ${t.id === currentTrek.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="slot-quick-add">
          <h4 style="font-family:var(--font-heading);font-size:0.95rem;margin-bottom:0.75rem">Add Upcoming Saturday / Sunday Batch</h4>
          <form onsubmit="handleAddDate(event, ${currentTrek.id})" style="display:grid;grid-template-columns:repeat(4, 1fr) auto;gap:0.75rem;align-items:flex-end">
            <div class="admin-form-group" style="margin:0">
              <label>Date *</label>
              <input type="date" name="event_date" required id="newSlotDate">
            </div>
            <div class="admin-form-group" style="margin:0">
              <label>Total Seats</label>
              <input type="number" name="total_seats" value="30" required>
            </div>
            <div class="admin-form-group" style="margin:0">
              <label>Available Seats</label>
              <input type="number" name="available_seats" value="30" required>
            </div>
            <div class="admin-form-group" style="margin:0">
              <label>Initial Status</label>
              <select name="status">
                <option value="AVAILABLE">Available</option>
                <option value="FAST_FILLING">Fast Filling</option>
                <option value="FULL">Full</option>
              </select>
            </div>
            <button type="submit" class="btn-admin-primary">+ Add Slot</button>
          </form>
        </div>

        <table class="admin-table">
          <thead>
            <tr><th>Date</th><th>Day</th><th>Availability</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${(currentTrek.dates && currentTrek.dates.length) ? currentTrek.dates.map(d => `
              <tr>
                <td><strong>${esc(d.event_date)}</strong></td>
                <td>${esc(d.day_of_week)}</td>
                <td>${d.available_seats} / ${d.total_seats} seats</td>
                <td><span class="table-badge ${(d.status || '').toLowerCase()}">${esc(d.status)}</span></td>
                <td>
                  <div class="table-actions">
                    ${d.status !== 'FULL' ? `
                      <button class="btn-admin-outline btn-admin-sm" onclick="toggleDateStatus(${d.id}, 'FULL', ${currentTrek.id})">Mark Full</button>
                    ` : `
                      <button class="btn-admin-success btn-admin-sm" onclick="toggleDateStatus(${d.id}, 'AVAILABLE', ${currentTrek.id})">Mark Available</button>
                    `}
                    <button class="btn-admin-danger btn-admin-sm" onclick="handleDeleteDate(${d.id}, ${currentTrek.id})">Delete</button>
                  </div>
                </td>
              </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--admin-text-muted)">No weekend dates published yet. Add one above!</td></tr>'}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    content.innerHTML = '<p style="color:red">Failed: ' + esc(err.message) + '</p>';
  }
}

function openDatesForTrek(id) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelector('[data-tab="dates"]').classList.add('active');
  renderDatesTab(id);
}

async function handleAddDate(e, trekId) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());
  try {
    await adminApi(`/api/admin/treks/${trekId}/dates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    showToast('Batch date added!');
    renderDatesTab(trekId);
  } catch (err) { alert('Failed: ' + err.message); }
}

async function toggleDateStatus(dateId, newStatus, trekId) {
  try {
    await adminApi(`/api/admin/dates/${dateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, available_seats: newStatus === 'FULL' ? 0 : 25 })
    });
    showToast('Date updated.');
    renderDatesTab(trekId);
  } catch (err) { alert('Update failed: ' + err.message); }
}

async function handleDeleteDate(dateId, trekId) {
  if (confirm('Delete this weekend date slot?')) {
    try {
      await adminApi(`/api/admin/dates/${dateId}`, { method: 'DELETE' });
      showToast('Date deleted.');
      renderDatesTab(trekId);
    } catch (err) { alert('Delete failed: ' + err.message); }
  }
}

/* Photos Tab */
async function renderPhotosTab(preselectTrekId = null) {
  const content = document.getElementById('adminContent');
  content.innerHTML = '<p>Loading photo manager...</p>';
  try {
    const treks = await adminApi('/api/admin/treks');
    if (!treks.length) { content.innerHTML = '<p>Add a trek first.</p>'; return; }
    const selectedTrekId = preselectTrekId || treks[0].id;
    const currentTrek = treks.find(t => t.id === selectedTrekId) || treks[0];

    content.innerHTML = `
      <div class="admin-panel">
        <div class="admin-panel-head">
          <h3>Genuine Trek Photos &amp; Gallery</h3>
          <div style="display:flex;align-items:center;gap:0.75rem">
            <label style="font-weight:700">Select Trek:</label>
            <select id="photoTrekSelector" onchange="renderPhotosTab(parseInt(this.value))" style="padding:0.4rem 0.8rem;border-radius:6px;border:1px solid var(--admin-border)">
              ${treks.map(t => `<option value="${t.id}" ${t.id === currentTrek.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div style="background:#f8fafc;padding:1.5rem;border-radius:8px;margin-bottom:2rem;border:1px solid var(--admin-border)">
          <h4 style="font-family:var(--font-heading);font-size:1rem;margin-bottom:0.5rem">Change Cover Photo</h4>
          <p style="font-size:0.85rem;color:var(--admin-text-muted);margin-bottom:1rem">This image appears prominently on the homepage trek card.</p>
          <form onsubmit="handleCoverUpload(event, ${currentTrek.id})" style="display:flex;align-items:center;gap:1rem">
            <input type="file" name="cover" accept="image/*" required style="font-size:0.9rem">
            <button type="submit" class="btn-admin-primary">Upload Cover Image</button>
          </form>
          ${currentTrek.cover_photo ? `
            <div style="margin-top:1rem">
              <small style="display:block;color:var(--admin-text-muted);margin-bottom:0.4rem">Current Cover:</small>
              <img src="${esc(currentTrek.cover_photo)}" style="width:200px;border-radius:6px;border:1px solid var(--admin-border);box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            </div>` : ''}
        </div>

        <div style="background:#f8fafc;padding:1.5rem;border-radius:8px;margin-bottom:2rem;border:1px solid var(--admin-border)">
          <h4 style="font-family:var(--font-heading);font-size:1rem;margin-bottom:0.5rem">Upload Trail Gallery Photos</h4>
          <p style="font-size:0.85rem;color:var(--admin-text-muted);margin-bottom:1rem">Upload real photographs from your past batches into the trek modal gallery.</p>
          <form onsubmit="handleGalleryUpload(event, ${currentTrek.id})" style="display:flex;align-items:center;gap:1rem">
            <input type="file" name="photos" accept="image/*" multiple required style="font-size:0.9rem">
            <button type="submit" class="btn-admin-primary">+ Upload to Gallery</button>
          </form>
        </div>

        <h4 style="font-family:var(--font-heading);font-size:1.1rem;margin-bottom:0.75rem">Current Gallery Photos (${currentTrek.photos ? currentTrek.photos.length : 0})</h4>
        <div class="admin-photo-grid">
          ${(currentTrek.photos && currentTrek.photos.length) ? currentTrek.photos.map(p => `
            <div class="admin-photo-card">
              <img src="${esc(p.url)}" alt="">
              <button class="photo-delete-btn" onclick="handleDeletePhoto(${p.id}, ${currentTrek.id})" title="Delete photo">&times;</button>
            </div>`).join('') : '<p style="color:var(--admin-text-muted)">No gallery photos uploaded yet.</p>'}
        </div>
      </div>`;
  } catch (err) {
    content.innerHTML = '<p style="color:red">Failed: ' + esc(err.message) + '</p>';
  }
}

function openPhotosForTrek(id) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelector('[data-tab="photos"]').classList.add('active');
  renderPhotosTab(id);
}

async function handleCoverUpload(e, trekId) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  try {
    await fetch(`/api/admin/treks/${trekId}/cover`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    showToast('Cover photo updated!');
    renderPhotosTab(trekId);
  } catch (err) { alert('Upload failed: ' + err.message); }
}

async function handleGalleryUpload(e, trekId) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  try {
    const res = await fetch(`/api/admin/treks/${trekId}/photos`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    showToast('Photos uploaded to gallery!');
    renderPhotosTab(trekId);
  } catch (err) { alert('Upload failed: ' + err.message); }
}

async function handleDeletePhoto(photoId, trekId) {
  if (confirm('Delete this photo from the gallery?')) {
    try {
      await adminApi(`/api/admin/photos/${photoId}`, { method: 'DELETE' });
      showToast('Photo removed.');
      renderPhotosTab(trekId);
    } catch (err) { alert('Delete failed: ' + err.message); }
  }
}

/* Feedback Moderation Tab */
async function renderFeedbackTab() {
  const content = document.getElementById('adminContent');
  content.innerHTML = '<p>Loading customer reviews...</p>';
  try {
    const list = await adminApi('/api/admin/feedback');
    const pendingCount = list.filter(r => !r.approved).length;
    document.getElementById('pendingCountBadge').textContent = pendingCount;

    content.innerHTML = `
      <div class="admin-panel">
        <div class="admin-panel-head">
          <h3>Customer Reviews Moderation Queue (${list.length})</h3>
          <small style="color:var(--admin-text-muted)">Reviews must be approved before they appear publicly on the website.</small>
        </div>
        <table class="admin-table">
          <thead>
            <tr><th>Customer</th><th>Trek</th><th>Rating</th><th>Review Comment</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${list.length ? list.map(r => `
              <tr>
                <td><strong>${esc(r.name)}</strong></td>
                <td>${esc(r.trek_title || r.trek_name || 'General')}</td>
                <td style="color:#f59e0b;font-size:1.05rem;letter-spacing:1px">${'\u2605'.repeat(r.rating)}${'\u2606'.repeat(5 - r.rating)}</td>
                <td style="max-width:320px">${esc(r.comment)}</td>
                <td><span class="table-badge ${r.approved ? 'active' : 'paused'}">${r.approved ? 'Approved' : 'Pending'}</span></td>
                <td>
                  <div class="table-actions">
                    ${!r.approved ? `
                      <button class="btn-admin-success btn-admin-sm" onclick="toggleReviewApproval(${r.id}, 1)">Approve</button>
                    ` : `
                      <button class="btn-admin-outline btn-admin-sm" onclick="toggleReviewApproval(${r.id}, 0)">Hide</button>
                    `}
                    <button class="btn-admin-danger btn-admin-sm" onclick="handleDeleteReview(${r.id})">Delete</button>
                  </div>
                </td>
              </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--admin-text-muted)">No reviews submitted yet.</td></tr>'}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    content.innerHTML = '<p style="color:red">Failed: ' + esc(err.message) + '</p>';
  }
}

async function toggleReviewApproval(id, approvedVal) {
  try {
    await adminApi('/api/admin/feedback/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: approvedVal })
    });
    showToast(approvedVal ? 'Review approved and published!' : 'Review hidden.');
    renderFeedbackTab();
  } catch (err) { alert('Moderation failed: ' + err.message); }
}

async function handleDeleteReview(id) {
  if (confirm('Permanently delete this review?')) {
    try {
      await adminApi('/api/admin/feedback/' + id, { method: 'DELETE' });
      showToast('Review deleted.');
      renderFeedbackTab();
    } catch (err) { alert('Delete failed: ' + err.message); }
  }
}

/* FAQs Tab */
async function renderFaqsTab() {
  const content = document.getElementById('adminContent');
  content.innerHTML = '<p>Loading FAQs...</p>';
  try {
    const treks = await adminApi('/api/admin/treks');
    let allFaqs = [];
    treks.forEach(t => {
      (t.faqs || []).forEach(f => {
        allFaqs.push({ ...f, trek_name: t.name, trek_id: t.id });
      });
    });

    content.innerHTML = `
      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Trek FAQs</h3></div>
        <table class="admin-table">
          <thead><tr><th>Trek</th><th>Question</th><th>Answer</th><th>Actions</th></tr></thead>
          <tbody>
            ${allFaqs.length ? allFaqs.map(f => `
              <tr>
                <td><strong>${esc(f.trek_name)}</strong></td>
                <td>${esc(f.question)}</td>
                <td>${esc(f.answer)}</td>
                <td><button class="btn-admin-danger btn-admin-sm" onclick="handleDeleteFaq(${f.id})">Delete</button></td>
              </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--admin-text-muted)">No FAQs yet. Add one with the button above!</td></tr>'}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    content.innerHTML = '<p style="color:red">Failed: ' + esc(err.message) + '</p>';
  }
}

function openAddFaqModal() {
  const modal = document.getElementById('adminModal');
  const body = document.getElementById('adminModalBody');
  body.innerHTML = `
    <div style="margin-bottom:1.5rem">
      <h2 style="font-family:var(--font-heading);font-size:1.5rem;font-weight:800">Add Trek FAQ</h2>
    </div>
    <form onsubmit="handleSaveFaq(event)">
      <div class="admin-form-group">
        <label>Select Trek *</label>
        <select name="trek_id" required>
          ${activeTrekList.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}
        </select>
      </div>
      <div class="admin-form-group">
        <label>Question *</label>
        <input type="text" name="question" required placeholder="e.g. What is the cancellation policy?">
      </div>
      <div class="admin-form-group">
        <label>Answer *</label>
        <textarea name="answer" rows="4" required></textarea>
      </div>
      <div style="margin-top:1.5rem;display:flex;justify-content:flex-end;gap:1rem">
        <button type="button" class="btn-admin-outline" onclick="closeAdminModal()">Cancel</button>
        <button type="submit" class="btn-admin-primary">Save FAQ</button>
      </div>
    </form>`;
  modal.classList.add('open');
}

async function handleSaveFaq(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());
  try {
    await adminApi('/api/admin/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    showToast('FAQ created!');
    closeAdminModal();
    renderFaqsTab();
  } catch (err) { alert('Failed: ' + err.message); }
}

async function handleDeleteFaq(id) {
  if (confirm('Delete this FAQ?')) {
    try {
      await adminApi('/api/admin/faqs/' + id, { method: 'DELETE' });
      showToast('FAQ removed.');
      renderFaqsTab();
    } catch (err) { alert('Delete failed: ' + err.message); }
  }
}

/* ==========================================
   Bookings & Payments Manager Tab
   ========================================== */

let currentBookingsStatus = 'all';
let currentBookingsSearch = '';

async function renderBookingsTab(filterStatus = currentBookingsStatus, searchQuery = currentBookingsSearch) {
  currentBookingsStatus = filterStatus;
  currentBookingsSearch = searchQuery;
  const content = document.getElementById('adminContent');
  content.innerHTML = '<p>Loading online bookings &amp; transactions...</p>';
  try {
    let url = '/api/admin/bookings?status=' + encodeURIComponent(filterStatus);
    if (searchQuery) url += '&search=' + encodeURIComponent(searchQuery);

    const bookings = await adminApi(url);

    // Compute summary metrics
    const totalCount = bookings.length;
    const paidCount = bookings.filter(b => b.payment_status === 'PAID').length;
    const totalRevenue = bookings
      .filter(b => b.payment_status === 'PAID')
      .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
    const pendingCount = bookings.filter(b => b.payment_status === 'PENDING').length;

    content.innerHTML = `
      <div class="stats-grid" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-icon-wrap" style="background:#ecfdf5;color:#16a34a"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div><div class="stat-val" style="color:#16a34a">${paidCount}</div><div class="stat-label">Confirmed &amp; Paid</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap" style="background:#fef3c7;color:#d97706"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
          <div><div class="stat-val" style="color:#d97706">${pendingCount}</div><div class="stat-label">Awaiting Payment</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap" style="background:#eff6ff;color:#2563eb"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
          <div><div class="stat-val">&#8377;${totalRevenue.toLocaleString('en-IN')}</div><div class="stat-label">Total Verified Revenue</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
          <div><div class="stat-val">${totalCount}</div><div class="stat-label">Total Bookings Recorded</div></div>
        </div>
      </div>

      <div class="admin-panel">
        <div class="admin-panel-head" style="flex-wrap:wrap;gap:1rem">
          <div>
            <h3>Online Reservations &amp; Razorpay Payments</h3>
            <small style="color:var(--admin-text-muted)">Real-time customer registrations, payment proofs, and booking vouchers.</small>
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
            <input type="text" id="bookingSearchInput" placeholder="Search by name, phone, code..." value="${esc(searchQuery)}" onkeyup="if(event.key==='Enter') applyBookingsFilter()" style="padding:0.5rem 0.8rem;border:1px solid var(--admin-border);border-radius:8px;font-size:0.85rem;width:240px">
            <select id="bookingStatusSelect" onchange="applyBookingsFilter()" style="padding:0.5rem 0.8rem;border:1px solid var(--admin-border);border-radius:8px;font-size:0.85rem">
              <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="PAID" ${filterStatus === 'PAID' ? 'selected' : ''}>PAID (Confirmed)</option>
              <option value="PENDING" ${filterStatus === 'PENDING' ? 'selected' : ''}>PENDING</option>
              <option value="CANCELLED" ${filterStatus === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
              <option value="REFUNDED" ${filterStatus === 'REFUNDED' ? 'selected' : ''}>REFUNDED</option>
            </select>
            <button class="btn-admin-primary btn-admin-sm" onclick="applyBookingsFilter()">Filter</button>
          </div>
        </div>

        <table class="admin-table">
          <thead>
            <tr>
              <th>Booking Ref</th>
              <th>Trek &amp; Batch</th>
              <th>Customer Details</th>
              <th>Seats &amp; Fee</th>
              <th>Gateway Ref</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${bookings.length ? bookings.map(b => `
              <tr>
                <td>
                  <strong style="font-family:monospace;font-size:0.92rem;color:var(--admin-accent)">${esc(b.booking_code)}</strong>
                  <br><small style="color:var(--admin-text-muted)">${new Date(b.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                </td>
                <td>
                  <strong>${esc(b.trek_name)}</strong>
                  <br><small style="color:var(--admin-text-muted)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:2px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${esc(b.batch_date)}</small>
                </td>
                <td>
                  <strong>${esc(b.customer_name)}</strong>
                  <br><small style="color:var(--admin-text-muted)"><a href="https://wa.me/${esc(b.customer_phone.replace(/[^0-9]/g, ''))}" target="_blank" style="color:var(--admin-success);font-weight:600">${esc(b.customer_phone)}</a></small>
                  ${b.customer_email ? `<br><small style="color:var(--admin-text-muted)">${esc(b.customer_email)}</small>` : ''}
                </td>
                <td>
                  <strong>${esc(b.participants)} Seat${b.participants > 1 ? 's' : ''}</strong>
                  <br><span style="font-weight:700;color:${b.payment_status === 'PAID' ? 'var(--admin-success)' : 'inherit'}">&#8377;${Number(b.total_amount).toLocaleString('en-IN')}</span>
                </td>
                <td>
                  <small style="display:block;color:var(--admin-text-muted)">Method: <code>${esc(b.payment_method || 'razorpay')}</code></small>
                  ${b.razorpay_payment_id ? `<code style="font-size:0.75rem;color:var(--admin-success)">${esc(b.razorpay_payment_id)}</code>` : `<code style="font-size:0.75rem;color:var(--admin-text-muted)">${esc(b.razorpay_order_id || '—')}</code>`}
                </td>
                <td>
                  <span class="table-badge ${b.payment_status === 'PAID' ? 'active' : (b.payment_status === 'PENDING' ? 'paused' : 'full')}">${esc(b.payment_status)}</span>
                </td>
                <td>
                  <div class="table-actions">
                    <button class="btn-admin-outline btn-admin-sm" onclick="openBookingDetailsModal(${b.id})">Details</button>
                    ${b.payment_status !== 'PAID' ? `
                      <button class="btn-admin-success btn-admin-sm" onclick="handleUpdateBookingStatus(${b.id}, 'PAID')">Mark Paid</button>
                    ` : `
                      <button class="btn-admin-danger btn-admin-sm" onclick="handleUpdateBookingStatus(${b.id}, 'CANCELLED')">Cancel</button>
                    `}
                  </div>
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="7" style="text-align:center;padding:3rem 1rem;color:var(--admin-text-muted)">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 0.75rem;color:var(--admin-text-muted);display:block"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  <strong>No bookings found matching your criteria.</strong>
                  <p style="font-size:0.85rem;margin-top:0.35rem">Try testing a booking on the public website with Razorpay Test Mode.</p>
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    content.innerHTML = '<p style="color:red">Failed to load bookings: ' + esc(err.message) + '</p>';
  }
}

function applyBookingsFilter() {
  const search = document.getElementById('bookingSearchInput')?.value.trim() || '';
  const status = document.getElementById('bookingStatusSelect')?.value || 'all';
  renderBookingsTab(status, search);
}

async function handleUpdateBookingStatus(id, newStatus) {
  if (confirm(`Change status of booking #${id} to ${newStatus}?`)) {
    try {
      await adminApi(`/api/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: newStatus })
      });
      showToast(`Booking marked as ${newStatus}`);
      renderBookingsTab();
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  }
}

async function openBookingDetailsModal(id) {
  try {
    const bookings = await adminApi('/api/admin/bookings');
    const b = bookings.find(item => item.id === id);
    if (!b) return alert('Booking record not found');

    const modal = document.getElementById('adminModal');
    const body = document.getElementById('adminModalBody');

    body.innerHTML = `
      <div style="margin-bottom:1.5rem">
        <span class="table-badge ${b.payment_status === 'PAID' ? 'active' : 'paused'}">${esc(b.payment_status)}</span>
        <h2 style="font-family:var(--font-heading);font-size:1.5rem;font-weight:800;margin-top:0.4rem">Booking Voucher &bull; ${esc(b.booking_code)}</h2>
        <small style="color:var(--admin-text-muted)">Created on ${new Date(b.created_at).toLocaleString('en-IN')}</small>
      </div>

      <div style="background:#f8fafc;border:1px solid var(--admin-border);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
          <div><small style="color:var(--admin-text-muted);display:block">Trail Name</small><strong>${esc(b.trek_name)}</strong></div>
          <div><small style="color:var(--admin-text-muted);display:block">Batch Date</small><strong>${esc(b.batch_date)}</strong></div>
          <div><small style="color:var(--admin-text-muted);display:block">Customer Name</small><strong>${esc(b.customer_name)}</strong></div>
          <div><small style="color:var(--admin-text-muted);display:block">Customer Phone</small><strong><a href="tel:${esc(b.customer_phone)}">${esc(b.customer_phone)}</a></strong></div>
          <div><small style="color:var(--admin-text-muted);display:block">Customer Email</small><strong>${esc(b.customer_email || '—')}</strong></div>
          <div><small style="color:var(--admin-text-muted);display:block">Pickup Point</small><strong>${esc(b.pickup_location || 'Dadar / Base Village')}</strong></div>
          <div><small style="color:var(--admin-text-muted);display:block">Seats Booked</small><strong>${esc(b.participants)} Person(s)</strong></div>
          <div><small style="color:var(--admin-text-muted);display:block">Total Amount</small><strong style="font-size:1.1rem;color:var(--admin-success)">&#8377;${Number(b.total_amount).toLocaleString('en-IN')}</strong></div>
        </div>

        <div style="border-top:1px dashed var(--admin-border);padding-top:1rem;font-size:0.85rem">
          <div><small style="color:var(--admin-text-muted)">Razorpay Order ID:</small> <code>${esc(b.razorpay_order_id || '—')}</code></div>
          <div><small style="color:var(--admin-text-muted)">Razorpay Payment ID:</small> <code>${esc(b.razorpay_payment_id || '—')}</code></div>
          <div><small style="color:var(--admin-text-muted)">Signature Token:</small> <code style="font-size:0.75rem;word-break:break-all">${esc(b.razorpay_signature || '—')}</code></div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
        <div style="display:flex;gap:0.5rem">
          <button class="btn-admin-success btn-admin-sm" onclick="handleUpdateBookingStatus(${b.id}, 'PAID');closeAdminModal();">Mark PAID</button>
          <button class="btn-admin-danger btn-admin-sm" onclick="handleUpdateBookingStatus(${b.id}, 'CANCELLED');closeAdminModal();">Mark CANCELLED</button>
        </div>
        <button class="btn-admin-outline" onclick="closeAdminModal()">Close</button>
      </div>
    `;

    modal.classList.add('open');
  } catch (err) {
    alert('Failed to load booking details: ' + err.message);
  }
}

/* Settings Tab */
async function renderSettingsTab() {
  const content = document.getElementById('adminContent');
  content.innerHTML = '<p>Loading settings...</p>';
  try {
    const s = await adminApi('/api/admin/settings');
    content.innerHTML = `
      <!-- THEME & BACKGROUND APPEARANCE SETTINGS -->
      <div class="admin-panel" style="max-width:800px;margin-bottom:2rem">
        <div class="admin-panel-head">
          <div>
            <h3>🎨 Website Theme &amp; Background Appearance</h3>
            <small style="color:var(--admin-text-muted)">Customize your website's background color, upload a background photo, and control its visibility.</small>
          </div>
        </div>

        <form onsubmit="handleSaveBgSettings(event)">
          <div class="admin-form-group">
            <label>1. Background Color</label>
            <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
              <input type="color" id="siteBgColorPicker" value="${esc(s.site_bg_color || '#ffffff')}" style="width:48px;height:44px;padding:2px;border-radius:8px;cursor:pointer;border:1.5px solid var(--admin-border);background:transparent" oninput="syncBgColorPicker(this.value)">
              <input type="text" id="siteBgColorText" name="site_bg_color" value="${esc(s.site_bg_color || '#ffffff')}" placeholder="#ffffff" style="max-width:140px;font-family:monospace;font-weight:700" oninput="syncBgColorText(this.value)">
              <div style="display:flex;gap:0.4rem;align-items:center">
                <span style="font-size:0.8rem;color:var(--admin-text-muted)">Presets:</span>
                <button type="button" onclick="setPresetColor('#ffffff')" title="Pure White" style="background:#ffffff;border:1.5px solid #cbd5e1;width:28px;height:28px;border-radius:6px;cursor:pointer"></button>
                <button type="button" onclick="setPresetColor('#f8fafc')" title="Soft Pearl" style="background:#f8fafc;border:1.5px solid #cbd5e1;width:28px;height:28px;border-radius:6px;cursor:pointer"></button>
                <button type="button" onclick="setPresetColor('#fffbeb')" title="Warm Cream" style="background:#fffbeb;border:1.5px solid #cbd5e1;width:28px;height:28px;border-radius:6px;cursor:pointer"></button>
                <button type="button" onclick="setPresetColor('#f1f5f9')" title="Cool Mist" style="background:#f1f5f9;border:1.5px solid #cbd5e1;width:28px;height:28px;border-radius:6px;cursor:pointer"></button>
                <button type="button" onclick="setPresetColor('#0f172a')" title="Dark Mode" style="background:#0f172a;border:1.5px solid #cbd5e1;width:28px;height:28px;border-radius:6px;cursor:pointer"></button>
              </div>
            </div>
            <small>Default is pure clean white (<code>#ffffff</code>). You can pick any custom color.</small>
          </div>

          <div class="admin-form-group">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <label>2. Background Image Visibility / Opacity: <strong id="bgOpacityVal" style="color:var(--admin-accent)">${esc(s.site_bg_opacity || '15')}%</strong></label>
            </div>
            <input type="range" name="site_bg_opacity" id="siteBgOpacityRange" min="0" max="100" value="${esc(s.site_bg_opacity || '15')}" style="width:100%;cursor:pointer" oninput="document.getElementById('bgOpacityVal').textContent = this.value + '%'">
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--admin-text-muted);margin-top:0.25rem">
              <span>0% (Hidden / Solid Color)</span>
              <span>15% - 25% (Recommended for subtle texture)</span>
              <span>50%</span>
              <span>100% (Full photo)</span>
            </div>
            <small>Decide how visible the background photo is across your public website.</small>
          </div>

          <div class="admin-form-group">
            <label>3. Background Image URL (Optional)</label>
            <input type="text" name="site_bg_image" id="siteBgImageUrl" value="${esc(s.site_bg_image || '')}" placeholder="https://images.unsplash.com/... or /uploads/...">
            <small>Enter a direct image URL, or upload a photo file below.</small>
          </div>

          <button type="submit" class="btn-admin-primary" style="margin-top:0.5rem">Save Color &amp; Visibility Settings</button>
        </form>

        <hr style="margin:2rem 0;border:none;border-top:1px solid var(--admin-border)">

        <h4 style="font-family:var(--font-heading);font-size:1.05rem;margin-bottom:0.4rem">Upload Background Photo File</h4>
        <p style="font-size:0.85rem;color:var(--admin-text-muted);margin-bottom:1rem">Upload a wallpaper/photo from your computer (e.g. Sahyadri mountain ridge, mist, or nature texture).</p>
        <form onsubmit="handleUploadBgImage(event)" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
          <input type="file" name="bg_image" accept="image/*" required>
          <button type="submit" class="btn-admin-primary">Upload &amp; Apply Photo</button>
        </form>

        ${s.site_bg_image ? `
          <div style="margin-top:1.2rem;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;background:var(--admin-bg-subtle);padding:1rem 1.25rem;border-radius:8px;border:1px solid var(--admin-border)">
            <img src="${esc(s.site_bg_image)}" alt="Current Background Preview" style="width:140px;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--admin-border)">
            <div>
              <small style="display:block;color:var(--admin-text-muted)">Current Active Background Photo</small>
              <code style="font-size:0.82rem;color:var(--admin-accent)">${esc(s.site_bg_image)}</code>
              <div style="margin-top:0.6rem">
                <button type="button" class="btn-admin-danger" onclick="handleRemoveBgImage()" style="padding:0.45rem 0.9rem;font-size:0.82rem;border:none;border-radius:5px;cursor:pointer;display:inline-flex;align-items:center;gap:0.35rem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  <span>Remove Background Photo</span>
                </button>
              </div>
            </div>
          </div>` : `
          <div style="margin-top:1rem;padding:0.75rem 1rem;background:var(--admin-bg-subtle);border:1px dashed var(--admin-border);border-radius:8px;font-size:0.85rem;color:var(--admin-text-muted)">
            ℹ️ No background photo currently uploaded. Website is using clean solid background color.
          </div>
        `}
      </div>

      <div class="admin-panel" style="max-width:800px">
        <div class="admin-panel-head">
          <div>
            <h3>Razorpay Payment Gateway (Test Mode)</h3>
            <small style="color:var(--admin-text-muted)">Configure your Razorpay API Test Mode credentials for online UPI, Card, and NetBanking checkout.</small>
          </div>
          <span class="table-badge ${s.razorpay_enabled === 'false' ? 'paused' : 'active'}">${s.razorpay_enabled === 'false' ? 'DISABLED' : 'TEST MODE ACTIVE'}</span>
        </div>
        <form onsubmit="handleSaveSettings(event)">
          <div class="admin-form-group">
            <label>Razorpay Online Checkout</label>
            <select name="razorpay_enabled">
              <option value="true" ${s.razorpay_enabled !== 'false' ? 'selected' : ''}>Enabled (Accept Online Payments)</option>
              <option value="false" ${s.razorpay_enabled === 'false' ? 'selected' : ''}>Disabled (Manual UPI &amp; WhatsApp Only)</option>
            </select>
          </div>
          <div class="admin-form-group">
            <label>Razorpay Key ID (Test Mode Key)</label>
            <input type="text" name="razorpay_key_id" value="${esc(s.razorpay_key_id || 'rzp_test_5172839485')}" placeholder="rzp_test_..." required>
            <small>Found in your Razorpay Dashboard &rarr; Account &amp; Settings &rarr; API Keys (in Test Mode).</small>
          </div>
          <div class="admin-form-group">
            <label>Razorpay Key Secret (Test Mode Secret)</label>
            <input type="password" name="razorpay_key_secret" value="${esc(s.razorpay_key_secret || 'rzp_test_secret_demo')}" placeholder="Enter test key secret" required>
            <small>Secret key used for HMAC-SHA256 signature verification. Kept strictly private on server.</small>
          </div>
          <div class="admin-form-group">
            <label>Currency Code</label>
            <input type="text" name="razorpay_currency" value="${esc(s.razorpay_currency || 'INR')}" required>
          </div>
          <button type="submit" class="btn-admin-primary" style="margin-top:0.5rem">Save Razorpay Settings</button>
        </form>

        <hr style="margin:2.5rem 0;border:none;border-top:1px solid var(--admin-border)">

        <div class="admin-panel-head">
          <h3>Manual Booking &amp; Brand Settings</h3>
          <small style="color:var(--admin-text-muted)">Changes take effect immediately on public site.</small>
        </div>
        <form onsubmit="handleSaveSettings(event)">
          <div class="admin-form-group">
            <label>WhatsApp Number (without + or spaces)</label>
            <input type="text" name="whatsapp_number" value="${esc(s.whatsapp_number || '919137761400')}" required>
            <small>Used for WhatsApp booking links. Example: <code>919137761400</code></small>
          </div>
          <div class="admin-form-group">
            <label>UPI ID</label>
            <input type="text" name="upi_id" value="${esc(s.upi_id || 'pahadnamatrails@okaxis')}" required>
            <small>Displayed on payment section with 1-click copy.</small>
          </div>
          <div class="admin-form-group">
            <label>Google Form URL</label>
            <input type="url" name="google_form_url" value="${esc(s.google_form_url || '')}" placeholder="https://forms.gle/...">
          </div>
          <div class="admin-form-group">
            <label>Support Phone Display</label>
            <input type="text" name="contact_phone" value="${esc(s.contact_phone || '+91 91377 61400')}">
          </div>
          <div class="admin-form-group">
            <label>Support Email</label>
            <input type="email" name="contact_email" value="${esc(s.contact_email || 'pahadnamatrails@gmail.com')}">
          </div>
          <div class="admin-form-group">
            <label>Booking Instructions</label>
            <textarea name="booking_instructions" rows="4">${esc(s.booking_instructions || '')}</textarea>
          </div>
          <button type="submit" class="btn-admin-primary" style="margin-top:1rem">Save All Settings</button>
        </form>

        <hr style="margin:2.5rem 0;border:none;border-top:1px solid var(--admin-border)">

        <h4 style="font-family:var(--font-heading);font-size:1.1rem;margin-bottom:0.5rem">Update Website Brand Logo</h4>
        <p style="font-size:0.85rem;color:var(--admin-text-muted);margin-bottom:1rem">Upload your official brand logo. It will immediately update across the navbar, footer, admin panel, and mobile navigation.</p>
        <form onsubmit="handleUploadLogo(event)" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
          <input type="file" name="logo_image" accept="image/*" required>
          <button type="submit" class="btn-admin-primary">Upload &amp; Apply Logo</button>
        </form>
        ${s.brand_logo ? `
          <div style="margin-top:1rem;display:flex;align-items:center;gap:1.2rem">
            <img src="${esc(s.brand_logo)}?t=${Date.now()}" alt="Current Brand Logo" style="width:72px;height:72px;border-radius:12px;border:1.5px solid var(--admin-border);padding:2px;background:#1e2c22;object-fit:cover">
            <div>
              <small style="display:block;color:var(--admin-text-muted)">Current Active Brand Logo</small>
              <code style="font-size:0.82rem;color:var(--admin-accent)">${esc(s.brand_logo)}</code>
            </div>
          </div>` : ''}

        <hr style="margin:2.5rem 0;border:none;border-top:1px solid var(--admin-border)">

        <h4 style="font-family:var(--font-heading);font-size:1.1rem;margin-bottom:0.5rem">Update Payment QR Code</h4>
        <p style="font-size:0.85rem;color:var(--admin-text-muted);margin-bottom:1rem">Upload your actual PhonePe / Google Pay / Paytm merchant QR code image.</p>
        <form onsubmit="handleUploadQr(event)" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
          <input type="file" name="qr_image" accept="image/*" required>
          <button type="submit" class="btn-admin-primary">Upload QR Code</button>
        </form>
        ${s.payment_qr ? `
          <div style="margin-top:1.2rem;display:flex;align-items:flex-start;gap:1.5rem;flex-wrap:wrap">
            <div>
              <small style="display:block;color:var(--admin-text-muted);margin-bottom:0.4rem">Current Active QR Code:</small>
              <img src="${esc(s.payment_qr)}" style="width:160px;border-radius:8px;border:1px solid var(--admin-border);padding:4px;background:#fff">
            </div>
            <div style="padding-top:1.5rem">
              <button type="button" class="btn-admin-danger" onclick="handleRemoveQr()" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.55rem 1rem;font-size:0.85rem;border-radius:6px;cursor:pointer;border:none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>Remove QR Code</span>
              </button>
              <p style="font-size:0.8rem;color:var(--admin-text-muted);margin-top:0.4rem">Removes the current QR code from website &amp; settings.</p>
            </div>
          </div>` : `
          <div style="margin-top:1rem;padding:0.75rem 1rem;background:#f8fafc;border:1px dashed var(--admin-border);border-radius:8px;font-size:0.85rem;color:var(--admin-text-muted)">
            ℹ️ No payment QR code currently uploaded.
          </div>
        `}
      </div>`;
  } catch (err) {
    content.innerHTML = '<p style="color:red">Failed: ' + esc(err.message) + '</p>';
  }
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());
  try {
    await adminApi('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    showToast('Settings saved!');
    renderSettingsTab();
  } catch (err) { alert('Failed: ' + err.message); }
}

function syncBgColorPicker(val) {
  const textInput = document.getElementById('siteBgColorText');
  if (textInput) textInput.value = val;
}

function syncBgColorText(val) {
  const picker = document.getElementById('siteBgColorPicker');
  if (picker && /^#[0-9A-Fa-f]{6}$/.test(val)) {
    picker.value = val;
  }
}

function setPresetColor(hex) {
  const picker = document.getElementById('siteBgColorPicker');
  const text = document.getElementById('siteBgColorText');
  if (picker) picker.value = hex;
  if (text) text.value = hex;
}

async function handleSaveBgSettings(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());
  try {
    await adminApi('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    showToast('Theme & background appearance saved successfully!');
    renderSettingsTab();
  } catch (err) { alert('Failed to save theme settings: ' + err.message); }
}

async function handleUploadBgImage(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  try {
    const res = await fetch('/api/admin/settings/background', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    showToast('Background photo uploaded and applied!');
    renderSettingsTab();
  } catch (err) { alert('Background photo upload failed: ' + err.message); }
}

async function handleRemoveBgImage() {
  if (!confirm('Are you sure you want to remove the background photo?')) return;
  try {
    const res = await fetch('/api/admin/settings/background', {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove');
    showToast('Background photo removed. Reverted to clean background color.');
    renderSettingsTab();
  } catch (err) { alert('Failed to remove background photo: ' + err.message); }
}

async function handleUploadLogo(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  try {
    const res = await fetch('/api/admin/settings/logo', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    showToast('Brand logo updated successfully across the entire site!');
    // Update logo in admin topbar / sidebar immediately
    const newLogo = (data.logo_url || '/brand/pahadnama-logo.png') + '?t=' + Date.now();
    document.querySelectorAll('.admin-nav-logo, .login-logo').forEach(img => img.src = newLogo);
    renderSettingsTab();
  } catch (err) { alert('Logo upload failed: ' + err.message); }
}

async function handleUploadQr(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  try {
    const res = await fetch('/api/admin/settings/qr', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    showToast('Payment QR code updated!');
    renderSettingsTab();
  } catch (err) { alert('QR upload failed: ' + err.message); }
}

async function handleRemoveQr() {
  if (!confirm('Are you sure you want to remove the payment QR code?')) return;
  try {
    const res = await fetch('/api/admin/settings/qr', {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove QR code');
    showToast('Payment QR code removed successfully!');
    renderSettingsTab();
  } catch (err) {
    alert('Failed to remove QR code: ' + err.message);
  }
}

/* Security Tab */
function renderSecurityTab() {
  const content = document.getElementById('adminContent');
  content.innerHTML = `
    <div class="admin-panel" style="max-width:550px">
      <div class="admin-panel-head"><h3>Change Admin Password</h3></div>
      <p style="font-size:0.88rem;color:var(--admin-text-muted);margin-bottom:1.5rem">Keep your password secure. No SMS OTP needed.</p>
      <form onsubmit="handleChangePassword(event)">
        <div class="admin-form-group">
          <label>New Password (min 6 characters) *</label>
          <input type="password" name="new_password" required minlength="6" placeholder="Enter new password">
        </div>
        <button type="submit" class="btn-admin-primary" style="margin-top:0.5rem">Update Password</button>
      </form>
    </div>`;
}

async function handleChangePassword(e) {
  e.preventDefault();
  const form = e.target;
  const new_password = form.new_password.value;
  try {
    await adminApi('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_password })
    });
    showToast('Admin password updated successfully!');
    form.reset();
  } catch (err) { alert('Failed: ' + err.message); }
}

function closeAdminModal() { document.getElementById('adminModal').classList.remove('open'); }
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeAdminModal(); });
document.addEventListener('DOMContentLoaded', checkAuth);
