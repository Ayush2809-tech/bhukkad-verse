# BHUKKAD VERSE — PRODUCTION READINESS AUDIT & GLOBAL ARCHITECTURE AUDIT
**Date**: October 2026  
**Brand**: BHUKKAD VERSE  
**Tagline**: *YOUR CRAVINGS. YOUR UNIVERSE.*  
**Standard**: Production-Oriented Multi-Vendor Food Marketplace  

---

## 1. Executive Summary

This document establishes the authoritative production readiness audit for BHUKKAD VERSE across all platform layers: data integrity, location services, map provider abstractions, vendor isolation, customer address management, backend serviceability calculations, and end-to-end workflows.

Per the project mandate:
- **No fake production data**: Hardcoded restaurants, dummy prices, fabricated review ratings, and simulated API successes are strictly audited and cataloged for removal.
- **Provider-agnostic location infrastructure**: Maps and geocoding must operate with Google Maps when configured, gracefully fallback to OpenStreetMap/Leaflet when unconfigured, and preserve full manual address entry at all times.
- **Backend-authoritative serviceability**: Delivery eligibility is determined by the server using customer coordinates, shop coordinates, and vendor delivery coverage radius—never client-side assertions.

---

## 2. Production Readiness Classification Matrix

Each platform component is evaluated against four strict readiness states:
1. `IMPLEMENTED AND TESTED`: Real backend model, validated API, verified automated tests, and functioning frontend.
2. `IMPLEMENTED BUT NOT FULLY TESTED`: Functional code exists but lacks comprehensive edge-case, security, or cross-tenant tests.
3. `NOT IMPLEMENTED`: Scheduled in project roadmap; not yet built.
4. `REQUIRES EXTERNAL CONFIGURATION`: Code architecture exists, but external vendor credentials (Google Maps, Razorpay, S3, SMTP) are required.

| Component / Subsystem | Status | Description & Gap Analysis |
| :--- | :--- | :--- |
| **Custom User Authentication (`apps.authentication`)** | `IMPLEMENTED AND TESTED` | Custom User model with roles (`CUSTOMER`, `VENDOR`, `ADMIN`). JWT authentication, token refresh, `/api/v1/auth/me/`, and register/login endpoints tested with 10 unit tests. |
| **Vendor Shop Onboarding (`apps.shops`)** | `IMPLEMENTED AND TESTED` | Shop lifecycle (`PENDING` -> `APPROVED` / `REJECTED` / `SUSPENDED`). Isolated vendor shop application, patch/resubmit, and admin review tested with 7 unit tests. |
| **Vendor Catalog Isolation (`apps.products`)** | `IMPLEMENTED AND TESTED` | Vendor-specific categories, products, size variants (Regular, Medium, Large), and add-on groups (Extra Cheese, Crusts). Tested with 10 unit tests covering cross-tenant blocking, category mismatch, and negative prices. |
| **Public Storefront Menu (`/shops/[slug]`)** | `IMPLEMENTED AND TESTED` | Dynamic menu exploration, category sub-navigation, dietary toggle (`VEG`/`NON_VEG`), search, and authoritative customization modal. Prerendering verified in Next.js 16. |
| **Customer Saved Addresses (`CustomerAddress`)** | `NOT IMPLEMENTED` | Scheduled for next phase. No database model or API exists yet for customers to save multiple labeled addresses (`Home`, `Work`, `Other`), landmarks, or delivery instructions. |
| **Customer Device Geolocation** | `NOT IMPLEMENTED` | Browser Geolocation API permission handling, lat/lng retrieval, and user-initiated location flow not yet wired to a global location context. |
| **Map Provider Abstraction (Google / OSM)** | `NOT IMPLEMENTED` | No interactive map pin adjustment, reverse geocoding, or place autocomplete component exists yet in the frontend. |
| **Vendor Shop Map Pin & Coordinate Picker** | `IMPLEMENTED BUT NOT FULLY TESTED` | `latitude`, `longitude`, and `delivery_radius_km` fields exist on `Shop` model and are editable via API, but vendor dashboard lacks an interactive map pin picker. |
| **Backend Serviceability & Haversine Distance** | `NOT IMPLEMENTED` | Public shop discovery currently filters by search string and city name, but does not yet filter by customer `lat`/`lng` distance against shop `delivery_radius_km`. |
| **Homepage Production Data Hygiene** | `IMPLEMENTED BUT NOT FULLY TESTED` | Homepage (`frontend/src/app/page.tsx`) contains hardcoded sample dishes (`SAMPLE_DISHES`) with dummy ratings (4.8, 4.9) and mock restaurant names. Must be replaced with real database-driven featured items. |
| **Shopping Cart Engine** | `NOT IMPLEMENTED` | Scheduled for Phase 5. Single-vendor cart state, server-side item validation, and quantity management are not yet implemented. |
| **Checkout & Order Creation** | `NOT IMPLEMENTED` | Scheduled for Phase 6. Authoritative price/add-on snapshotting at checkout is designed but not yet coded. |
| **Payment Gateway Integration** | `REQUIRES EXTERNAL CONFIGURATION` | Requires Razorpay/Stripe API keys, merchant webhook signature verification, and transaction state machine. |
| **Live Courier Tracking & GPS** | `NOT IMPLEMENTED` | Scheduled for Phase 6. Real-time courier tracking cannot be claimed until courier app, WebSockets, or location telemetry are deployed. |
| **PostgreSQL Production Configuration** | `IMPLEMENTED BUT NOT FULLY TESTED` | `settings.py` and `docker-compose.yml` contain full PostgreSQL 16 configurations, but local test suite currently executes on SQLite for zero-dependency execution. |
| **Automated Testing Suite** | `IMPLEMENTED AND TESTED` | 27 automated backend tests passing (`python manage.py test`). Next.js 16 build passing with 10 static/PPR routes (`npm run build`). |

