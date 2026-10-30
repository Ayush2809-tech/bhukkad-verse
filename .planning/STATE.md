# STATE.md — Current Project Memory & Execution State
> **Project:** Bhukkad Verse ("Your Cravings. Your Universe.")  
> **Last Updated:** October 2026  
> **Active Milestone:** Core Hyperlocal Commerce & Mobile Scaling Plan

---

## 🎯 Current Status & Focus

- **Active Phase:** Phase 5 — Customer Saved Addresses & Haversine Distance Serviceability.
- **Immediate Goal:** Finalize customer address management (`CustomerAddress`), wire up provider-agnostic Leaflet/Google location picker, and ensure public shop discovery strictly respects server-side `shop.delivery_radius_km`.
- **Next Transition:** Advance to Phase 6 (Single-Vendor Cart & 4-Way Checkout Validation).

---

## 🧭 System Overview & Health

| Dimension | Status | Notes |
| :--- | :--- | :--- |
| **Backend API** | `HEALTHY` | 27 passing automated tests covering auth, shops, and product catalog isolation. |
| **Frontend Web** | `HEALTHY` | Next.js 16 build passing with 10 static/PPR routes. ESLint passing. |
| **Database** | `DEV / SQLITE` | Running SQLite for zero-setup local development; PostgreSQL 16 ready via Docker Compose. |
| **API Contract** | `MANUAL TYPES` | TypeScript types in `frontend/src/types/` are manually maintained. Scheduled for `drf-spectacular` automation in Phase 8. |
| **Mobile Apps** | `ARCHITECTED` | Comprehensive scaling plan created recommending React Native with Expo SDK 52. |

---

## 💡 Decisions Log

- **[DEC-001] Retain Django 5 DRF Backend:** Ayush's comprehensive models, permissions, and business logic will be preserved as the single source of truth. TypeScript types will be auto-generated rather than rewriting the backend in Node/NestJS.
- **[DEC-002] Monorepo Architecture for Pre-Launch:** Keep `frontend/`, `backend/`, and planned `mobile/` in a single monorepo to guarantee zero contract drift. A separate GitHub Organization can be spun out cleanly at scale.
- **[DEC-003] React Native with Expo for Mobile:** Expo SDK 52 with Expo Router selected for mobile apps to maximize code reuse (up to 60%) with the existing Next.js / TypeScript web codebase.
- **[DEC-004] Decimal Precision for All Monetary Values:** Mandated `DecimalField(max_digits=8, decimal_places=2)` across models and serializers to prevent IEEE 754 float precision errors.
- **[DEC-005] Provider-Agnostic Geospatial Architecture:** Leaflet/OpenStreetMap serves as the primary zero-cost local engine; Google Maps automatically activates when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is supplied.

---

## ⚠️ Known Blockers & Tech Debt Items

1. **Hardcoded Sample Dishes on Homepage:** `frontend/src/app/page.tsx` still contains hardcoded sample dishes (`SAMPLE_DISHES`) with dummy ratings (4.8, 4.9). Must be migrated to dynamic fetching from `/api/v1/shops/` or `/api/v1/products/`.
2. **Phase 4 Menu Seed Data:** `seed_phase4_menu.py` resides in the backend root. Should be refactored into a formal Django management command (`python manage.py seed_dev_data`).
3. **Missing Automated Mobile Test Harness:** Mobile testing pipeline will need to be configured once the Expo workspace is scaffolded.

---

## 📋 Next Recommended Actions

1. Complete backend migrations and API endpoints for `CustomerAddress` in `backend/apps/customers/`.
2. Implement backend Haversine filtering query on `ShopViewSet` (accepting `?lat=...&lng=...`).
3. Connect `LocationContext` on frontend to pass customer coordinates to the shop listing API.
4. Replace hardcoded `SAMPLE_DISHES` on homepage with dynamic database-backed products.

