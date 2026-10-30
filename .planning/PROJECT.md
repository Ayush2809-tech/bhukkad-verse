# Bhukkad Verse ("Your Cravings. Your Universe.")

## What This Is

Bhukkad Verse is a hyperlocal food marketplace engineered to dismantle predatory aggregator economics (charging only a flat 10% platform fee vs. Swiggy/Zomato's 25%–35%) and eliminate customer "bill shock" (100% free delivery on orders over ₹99, flat ₹5 platform fee, transparent 5% GST). 

It merges theatrical visual storytelling (entrance rolling shutter curtain, 10-second kitchen video reels, and continuous round-robin dish marquee) across three curated culinary tiers: Iconic Street Food Carts, Heritage Luxury Dining, and Fresh Neighborhood Cloud Kitchens.

## Core Value

**Fair, transparent hyperlocal food commerce paired with immersive culinary storytelling, guaranteeing 90% revenue retention for kitchen partners and zero bill shock for customers.**

## Requirements

### Validated

- [x] Custom User Authentication with 4 distinct roles (`CUSTOMER`, `VENDOR`, `ADMIN`, `RIDER`) via SimpleJWT.
- [x] Vendor onboarding lifecycle (`PENDING` -> `APPROVED` / `REJECTED` / `SUSPENDED`) with admin review desk.
- [x] Multi-tenant vendor catalog management with size variants (Regular, Medium, Large) and customizable add-on groups.
- [x] Three curated culinary tiers: Iconic Street Food Carts, Heritage Luxury Dining, Fresh Cloud Kitchens.
- [x] Storefront discovery with category sub-navigation, dietary toggles (`VEG` / `NON_VEG`), search, and customizer modal.
- [x] Theatrical entrance rolling shutter with looping culinary background.
- [x] 10-second continuous looping kitchen story reels with countdown progress indicators.
- [x] Dynamic round-robin continuous dish marquee with cross-shop interleaving.
- [x] Automated backend test suite with 27 unit tests verifying RBAC, tenant isolation, and price integrity.

### Active

- [ ] Complete OpenAPI 3.0 schema generation (`drf-spectacular`) to automatically produce typed contracts for TypeScript clients.
- [ ] End-to-end shopping cart and checkout engine with authoritative server-side price snapshotting and coupon redemption.
- [ ] Customer saved delivery addresses (`CustomerAddress`) with landmark, flat/house, and delivery instructions.
- [ ] Provider-agnostic location infrastructure (Google Maps JS API when configured, Leaflet/OpenStreetMap automatic fallback, manual fallback).
- [ ] Backend-authoritative Haversine distance and shop serviceability calculations.
- [ ] Payment gateway integration (Razorpay / Stripe) with merchant webhook signature verification and idempotent order state transition.
- [ ] Cross-platform mobile application inception (React Native with Expo SDK 52) sharing types, cart math, and design tokens with the web app.
- [ ] Real-time rider telemetry and order tracking via Django Channels / ASGI and Redis WebSockets.

### Out of Scope

- **Aggregator Dynamic Surge Pricing** — Violates core value of honest pricing and zero bill shock.
- **Pay-to-play Sponsored Ad Listings** — Discovery marquee is strictly round-robin to ensure fair visibility for street food carts and small cloud kitchens.
- **Separate Organization Multi-Repo Split During Pre-Launch** — Monorepo approach is retained to eliminate API contract drift between web, mobile, and backend.

## Context

- **Backend:** Python 3.11+, Django 5.0, Django REST Framework 3.15, SimpleJWT.
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4.
- **Mobile Roadmap:** React Native with Expo SDK 52 (Expo Router) for Customer, Vendor, and Rider experiences.
- **Database:** Local development on SQLite; production configured for PostgreSQL 16 via Docker Compose.
- **Storage:** Local media directory for development; planned AWS S3 / Cloudinary for video reels and dish photography.

## Constraints

- **Tech Stack:** Django 5 DRF backend is retained as the authoritative source of truth. TypeScript contracts are generated directly from the Django schema.
- **Monetary Precision:** All currency fields must use `DecimalField(max_digits=8, decimal_places=2)`. Floats are strictly prohibited.
- **Tenant Isolation:** All vendor data modifications must be scoped to `request.user.shop` at the database query level.
- **Client/Server Boundaries:** Browser-only libraries (Leaflet, hardware-accelerated video canvas) must be dynamically imported with `ssr: false` in Next.js.

## Key Decisions

| Decision | Rationale | Impact |
| :--- | :--- | :--- |
| **Retain Django 5 DRF Backend** | Mature models, battle-tested migrations, and existing 27+ automated tests provide the highest velocity. | Eliminates costly backend rewrites; API schema serves web and mobile clients. |
| **React Native (Expo) for Mobile** | Leverages team's React and TypeScript proficiency; enables sharing up to 60% of code (types, cart math, hooks). | Fast mobile rollout across iOS and Android without native Swift/Kotlin overhead. |
| **Monorepo (Turborepo) Pre-Launch** | Single repository guarantees zero API contract drift between backend, web, and mobile apps. | Clean path to split into GitHub Organization post-launch if team scales. |
| **Provider-Agnostic Geospatial Stack** | Avoids hard vendor lock-in with Google Maps while allowing zero-cost Leaflet/OSM development. | App operates seamlessly with or without paid API keys. |
| **Authoritative Backend Haversine Engine** | Prevents client tampering of serviceability or delivery eligibility. | Guarantees delivery radius compliance (`distance <= shop.delivery_radius_km`). |

