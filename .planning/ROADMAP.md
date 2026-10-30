# ROADMAP.md — Phased Implementation Roadmap
> **Project:** Bhukkad Verse ("Your Cravings. Your Universe.")  
> **Lifecycle:** Evolution from Web MVP to Scaled Multi-Platform Hyperlocal Marketplace

---

## 🗺️ Phase Progression Matrix

```mermaid
gantt
    title Bhukkad Verse Engineering Roadmap
    dateFormat  YYYY-MM
    section Web Foundation
    Phase 1: Project Setup & Auth Core             :done, p1, 2026-08, 2026-08
    Phase 2: Vendor Shops & Onboarding             :done, p2, 2026-08, 2026-09
    Phase 3: Multi-Tenant Catalog & Menu Engine    :done, p3, 2026-09, 2026-09
    Phase 4: Cinematic UI & Storefront Discovery   :done, p4, 2026-09, 2026-10
    section Core Commerce & Full-Stack Hardening
    Phase 5: Customer Addresses & Haversine Engine :done, p5, 2026-10, 2026-10
    Phase 6: Single-Vendor Cart & 4-Way Checkout   :done, p6, 2026-10, 2026-10
    Phase 7: Local Orchestrator & Production Audit :done, p7, 2026-10, 2026-10
    section Multi-Platform Scaling
    Phase 8: OpenAPI Type Generation & SDKs        :active, p8, 2026-11, 2026-12
    Phase 9: Cross-Platform Mobile App (Expo SDK 52):p9, 2026-12, 2027-01
    Phase 10: Real-Time Telemetry & Rider WebSockets:p10, 2027-01, 2027-02
```

---

## 📦 Phase Details

### Phase 1: Project Foundation & Custom User Authentication
**Status:** `COMPLETED`  
- Monorepo structure with `backend/` (Django 5) and `frontend/` (Next.js 16).
- Custom `User` model with roles: `CUSTOMER`, `VENDOR`, `ADMIN`, `RIDER`.
- Stateless JWT authentication via `djangorestframework-simplejwt` with login, register, token refresh, and `/api/v1/auth/me/`.
- Frontend `AuthContext` with SSR hydration resilience.

### Phase 2: Vendor Onboarding & Verification Desk
**Status:** `COMPLETED`  
- `Shop` model with business details, 3 culinary tiers (`STREET_FOOD`, `HERITAGE_LUXURY`, `CLOUD_KITCHEN`), and operating hours.
- Vendor registration workflow with state transitions (`PENDING` -> `APPROVED` / `REJECTED` / `SUSPENDED`).
- Super Admin portal for vendor application audits and status toggles.
- Row-level permission checks guaranteeing vendors can only mutate their own shop profile.

### Phase 3: Multi-Tenant Catalog, Variants & Add-ons
**Status:** `COMPLETED`  
- Hierarchical menu schema: `Category` -> `Product` -> `ProductVariant` (Size options) -> `AddonGroup` -> `AddonOption`.
- Dietary flags (`is_vegetarian`), spice levels, and stock availability toggles.
- Automated tests verifying strict cross-tenant isolation and negative price prevention.

### Phase 4: Cinematic Theatrical Storefront & Discovery
**Status:** `COMPLETED`  
- Gesture-driven entrance rolling curtain with looping high-def culinary ambiance.
- 10-second kitchen video reels with countdown progress indicators.
- Continuous dynamic dish marquee with round-robin vendor interleaving.
- Public dynamic menu pages (`/shops/[slug]`) with category sub-navigation and live item customizer modals.

### Phase 5: Customer Addresses & Haversine Geospatial Discovery
**Status:** `COMPLETED`  
- `CustomerAddress` model (`address_line1`, `address_line2`, `city`, `postal_code`, `latitude`, `longitude`, `label`, `is_default`).
- Backend Haversine distance calculator filtering public shop listings against `shop.delivery_radius_km`.
- Frontend `LocationContext` with device geolocation, Nominatim reverse geocoding, and saved address backend sync.
- Provider-agnostic location picker: Google Maps JS API when configured; Leaflet/OpenStreetMap automatic fallback; manual address entry fallback.

### Phase 6: Single-Vendor Cart & 4-Way Fair Checkout Engine
**Status:** `COMPLETED`  
- Single-vendor cart enforcement with automatic dialog prompting when items from different kitchens are selected.
- Server-authoritative checkout validation recalculating dish prices, size variants, and addons from the database.
- Transparent fee calculation: Subtotal + ₹5.00 Platform Fee + 5% GST; Free delivery if subtotal > ₹99 (₹25 standard fee if <= ₹99).
- 4-way financial ledger split: 90% vendor share, ₹30–₹35 rider share, 10% platform margin.
- Dynamic coupon voucher validation and discount deduction.

### Phase 7: Local Orchestrator & Full-Stack Hardening
**Status:** `COMPLETED`  
- Fixed duplicate function declarations breaking Turbopack builds in `VendorDashboardPage`.
- Dynamic `API_BASE_URL` binding across all frontend route pages (`cart`, `orders`, `admin`, `vendor/dashboard`, `sitemap`).
- Windows-friendly UTF-8 stdout configuration for seeder scripts to prevent encoding crashes.
- Created single-command orchestrators (`run_dev.ps1` and `run_dev.bat`) for unified dual-service launching, auto-migration, and auto-seeding.
- Automated test suite verified: **96/96 tests passing**.

---

### Phase 8: OpenAPI Type Generation & Shared Client SDK
**Status:** `ACTIVE`  
- Configure `drf-spectacular` on Django DRF backend to expose `/api/schema/` and Swagger UI at `/api/docs/`.
- Configure `@hey-api/openapi-ts` to generate strict TypeScript interfaces directly into `frontend/src/types/api.ts`.
- Eliminate manual interface drift across web and future mobile clients.

### Phase 9: Cross-Platform Mobile Application (React Native / Expo)
**Status:** `PLANNED`  
- Scaffold `mobile/` using Expo SDK 52 with Expo Router (file-based routing matching Next.js App Router).
- Share core business logic, cart math, and Zod schemas between web and mobile via monorepo workspace.
- Customer App: Mobile reels feed, location-based kitchen discovery, native push notifications.
- Vendor App: Kitchen order chime audio notifications, quick item availability toggle.
- Rider App: Real-time background GPS streaming daemon.

### Phase 10: Real-Time WebSockets & Live Rider Telemetry
**Status:** `PLANNED`  
- Deploy Redis and Django Channels (ASGI) for real-time WebSocket communication (`ws/orders/<order_id>/tracking/`).
- Rider mobile background location broadcaster sending periodic coordinate packets.
- Live customer order tracking view showing dynamic ETA and rider position updates.
