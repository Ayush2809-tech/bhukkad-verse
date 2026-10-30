# GEMINI.md — Gemini & Antigravity Agent Configuration
> **Project:** Bhukkad Verse ("Your Cravings. Your Universe.")  
> **Repository:** `d:\Coding\Projects\Bhukkad-Verse`  
> **Environment:** Windows (PowerShell) / Cross-Platform  
> **AI System:** Antigravity / Gemini 3.8 / Google DeepMind Agentic Workflows

---

## 🧭 Project Blueprint & Purpose

**Bhukkad Verse** is a hyperlocal food marketplace engineered to challenge legacy food aggregators by replacing high restaurant commissions (charging a flat 10% vs. Swiggy/Zomato's 25–35%) and eliminating customer "bill shock" (100% free delivery over ₹99, ₹5 platform fee, transparent GST).

It merges **theatrical culinary storytelling** (entrance rolling shutter, 10s kitchen video reels, and continuous round-robin dish marquee) across three curated tiers:
1. 🍢 **Iconic Street Food Carts**
2. 👑 **Heritage Luxury Dining**
3. 🍳 **Fresh Cloud Kitchens**

---

## ⚙️ Core Architecture & Repository Layout

```text
Bhukkad-Verse/
├── backend/                  # Python 3.11+ / Django 5.0 / DRF / SimpleJWT
│   ├── apps/
│   │   ├── authentication/   # Custom user model with roles (CUSTOMER, VENDOR, ADMIN, RIDER)
│   │   ├── core/             # Global CMS settings, video reels, reviews, coupons
│   │   ├── shops/            # Kitchens, 3 tiers, operating hours, delivery radius
│   │   ├── products/         # Categories, dishes, variants, addon groups, dietary flags
│   │   ├── orders/           # Cart, checkout, 4-way economic split, order state machine
│   │   └── customers/        # Delivery addresses, support tickets
│   └── manage.py
├── frontend/                 # Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS v4
│   ├── src/app/              # Next.js App Router pages
│   ├── src/components/       # Modular UI components
│   ├── src/context/          # Auth, Cart, and Location context providers
│   └── src/types/            # Shared TypeScript types
├── docs/                     # Architectural plans, audits, and project reports
├── .planning/                # GSD execution framework, roadmap, requirements, and codebase map
└── docker-compose.yml        # PostgreSQL 16 & Redis infrastructure
```

---

## ⚡ Development & Testing Commands

### Backend Operations
```powershell
# From repository root
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Execute automated tests
python manage.py test apps --verbosity=2

# Start development server
python manage.py runserver 0.0.0.0:8000
```

### Frontend Operations
```powershell
# From repository root
cd frontend
npm install

# Start development server with Turbopack
npm run dev

# Run linting and production build check
npm run lint
npm run build
```

---

## 🛡️ Critical Guardrails for Gemini & Antigravity Agents

1. **Security & Multi-Tenant Scoping:**
   - Always ensure vendor API queries filter by `request.user.shop`. Never allow cross-shop data leaks.
   - Enforce Decimal precision (`DecimalField(max_digits=8, decimal_places=2)`) for all financial calculations.

2. **Server-Side Geospatial Authoritativeness:**
   - Distance checks and serviceability must be validated on the backend via the Haversine formula against `shop.delivery_radius_km`.
   - On the frontend, provide provider-agnostic maps (Google Maps if API key is set, OpenStreetMap / Leaflet as automatic fallback).

3. **No Fabricated Production Data:**
   - Do not commit hardcoded dummy restaurants, mock ratings, or fake products to production components. Dynamically load data from `/api/v1/` endpoints.

4. **Next.js 16 & React 19 Client/Server Boundaries:**
   - Use `'use client';` for components that use hooks, event handlers, or browser APIs (`window`, `localStorage`, `navigator`).
   - For Leaflet and canvas-heavy components, use dynamic imports with `ssr: false` to avoid SSR hydration mismatches.

5. **GSD Protocol Alignment:**
   - Coordinate changes with `.planning/ROADMAP.md` and `.planning/STATE.md`.
   - Keep commits granular and test-verified.

