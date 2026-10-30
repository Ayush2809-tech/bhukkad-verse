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
    section Core Commerce
    Phase 5: Customer Addresses & Haversine Distance:active, p5, 2026-10, 2026-11
    Phase 6: Single-Vendor Cart & 4-Way Checkout    :p6, 2026-11, 2026-11
    Phase 7: Payment Gateway (Razorpay/Stripe)     :p7, 2026-11, 2026-12
    section Multi-Platform & Real-Time
    Phase 8: OpenAPI Type Generation & SDKs        :p8, 2026-12, 2026-12
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

---

### Phase 5: Customer Addresses & Haversine Geospatial Discovery
**Status:** `IN PROGRESS`  
- **Objective:** Enable saved customer delivery addresses and server-authoritative serviceability filtering.
- **Deliverables:**
  - `CustomerAddress` model (`flat_house`, `street_area`, `landmark`, `city`, `pincode`, `latitude`, `longitude`, `is_default`, `address_type`).
  - Provider-agnostic location picker: Google Maps JS API when configured; Leaflet/OpenStreetMap fallback; manual address entry fallback.
  - Backend Haversine distance calculator filtering public shop listings against `shop.delivery_radius_km`.
  - Frontend `LocationContext` storing confirmed customer delivery coordinates.

### Phase 6: Single-Vendor Cart & 4-Way Fair Checkout Engine
**Status:** `PLANNED`  
- **Objective:** Build robust single-vendor cart constraints and server-validated checkout with transparent billing.
- **Deliverables:**
  - Single-vendor cart enforcement (prompts user to clear cart if adding from another kitchen).
  - Server-authoritative checkout validation recalculating dish prices, size variants, and addons from the database.
  - Transparent fee calculation: Subtotal + ₹5.00 Platform Fee + 5% GST; Free delivery if subtotal > ₹99 (₹25 standard fee if <= ₹99).
  - 4-way financial ledger split: 90% vendor share, ₹30–₹35 rider share, 10% platform margin.

### Phase 7: Payment Gateway Integration & Order State Machine
**Status:** `PLANNED`  
- **Objective:** Seamless online payment processing and idempotent order state progression.
- **Deliverables:**
  - Razorpay / Stripe payment gateway integration with order pre-creation and payment verification.
  - Webhook listener with HMAC signature verification to prevent spoofing.
  - Order state machine: `PENDING` -> `CONFIRMED` -> `PREPARING` -> `READY_FOR_PICKUP` -> `OUT_FOR_DELIVERY` -> `DELIVERED` / `CANCELLED`.

### Phase 8: OpenAPI Type Generation & Shared Client SDK
**Status:** `PLANNED`  
- **Objective:** Modernize API contract and automate TypeScript types for cross-platform clients.
- **Deliverables:**
  - Install and configure `drf-spectacular` on Django DRF backend to expose `/api/schema/` and Swagger UI at `/api/docs/`.
  - Configure `@hey-api/openapi-ts` to generate strict TypeScript interfaces directly into `frontend/src/types/api.ts`.
  - Eliminate manual interface drift across web and future mobile clients.

### Phase 9: Cross-Platform Mobile Application (React Native / Expo)
**Status:** `PLANNED`  
- **Objective:** Launch native iOS and Android mobile apps for Customers, Vendors, and Riders.
- **Deliverables:**
  - Scaffold `mobile/` using Expo SDK 52 with Expo Router (file-based routing matching Next.js App Router).
  - Share core business logic, cart math, and Zod schemas between web and mobile via monorepo workspace.
  - Customer App: Mobile reels feed, location-based kitchen discovery, native push notifications.
  - Vendor App: Kitchen order chime audio notifications, quick item availability toggle.
  - Rider App: Real-time background GPS streaming daemon.

### Phase 10: Real-Time WebSockets & Live Rider Telemetry
**Status:** `PLANNED`  
- **Objective:** Live customer order tracking with moving courier icon on interactive maps.
- **Deliverables:**
  - Deploy Redis and Django Channels (ASGI) for real-time WebSocket communication (`ws/orders/<order_id>/tracking/`).
  - Rider mobile background location broadcaster sending periodic coordinate packets.
  - Live customer order tracking view showing dynamic ETA and rider position updates.

