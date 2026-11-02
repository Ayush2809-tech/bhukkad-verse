# 🍔 BhukkadVerse — Project Overview & Architecture Guide
> **Tagline:** *"Your Cravings. Your Universe."*  
> **Official Contact:** `bhukkadverse.teams@gmail.com`  
> **Repository:** Hyperlocal Egalitarian Food-Tech Marketplace (Monorepo)

---

## ⚡ 1. Elevator Pitch (Explain in 30 Seconds)

**BhukkadVerse** is an egalitarian, hyperlocal food-tech marketplace built to challenge predatory food aggregators (like Swiggy and Zomato) that charge 25%–35% restaurant commissions and slap customers with hidden surge fees ("bill shock").

BhukkadVerse replaces this with **Fair 4-Way Economics**:
- **Kitchens retain 90%** of order revenue (flat 10% platform fee with automated T+1 direct bank payouts).
- **Customers get 100% Free Delivery** on all orders above ₹99, a flat ₹5 platform fee, and transparent 5% GST with zero surge pricing.
- **Riders earn a guaranteed ₹30–₹35** delivery wage per order with anti-theft ₹1,500 cash-on-delivery (COD) virtual float protection.
- **Cinematic Culinary Storytelling:** 10-second looping kitchen video reels, round-robin cravings carousel, and entrance shutter.

---

## 🍢 2. The 3 Curated Culinary Tiers

Rather than dumping random restaurants together, BhukkadVerse curates eating experiences into 3 distinct tiers:
1. **🍢 Iconic Street Food & Legendary Carts (`STREET_FOOD`):** Pocket-friendly, nostalgic, hygienic desi chaats, golgappas, and kebabs.
2. **👑 Luxury Fine Dining & Heritage Palaces (`HERITAGE_LUXURY`):** Slow-dum Awadhi handi biryanis, royal truffle recipes, and heirloom family dining.
3. **🍳 Fresh Neighborhood Cloud Kitchens (`CLOUD_KITCHEN`):** Daily comforting home-style thalis, whole spices, and sanitized meal combos.

---

## 💻 3. Complete Tech Stack & Purpose of Each Layer

```
                        ┌──────────────────────────────────────────────┐
                        │              BHUKKADVERSE MONOREPO           │
                        └──────────────────────┬───────────────────────┘
                                               │
             ┌─────────────────────────────────┼─────────────────────────────────┐
             │                                 │                                 │
             ▼                                 ▼                                 ▼
   ┌───────────────────┐             ┌───────────────────┐             ┌───────────────────┐
   │   BACKEND API     │             │   FRONTEND WEB    │             │   MOBILE SUITE    │
   │  Django 5.0 + DRF │             │   Next.js 16 + PWA│             │  React Native Expo│
   └───────────────────┘             └───────────────────┘             └───────────────────┘
```

| Layer | Technologies Used | Primary Purpose |
| :--- | :--- | :--- |
| **Backend Core & API** | **Python 3.11+, Django 5.0, Django REST Framework (DRF)** | Single source of truth. Handles business logic, monetary calculations with `Decimal` precision, authentication, menu hierarchies, and database queries. |
| **Authentication & RBAC** | **SimpleJWT (Stateless JWTs)** | Multi-role user access control (`CUSTOMER`, `VENDOR`, `ADMIN`, `RIDER`) with token refresh lifecycle. |
| **Geospatial Proximity** | **Server-side Haversine Formula** | Authoritative distance calculation between user coordinates and kitchen locations; verifies serviceability against `shop.delivery_radius_km`. |
| **Database** | **SQLite (Dev) / PostgreSQL 16 (Prod)** | Relational storage for multi-tenant catalog, order status machine, cash ledgers, and addresses. |
| **Web Storefront & PWA** | **Next.js 16 (App Router), React 19, TypeScript** | High-performance, SEO-optimized web application with partial prerendering (PPR), server components, and 1-click installable Progressive Web App (PWA). |
| **Styling & Design Tokens** | **Tailwind CSS v4, Lucide Icons** | Hardware-accelerated transitions, responsive mobile-first UI, and cinematic dark/warm aesthetic. |
| **Mobile Application** | **React Native, Expo SDK 52, TypeScript** | Unified cross-platform app containing 3 role experiences: **Customer Storefront**, **Vendor Kitchen Hub**, and **Rider Fleet Telemetry**. |
| **Mobile Navigation & Hardware** | **React Navigation 7, Expo Location, Expo Haptics** | Smooth stack/tab transitions, live GPS coordinate telemetry streaming, and tactile haptic chime alerts for kitchen order arrivals. |
| **DevOps & Cloud CI/CD** | **GitHub Actions, EAS Build, Docker** | Automated test pipelines, lint checks, PR-Agent code reviews with Gemini Flash, and cloud compilation of standalone **Android `.apk`** packages. |

