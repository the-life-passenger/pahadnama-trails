# 🏔️ Pahadnama Trails — Sahyadri Adventure Treks & CMS Platform

> *"Safar Jahan Manzil Se Zyada Khoobsurat Hai"*  
> Authentic, respectful, and organized Sahyadri trekking adventures in Maharashtra.

---

## 🌟 Features

- **🎒 Curated Trek Showcase:** Explore iconic Maharashtra forts, peaks, valleys, and waterfall trails (Harishchandragad, Rajgad, Devkund, Sandhan Valley, Harihar, Kalsubai, etc.).
- **💳 Multi-Mode Booking Engine:**
  - **Razorpay Test Mode:** Simulated checkout with zero transaction fees, dynamic price calculation, and instant verified voucher generation.
  - **WhatsApp Direct Booking:** 1-click coordinator booking with pre-filled trek and date details.
  - **Verified UPI ID Payment:** Clean UPI ID copy for direct payments.
- **🧾 Instant Booking Pass / Voucher:**
  - Verified payment badge with unique reference code (`PAHAD-XXXX`).
  - 1-click WhatsApp share button.
  - Print / Save as PDF voucher layout.
- **🔐 Admin Operations Console (`/admin`):**
  - **Credentials:** Username `the.life.passenger` | Password `vivektrails`
  - Real-time booking dashboard with status updates (`PAID`, `PENDING`, `CANCELLED`).
  - Razorpay Gateway API keys management.
  - Active payment QR code management (upload and 1-click removal).
  - Dynamic trek CRUD and batch management.
- **📱 Responsive & Fast:** Built with modern CSS grid, glassmorphic floating header, scrollspy, and mobile drawer. Zero external heavy UI frameworks.

---

## 🛠️ Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/) (v20+ or v22+)
- **Server:** Express.js (`server.js`)
- **Database:** Native SQLite via Node.js (`node:sqlite`)
- **Security:** Scrypt password hashing & HMAC-SHA256 signature verification
- **Frontend:** Vanilla HTML5, CSS3, ES6 JavaScript

---

## 🚀 Quick Start (Local Setup)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pahadnama-trails.git
   cd pahadnama-trails
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   Or on Windows, double-click `START-WEBSITE.bat`.

4. **Open in browser:**
   - **Public Website:** `http://localhost:3000`
   - **Admin Dashboard:** `http://localhost:3000/admin`

---

## ☁️ Free 1-Click Cloud Deployment (Render.com)

Because this website runs a Node.js backend with SQLite and Razorpay verification, deploy it to a free Node.js hosting platform like **Render.com**:

1. Create a free account on [Render.com](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository `pahadnama-trails`.
4. Configure the settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Click **Deploy Web Service**.
6. Render will generate your live public URL (e.g. `https://pahadnama-trails.onrender.com`).

---

## 📄 License
Private & Proprietary — Developed for Pahadnama Trails.
