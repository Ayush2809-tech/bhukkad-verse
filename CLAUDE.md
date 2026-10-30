# CLAUDE.md — Repository Directives for Claude Code
> **Project:** Bhukkad Verse ("Your Cravings. Your Universe.")  
> **Repository:** `d:\Coding\Projects\Bhukkad-Verse`  
> **Architecture:** Decoupled Client-Server (Next.js 16 + React 19 / Django 5 DRF) with planned React Native (Expo) multi-platform apps.

---

## ⚡ Primary Build & Test Commands

### Backend Commands (Django 5 & DRF)
```bash
# Activate virtual environment (Windows PowerShell)
cd backend
.\venv\Scripts\Activate.ps1
# On POSIX: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Run complete backend test suite
python manage.py test apps --verbosity=2

# Run single test module / class
python manage.py test apps.products.tests.ProductCatalogTests
python manage.py test apps.orders.tests.OrderEconomicsTests

# Run local development server
python manage.py runserver 0.0.0.0:8000

# Seed initial database
python seed_initial_data.py
```

### Frontend Commands (Next.js 16 App Router & Tailwind v4)
```bash
cd frontend

# Install packages
npm install

# Run development server with Turbopack
npm run dev

# Lint codebase (ESLint 9)
npm run lint

# Production build test (compiles static & PPR routes)
npm run build

# Start production server
npm run start
```

---

## 🛠️ Tech Stack & Key Libraries

| Area | Technologies |
| :--- | :--- |
| **Backend Framework** | Django 5.0+, Django REST Framework 3.15+, SimpleJWT 5.3+ |
| **Database** | SQLite (development/tests) / PostgreSQL 16 (production dockerized) |
| **Frontend Framework** | Next.js 16.4+, React 19.3+, TypeScript 5.0+, Tailwind CSS v4 |
| **Icons & Media** | Lucide React, HTML5 Video, Canvas |
| **Geospatial & Maps** | Leaflet / OpenStreetMap fallback, Google Maps JS API when configured |
| **State & Context** | React Context (`AuthContext`, `CartContext`, `LocationContext`) |
| **Planned Mobile** | React Native (Expo SDK 52) with Expo Router |

---

## 📐 Architecture & Coding Conventions

### 1. Backend Standards (Python / Django)
- **Formatting & Style:** PEP 8 compliance, explicit type hints where feasible, docstrings for non-trivial view methods and model properties.
- **Tenant Isolation:** Enforce row-level security on all vendor endpoints. Always filter querysets using `request.user.shop` or custom permission classes (`IsVendorOwner`, `IsShopApproved`). Never trust client-supplied `shop_id` in POST/PUT payloads when acting as a vendor.
- **Monetary Attributes:** All prices, fees, and discounts must be `DecimalField(max_digits=8, decimal_places=2)`. Never use `FloatField` or Python floats for financial arithmetic.
- **Fair Economics Model:**
  - Customer order total = Subtotal + Platform Fee (₹5.00) + GST (5%) - Discounts. Free delivery on orders > ₹99.
  - Vendor share = 90% of food subtotal.
  - Rider share = ₹30–₹35 per delivery.
  - Platform share = 10% commission + ₹5 platform fee - delivery subsidy.
- **Database Optimization:** Use `select_related()` for OneToOne/ForeignKey lookups and `prefetch_related()` for ManyToMany relationships (e.g., product size variants, addon groups, category listings).
- **Serviceability:** Authoritative delivery distance checks are computed on the backend using the Haversine formula against `shop.delivery_radius_km`.

### 2. Frontend Standards (Next.js 16 / TypeScript / React 19)
- **App Router Structure:**
  - Route handlers live in `src/app/` (`/shops`, `/cart`, `/orders`, `/vendor/dashboard`, `/admin`).
  - Reusable UI elements live in `src/components/` grouped by domain (`home`, `layout`, `location`, `brand`, `auth`, `search`).
  - Global state providers live in `src/context/`.
- **Browser-Only APIs:** Components utilizing browser globals (`window`, `navigator`, `localStorage`, `document`, Leaflet maps) must include the `'use client';` directive. Third-party libraries touching DOM APIs must be imported dynamically with `ssr: false`.
- **Styling with Tailwind CSS v4:** Utilize Tailwind utility classes with the custom color system (`amber-500`, `orange-600`, `neutral-900`, `neutral-950`). Keep interactive elements accessible with visible focus rings.
- **Type Safety:** Define TypeScript interfaces in `src/types/` or co-locate with feature modules. Avoid `any`.

### 3. Git & Pull Request Guidelines
- Follow conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Ensure all tests pass (`python manage.py test` and `npm run build`) before submitting changes.
- Never commit secrets, `.env` files, or production database dumps.