---

## 3. Hardcoded / Demo Data Inventory

The following hardcoded or fabricated data points have been discovered in the codebase:

1. **`frontend/src/app/page.tsx` (Lines 19–28: `FEATURED_CATEGORIES`)**:
   - Static category list with hardcoded item counts (`"24 Items"`, `"18 Items"`).
   - *Remediation*: Query active categories dynamically from `/api/v1/shops/...` or render dynamic category badges based on approved shops in the database.
2. **`frontend/src/app/page.tsx` (Lines 31–74: `SAMPLE_DISHES`)**:
   - Fabricated dishes attributed to non-existent shops (*The Crust Craft — Italian Oven*, *Urban Burger Station*, *Sip & Scoop Dessert Bar*).
   - Fabricated review ratings (*4.8*, *4.9*) and estimated delivery times (*25-30 min*).
   - *Remediation*: Replace with real database-backed featured products fetched from approved, active vendor kitchens.
3. **`backend/apps/shops/models.py` (Lines 33–36: Default Coordinates)**:
   - Default coordinates fallback to New Delhi center (`28.6139`, `77.2090`).
   - *Remediation*: Make coordinates explicitly required during shop registration and address geocoding rather than assuming central Delhi.
4. **`backend/seed_phase4_menu.py` (Local Development Seed Data)**:
   - Seeding script creates sample categories and pizzas for local developer testing.
   - *Remediation*: Relocate to `backend/fixtures/` and isolate via a management command (`python manage.py seed_dev_data`). Ensure production environments never run development seed scripts.

---

## 4. Location and Map Provider Architecture

