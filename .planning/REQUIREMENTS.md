# REQUIREMENTS.md — System Requirements Specification
> **Project:** Bhukkad Verse ("Your Cravings. Your Universe.")  
> **Status:** Active Baseline

---

## 1. Functional Requirements

### 1.1 Customer Experience & Storefront
- **REQ-CUST-01 [Theatrical Entrance]:** When users arrive on the web or mobile storefront, an entrance rolling shutter must provide a tactile culinary transition with gesture support and background ambiance.
- **REQ-CUST-02 [Kitchen Video Reels]:** Customers must be able to view 10-second looping video reels with Instagram-style countdown bars directly from the homepage and shop detail pages.
- **REQ-CUST-03 [Continuous Dishes Marquee]:** The platform must feature a continuous dish conveyor slider with round-robin vendor interleaving to ensure fair visibility across all shops.
- **REQ-CUST-04 [Curated Tier Filtering]:** Users must be able to filter food options across three curated culinary tiers:
  - `STREET_FOOD`: Iconic Street Food & Legendary Carts.
  - `HERITAGE_LUXURY`: Luxury Fine Dining & Heritage Palaces.
  - `CLOUD_KITCHEN`: Fresh Neighborhood Cloud Kitchens.
- **REQ-CUST-05 [Dynamic Menu & Customization]:** Shop menus must render categories, products, dietary badges (`VEG`, `NON_VEG`), size variants (e.g., Regular, Medium, Large), and optional add-on groups.
- **REQ-CUST-06 [Saved Delivery Addresses]:** Customers must be able to manage multiple labeled delivery addresses (`Home`, `Work`, `Other`) with landmark, flat/house details, and coordinates.
- **REQ-CUST-07 [Transparent Cart & Checkout]:** The checkout interface must display an itemized breakdown: Subtotal, 100% Free Delivery (for orders > ₹99), flat ₹5 Platform Fee, and 5% food GST. Zero bill-shock.

### 1.2 Vendor Self-Governance & Portal
- **REQ-VEND-01 [Vendor Registration]:** Prospective kitchen partners must be able to register, submit documents (FSSAI, GSTIN, kitchen photos), set coordinates, and specify delivery coverage radius.
- **REQ-VEND-02 [Menu & Inventory Management]:** Vendors must have full CRUD control over categories, items, size variants, add-on groups, and stock availability toggles (`is_available`).
- **REQ-VEND-03 [Reels & Media Upload]:** Vendors must be able to upload 10-second MP4 video reels and hero imagery directly to their profile.
- **REQ-VEND-04 [Order Acceptance & Dispatch]:** Vendors must receive live order notifications, accept/reject incoming orders, and transition orders from `ACCEPTED` -> `PREPARING` -> `READY_FOR_PICKUP`.
- **REQ-VEND-05 [Operating Hours & Vacation Mode]:** Vendors must be able to configure daily opening/closing schedules and toggle temporary vacation status.

### 1.3 Platform Super Admin & Governance
- **REQ-ADMN-01 [Vendor Audit & Verification]:** Administrators must review pending vendor applications, verify legal credentials, and transition shops between `PENDING`, `APPROVED`, `REJECTED`, and `SUSPENDED`.
- **REQ-ADMN-02 [Content Moderation]:** Admins must be able to moderate uploaded video reels and product listings to ensure brand hygiene.
- **REQ-ADMN-03 [Dispute & Support Resolution]:** Admins must have access to customer support tickets, order timelines, and refund dispatch capabilities.
- **REQ-ADMN-04 [Platform Financial Auditing]:** Admins must have visibility into gross merchandise value (GMV), 10% platform commission retention, and vendor payout settlements.

### 1.4 Rider & Delivery Operations (Planned Multi-Platform)
- **REQ-RIDE-01 [Rider Dispatch & Assignment]:** Orders in `READY_FOR_PICKUP` must be broadcast to available nearby riders within service radius.
- **REQ-RIDE-02 [Guaranteed Payout Engine]:** Riders must be guaranteed ₹30–₹35 per fulfilled delivery, credited to their earnings ledger.
- **REQ-RIDE-03 [Live Telemetry & GPS Tracking]:** Riders must stream periodic GPS coordinates via background mobile services to power real-time customer tracking.

---

## 2. Non-Functional Requirements

### 2.1 Security & Tenant Isolation
- **REQ-SEC-01 [Row-Level Tenant Isolation]:** All vendor viewsets must scope database queries strictly to `request.user.shop`. Cross-tenant record inspection or modification must return HTTP 403 or 404.
- **REQ-SEC-02 [JWT Authentication]:** Stateless JWT authentication via `djangorestframework-simplejwt` with short-lived access tokens and refresh rotation.
- **REQ-SEC-03 [Monetary Data Integrity]:** All currency attributes must use `DecimalField(max_digits=8, decimal_places=2)`. Client-supplied monetary amounts must never be trusted without server-side recalculation.

### 2.2 Performance & Scalability
- **REQ-PERF-01 [Sub-100ms API Response]:** Read endpoints (menus, shop profiles, categories) must utilize `select_related` and `prefetch_related` to avoid N+1 queries.
- **REQ-PERF-02 [Client-Side Hydration Resilience]:** Next.js 16 components must cleanly separate SSR and CSR boundaries. Browser-only libraries (Leaflet) must use dynamic imports with `ssr: false`.
- **REQ-PERF-03 [PostgreSQL Ready]:** Zero dialect-specific SQLite logic; fully prepared for PostgreSQL 16 in staging and production.

### 2.3 Geospatial & Location Architecture
- **REQ-GEO-01 [Provider Pluggability]:** Geospatial components must load Google Maps when an API key is available, and seamlessly fall back to Leaflet and OpenStreetMap without throwing errors.
- **REQ-GEO-02 [Haversine Distance Engine]:** Backend must calculate customer-to-vendor distance in kilometers using the Haversine formula and enforce `distance <= shop.delivery_radius_km`.

---

## 3. Multi-Platform & Future Expansion

- **REQ-PLAT-01 [OpenAPI Type Generation]:** Django DRF must emit an OpenAPI 3.0 specification (`drf-spectacular`) to automatically generate TypeScript clients and interfaces.
- **REQ-PLAT-02 [React Native Expo Integration]:** Customer and Rider mobile experiences must be developed with React Native (Expo SDK 52) sharing types, cart calculation math, and design tokens with the web app.
- **REQ-PLAT-03 [Real-Time WebSocket Gateway]:** Real-time tracking must leverage Django Channels / ASGI and Redis to stream live courier coordinates to the customer UI.

