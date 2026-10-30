# 🍲 BHUKKAD VERSE — "YOUR CRAVINGS. YOUR UNIVERSE."

> **An Egalitarian, Hyperlocal Food Marketplace** bridging verified street food carts, artisanal cloud kitchens, and luxury fine-dining dining rooms with zero bill shock, cinematic video reels, and 4-way fair economics.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Django 5](https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.15-red?style=for-the-badge)](https://www.django-rest-framework.org/)
[![Database](https://img.shields.io/badge/Database-SQLite%20%2F%20PostgreSQL-4169E1?style=for-the-badge&logo=sqlite)](docker-compose.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Backend CI](https://img.shields.io/badge/Backend_CI-Passing-darkgreen?style=for-the-badge&logo=githubactions&logoColor=white)](.github/workflows/backend-ci.yml)
[![Frontend CI](https://img.shields.io/badge/Frontend_CI-Passing-blue?style=for-the-badge&logo=githubactions&logoColor=white)](.github/workflows/frontend-ci.yml)

---

## 🌟 The Core Disruption & 4 Pillars

Traditional aggregators charge kitchens **25%–35% commissions** and hit consumers with multi-layered fees. **Bhukkad Verse** eliminates both:

1. **Zero Bill Shock & Transparent Pricing:**
   - **100% Free Delivery** on all orders above ₹99 (saves ₹25+ per order).
   - Flat **₹5.00** platform convenience fee.
   - Transparent **5% food GST** with zero arbitrary surge pricing or hidden markups.
2. **Fair 4-Way Real-World Economics:**
   - **Vendors:** Retain **90% net sales** via direct bank payouts.
   - **Riders:** Guaranteed **₹30–₹35** earnings per completed delivery.
   - **Customers:** Zero surge, authentic chef-direct food pricing.
   - **Platform:** Sustainable **10%** commission pool.
3. **Theatrical Cinematic User Experience:**
   - Hardware-accelerated velvet entrance rolling shutter curtain.
   - 10-second looping kitchen video reels with countdown progress bars.
   - Continuous dynamic dish marquee with round-robin cross-vendor interleaving.
4. **Three Curated Culinary Tiers:**
   - 🍢 **Iconic Street Food & Legendary Carts** (Affordable, hygienic, nostalgic).
   - 👑 **Luxury Fine Dining & Heritage Palaces** (Slow-dum biryanis, royal truffle recipes).
   - 🍳 **Fresh Neighborhood Cloud Kitchens** (Daily comfort meals, whole spices, sanitized).

---

## 🚀 Quick Start Guide: How to Run the Project

### Prerequisites
- **Python:** `3.10+` or `3.11+`
- **Node.js:** `20.x+` (LTS recommended)
- **Git**

---

### Method 1: Single-Command Full-Stack Runner (Fastest & Recommended)

Launches the Django 5 REST Backend and Next.js 16 Frontend simultaneously, automatically initializes the virtualenv, runs migrations, seeds initial data, and opens your browser.

#### Windows PowerShell:
```powershell
.\run_dev.ps1
```

#### Windows Double-Click / CMD:
```cmd
run_dev.bat
```
*(Or simply double-click `run_dev.bat` from Windows File Explorer).*

> Press `Ctrl + C` in the terminal to gracefully stop both servers.

---

### Method 2: Two-Terminal Manual Workflow

If you prefer running services in separate dedicated terminal windows:

#### Terminal 1: Backend Setup & API Server (Django 5 DRF)
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create Python virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
.\venv\Scripts\activate.bat
# macOS / Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run database migrations to create db.sqlite3
python manage.py migrate

# 6. Seed turnkey master data (Accounts, Kitchens, Dishes & Reels)
python seed_initial_data.py
python seed_phase4_menu.py

# 7. Start backend development server (Port 8000)
python manage.py runserver 0.0.0.0:8000
```
> Backend API will be live at: `http://localhost:8000/api/`

---

#### Terminal 2: Frontend Setup & Web Client (Next.js 16 + React 19)
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install npm packages
npm install

# 3. Start Next.js development server with Turbopack (Port 3000)
npm run dev
```
> Frontend storefront will be live at: `http://localhost:3000`

---

### Method 3: Containerized Infrastructure (Docker Compose)

Spin up PostgreSQL 16 and Redis services:
```bash
docker compose up -d
```
To shut down containers:
```bash
docker compose down
```

---

## 🔐 Pre-Seeded Test Accounts

The seeder scripts (`seed_initial_data.py` & `seed_phase4_menu.py`) provide pre-configured roles for instant evaluation:

| Role | Email / Login | Password | Capabilities & Access |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@bhukkadverse.local` | `admin123` | Full access to `/admin` CMS, curtain/hero settings, video approvals, vendor audits, dispute desk. |
| **Vendor Partner** | `vendor@bhukkadverse.local` | `vendor123` | Dashboard access for *Live Tandoor & Grill* (menu builder, size variants, add-ons, reels upload). |
| **Vendor Partner (Chandu)** | `vendor2@bhukkadverse.local` | `vendor123` | Dashboard access for *Chandu Halwai & Street Chaat* (street food, sweets). |
| **Customer User** | `customer@bhukkadverse.local` | `customer123` | Customer discovery, saved delivery addresses, cart, checkout, order tracking. |

---

## 🌐 Platform Portals & Endpoints

| Portal | URL | Description |
| :--- | :--- | :--- |
| **Customer Storefront** | [http://localhost:3000](http://localhost:3000) | Full discovery, entrance curtain, video reels, dynamic cart & checkout. |
| **Vendor Management Desk** | [http://localhost:3000/vendor/dashboard](http://localhost:3000/vendor/dashboard) | Menu editor, variant creator, operating hours, order manager, reel uploader. |
| **Super Admin CMS** | [http://localhost:3000/admin](http://localhost:3000/admin) | Financial oversight, shop approvals, dispute resolution, video moderation. |
| **Backend REST API** | [http://localhost:8000/api/](http://localhost:8000/api/) | Django REST Framework root API. |
| **API Health Check** | [http://localhost:8000/api/health/](http://localhost:8000/api/health/) | Real-time database and service status. |
| **Django Admin** | [http://localhost:8000/admin](http://localhost:8000/admin) | Django native database administration desk. |

---

## 📁 Repository Organization

```text
Bhukkad-Verse/
├── backend/                       # Python Django 5 & Django REST Framework service
│   ├── apps/
│   │   ├── authentication/        # Custom User (CUSTOMER, VENDOR, ADMIN, RIDER) + SimpleJWT
│   │   ├── core/                  # Settings CMS, Video reels, Platform reviews, Coupons
│   │   ├── shops/                 # Kitchen shops, 3 Tiers, Operating hours, Geolocation
│   │   ├── products/              # Categories, Dishes, Size variants, Addon groups
│   │   ├── orders/                # Cart calculation, 4-Way split checkout, Order state machine
│   │   └── customers/             # Saved delivery addresses, Support tickets
│   ├── bhukkadverse/              # Django settings, WSGI, ASGI, root URLs
│   ├── seed_initial_data.py       # Master seed script
│   ├── seed_phase4_menu.py        # Menu variant & addon group seed script
│   └── requirements.txt           # Backend dependencies
├── frontend/                      # Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4
│   ├── src/
│   │   ├── app/                   # App Router pages (/shops, /cart, /orders, /vendor, /admin)
│   │   ├── components/            # Modular UI (home, brand, location, layout, auth, search)
│   │   ├── context/               # AuthContext, CartContext, LocationContext
│   │   ├── lib/                   # Typed API client (api.ts) & design tokens
│   │   └── types/                 # TypeScript interfaces
│   └── package.json               # Frontend dependencies & scripts
├── docs/                          # Comprehensive architecture blueprints & audits
│   ├── FOODHUB_ARCHITECTURE_PLAN.md
│   ├── PRODUCTION_READINESS_AUDIT.md
│   ├── PROJECT_REPORT.md
│   └── README.md
├── .planning/                     # GSD planning state, roadmap, and codebase intelligence
├── .github/                       # CI/CD workflows, release automation & issue templates
├── run_dev.ps1                    # Unified PowerShell development orchestrator
├── run_dev.bat                    # Unified Windows batch launcher
├── docker-compose.yml             # PostgreSQL 16 & Redis infrastructure
├── AGENTS.md                      # Universal AI Agent Instruction Manual
├── CLAUDE.md                      # Claude Code repository directives
├── GEMINI.md                      # Gemini & Antigravity Agent configuration
└── README.md                      # This file
```

---

## 🧪 Verification & Automated Tests

### Backend Test Suite (96 Tests)
```bash
cd backend
python manage.py test apps --verbosity=2
```

### Frontend Build & Lint Verification
```bash
cd frontend
npm run lint
npm run build
```

---

## 🤝 Contributing & Community

We welcome contributions from developers, designers, and foodies!
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: Onboarding guide, branch conventions, and PR workflow.
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)**: Community standards and conduct expectations.
- **[SECURITY.md](SECURITY.md)**: Responsible disclosure guidelines.
- **[AGENTS.md](AGENTS.md)**: AI agent personas and multi-tenant security directives.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