---

## 🎯 4. Key Architectural Features (What to Show in Demos)

### 🛒 A. Customer Experience (Storefront & Transparent Cart)
- **Zero Bill-Shock Cart:** Strict single-vendor constraint preventing kitchen cross-contamination. Transparent bill breakdown showing subtotal + flat ₹5 platform fee + 5% GST + free delivery indicator (> ₹99).
- **Provider-Agnostic Maps:** Supports Google Maps API when available; gracefully falls back to OpenStreetMap / Leaflet with zero runtime crashes.
- **Live Order Tracking:** 4-stage stepper tracking kitchen prep, assigned rider name/phone, and arrival ETA.

### 🍳 B. Vendor Kitchen Hub
- **Live Orders Queue:** Sound & tactile haptic alerts upon order arrival with real-time pending badges.
- **Order Lifecycle Transitions:** One-tap status updates (`CONFIRMED` -> `PREPARING` on tawa/dum -> `OUT_FOR_DELIVERY`).
- **Menu & Stock Controls:** Quick toggle for In Stock vs Sold Out dishes.
- **Transparent 90% Net Payouts:** Daily sales breakdown showing the 10% platform fee and automated T+1 bank transfer info.

### 🛵 C. Rider Fleet & COD Float Ledger
- **Anti-Theft COD Virtual Float Locking:** Live visual gauge tracking collected cash against the **₹1,500 maximum limit**. Prevents riders from taking new orders if float is locked until cash is deposited.
- **Guaranteed Wages:** ₹35 delivery wage credited per completed order.
- **UPI Cash Deposit:** Instant reconciliation form to submit UPI/Bank deposit reference numbers.
- **GPS Telemetry:** Live coordinate streaming (latitude, longitude, speed in km/h) to dispatch.

---

## 🚀 5. Quick Run Commands Cheat Sheet

### Option A: All-in-One Local Runner (Recommended)
You can launch both the Django Backend and Next.js Frontend with a single command from the project root:

```powershell
# Windows PowerShell
.\run_dev.ps1

# Windows Command Prompt / Batch
.\run_dev.bat
```

---

### Option B: Running Individual Services Manually

#### 1. Backend Server (Django REST Framework)
```powershell
cd backend

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# (Optional: If running for the first time)
# pip install -r requirements.txt
# python manage.py migrate
# python seed_initial_data.py

# Start Django server on port 8000
python manage.py runserver 127.0.0.1:8000
```
- **Backend API URL:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Health Check:** [http://127.0.0.1:8000/api/health/](http://127.0.0.1:8000/api/health/)
- **Django Admin:** [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

#### 2. Frontend Web Server & PWA (Next.js 16)
```powershell
cd frontend

# Install dependencies (first time only)
npm install

# Start Next.js development server on port 3000
npm run dev
```
- **Storefront Website:** [http://localhost:3000](http://localhost:3000)
- **App Download Hub:** [http://localhost:3000/download](http://localhost:3000/download)
- **PWA WebApp Manifest:** [http://localhost:3000/manifest.webmanifest](http://localhost:3000/manifest.webmanifest)

#### 3. Mobile App (React Native / Expo SDK 52)
```powershell
cd mobile

# Install dependencies (first time only)
npm install

# Start Expo Metro Bundler
npm start

# Target specific platform
npm run android   # Open on Android Emulator
npm run ios       # Open on iOS Simulator (macOS)
npm run web       # Open mobile web version
```
- Scan the terminal QR code with **Expo Go** on your physical Android or iPhone to run the app immediately!

---

### Option C: Automated Standalone Android APK Download
To download a compiled `.apk` file for physical Android installation:
1. Go to your GitHub repository -> **Actions** tab.
2. Select **"Build Downloadable Android APK"**.
3. Click **"Run workflow"**.
4. In ~3 minutes, download `BhukkadVerse-v1.0.apk` directly to your phone and install!

---

## 🧪 6. Testing & Quality Verification Commands

```powershell
# Run backend automated unit tests (101 tests across all apps)
cd backend
python manage.py test apps --verbosity=1

# Verify frontend Next.js TypeScript typecheck
cd frontend
.\node_modules\.bin\tsc.cmd --noEmit

# Verify mobile React Native TypeScript typecheck
cd mobile
.\node_modules\.bin\tsc.cmd --noEmit
```
