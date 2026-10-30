# STATE.md — Current Project Memory & Execution State
> **Project:** Bhukkad Verse ("Your Cravings. Your Universe.")  
> **Last Updated:** October 2026  
> **Active Milestone:** Production Readiness, Backend Automation & Local Orchestration

---

## 🎯 Current Status & Focus

- **Completed Phases:**
  - Phase 1: Project Foundation & Custom User Authentication
  - Phase 2: Vendor Onboarding & Verification Desk
  - Phase 3: Multi-Tenant Catalog, Variants & Add-ons
  - Phase 4: Cinematic Theatrical Storefront & Discovery
  - Phase 5: Customer Addresses & Haversine Geospatial Discovery
  - Phase 6: Single-Vendor Cart & 4-Way Fair Checkout Engine
  - Phase 7: Local Orchestrator & Full-Stack Hardening
  - Feature: Rider COD Virtual Float Limit, Double-Entry Cash Ledger & T+1 Vendor Settlements (`feat/rider-cod-cash-ledger`)
- **Active Phase:** PR Review & Merge of `feat/rider-cod-cash-ledger` -> Transition to Phase 8 (OpenAPI Type Generation) & Phase 9 (Expo SDK 52 Cross-Platform Mobile App).

---

## 🧭 System Overview & Health

| Dimension | Status | Notes |
| :--- | :--- | :--- |
| **Backend API** | `HEALTHY` | 96 passing automated tests covering auth, shops, products, orders, customers, and core CMS. |
| **Frontend Web** | `HEALTHY` | Next.js 16 build passing with 22 static/PPR routes (`npm run build` exits 0). |
| **Database** | `INITIALIZED` | SQLite database `backend/db.sqlite3` migrated and populated with turnkey master seed data. |
| **Orchestrator** | `OPERATIONAL` | Single-command launch scripts (`run_dev.ps1` and `run_dev.bat`) available at repository root. |
| **API URLs** | `UNIFIED` | All frontend routes use dynamic `API_BASE_URL` from `@/lib/api`. |

---

## 💡 Decisions Log

- **[DEC-001] Retain Django 5 DRF Backend:** Preserved as single source of truth; TypeScript types to be generated via OpenAPI.
- **[DEC-002] Monorepo Architecture Pre-Launch:** Pre-launch web, mobile, and backend reside in one monorepo to avoid API contract drift.
- **[DEC-003] React Native with Expo for Mobile:** Expo SDK 52 selected for code sharing (Zod, types, cart math).
- **[DEC-004] Decimal Precision for All Monetary Values:** Mandated `DecimalField(max_digits=8, decimal_places=2)`.
- **[DEC-005] Provider-Agnostic Geospatial Architecture:** Leaflet/Nominatim active by default; Google Maps loads when API key is provided.
- **[DEC-006] Supervised Background Orchestration:** `run_dev.ps1` manages both Django 5 and Next.js 16 under synchronized PowerShell background jobs with graceful Ctrl+C teardown.

---

## 📋 Next Recommended Actions

1. Run `.\run_dev.bat` or `.\run_dev.ps1` to view and interact with the live website locally.
2. Proceed to Phase 8 to configure `drf-spectacular` and automate TypeScript types generation.