### 4.1. Core Principles
1. **User Privacy**: Device location must never be tracked or requested automatically. It must require an explicit user tap on `"Use Current Location"`.
2. **Provider Pluggability**: The application must never depend on proprietary Google Maps code exclusively. If `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is not present, the app automatically activates Leaflet + OpenStreetMap or presents manual address entry with zero breakage.
3. **Graceful Degradation**: If permission is denied or geocoding services timeout, the user is never blocked from placing an order. Full manual address entry (House/Flat, Street, Landmark, City, PIN code) is always supported.

### 4.2. Location State Separation
The system strictly distinguishes three distinct spatial concepts:
- **`device_location`**: Raw GPS coordinate from `navigator.geolocation` (temporary client state).
- **`delivery_location`**: The confirmed customer destination, stored in `CustomerAddress` with flat/street, landmark, and verified coordinates.
- **`shop_location`**: The kitchen premises coordinates configured by the vendor, checked against `delivery_radius_km`.

---

## 5. Security & Multi-Tenant Isolation Review

| Security Boundary | Current Implementation | Verification Status |
| :--- | :--- | :--- |
| **Vendor Data Isolation** | Views use `request.user.shop` to filter queries. Cross-vendor category/product/variant access is rejected with HTTP 403 or 404. | `PASSED` (Automated tests in `test_cross_vendor_category_access_forbidden`) |
| **Product / Category Consistency** | `ProductVendorSerializer.validate_category` prevents assigning another shop's category to a product. | `PASSED` (Automated tests in `test_product_category_shop_mismatch_rejected`) |
| **Add-on Group Ownership** | `ProductVendorSerializer.validate_addon_groups` enforces all assigned add-on groups belong to the authenticated vendor's shop. | `PASSED` |
| **Unapproved Shop Shielding** | Public endpoints filter `status=Shop.Status.APPROVED, is_active=True`. Pending or rejected shops return 404 to customers. | `PASSED` (Automated tests in `test_unapproved_shop_menu_hidden_from_public`) |
| **Monetary Calculation Integrity** | All prices use `DecimalField(max_digits=8, decimal_places=2)`. Negative prices are blocked at model and serializer levels. | `PASSED` (Automated tests in `test_negative_price_rejected`) |
| **Frontend Authentication State** | JWT stored in `localStorage`, sent via `Authorization: Bearer <token>`. Resilient `defaultAuthContext` prevents SSR prerender crashes. | `PASSED` (`npm run build` exits with code 0) |

---

## 6. Database & Migration Status

### Active Migrations
- `authentication.0001_initial`: Custom `User` model with `role`, `phone`, `avatar`, `bio`.
- `shops.0001_initial`: `Shop` model with approval workflow, operating hours, coordinates, delivery radius, commission rate.
- `products.0001_initial`: `Category`, `Product`, `ProductVariant`, `AddonGroup`, `AddonItem`, and M2M associations.

### Pending Architectural Migrations (Next Phase)
- `customers.0001_initial`: Create `CustomerAddress` model with foreign key to `User`, coordinates, labels, and delivery instructions.
- Spatial index on `(latitude, longitude)` on both `Shop` and `CustomerAddress`.

---

## 7. Performance & Reliability Guidelines

1. **Database Queries**:
   - Haversine distance filtering will use Django ORM trigonometric expressions (`Sin`, `Cos`, `Radians`, `ACos`) computed over bounding boxes to avoid full table scans.
   - All spatial queries will filter by `status=Shop.Status.APPROVED, is_active=True` first before evaluating distance.
2. **Frontend Asset Optimization**:
   - 3D models and heavy Canvas scripts are strictly isolated to hero showcases.
   - Storefront browsing, menu navigation, cart management, and address entry use lightweight SVG icons and responsive WebP images.
3. **Error & Loading States**:
   - Every fetch request handles loading spinners (`Loader2 animate-spin`), explicit empty states, network retry buttons, and structured error toasts.

---

## 8. Prioritized Roadmap & Next Phase Scope

- **Stage 1 (Immediate)**: Clean up hardcoded dummy dishes and fake review ratings on the homepage. Align homepage with real backend database queries.
- **Stage 2 (Phase 4.5 / Location Infrastructure)**:
  1. Implement `apps.customers` app with `CustomerAddress` model, serializers, permissions, and automated tests.
  2. Implement backend serviceability calculation (Haversine distance vs. `shop.delivery_radius_km`).
  3. Implement frontend Customer Location Context & Address Selector modal.
  4. Implement Map Provider Abstraction (Leaflet + OpenStreetMap with Google Maps pluggability).
  5. Enhance Vendor Dashboard with interactive shop map pin & delivery radius configuration.
- **Stage 3 (Phase 5)**: Real Cart & Server-Authoritative Price Validation.
- **Stage 4 (Phase 6)**: Checkout, Orders, Payments & Tracking.
 