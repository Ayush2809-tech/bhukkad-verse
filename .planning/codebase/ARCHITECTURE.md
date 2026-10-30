# System Architecture — Bhukkad Verse
> **Analysis Date:** October 2026  
> **Source:** `docs/FOODHUB_ARCHITECTURE_PLAN.md`, `docs/PROJECT_REPORT.md`, `backend/apps/`, `frontend/src/`

---

## 🏛️ High-Level System Architecture

Bhukkad Verse operates as a decoupled client-server architecture with strict separation between user-facing presentation, business logic orchestration, and relational persistence.

```mermaid
flowchart TD
    subgraph ClientTiers ["Client Presentation Tier"]
        WebStorefront["Next.js 16 Web Storefront<br/>(PPR, SSR, Tailwind v4)"]
        VendorPortal["Vendor Management Desk<br/>(Menu CRUD, Reels, Analytics)"]
        AdminCMS["Super Admin Governance<br/>(Vendor Audits, Ticket Resolution)"]
        MobileApp["Planned Expo / React Native App<br/>(Customer Reels, Rider GPS)"]
    end

    subgraph Gateway ["Network & Security Layer"]
        CORS["CORS Middleware"]
        AuthMiddleware["JWT Authentication Middleware"]
        TenantGuard["Row-Level Tenant Guard (request.user.shop)"]
    end

    subgraph ServiceTier ["Django 5 REST Backend Services"]
        AuthService["apps.authentication<br/>(Custom User, Roles, Tokens)"]
        ShopService["apps.shops<br/>(Kitchens, Tiers, Hours, Coverage)"]
        ProductService["apps.products<br/>(Dishes, Variants, Addon Groups)"]
        OrderService["apps.orders<br/>(Cart, 4-Way Financial Split)"]
        CustomerService["apps.customers<br/>(Addresses, Support Tickets)"]
        CoreService["apps.core<br/>(Settings CMS, Video Reels, Reviews)"]
    end

    subgraph DataStorage ["Data & File Storage"]
        RelationalDB[(PostgreSQL 16 / SQLite)]
        MediaBucket["Media File Storage (/media/)"]
        RedisCache["Redis 7 (Sessions & Channels)"]
    end

    WebStorefront --> Gateway
    VendorPortal --> Gateway
    AdminCMS --> Gateway
    MobileApp --> Gateway

    Gateway --> AuthService
    Gateway --> ShopService
    Gateway --> ProductService
    Gateway --> OrderService
    Gateway --> CustomerService
    Gateway --> CoreService

    ServiceTier --> RelationalDB
    ServiceTier --> MediaBucket
    ServiceTier --> RedisCache
```

---

## 💰 4-Way Fair Real-World Economics Model

Unlike conventional food aggregators that take 25%–35% cuts and impose multi-layered fees on customers, Bhukkad Verse implements an immutable 4-way economic split:

```mermaid
flowchart LR
    CustomerBill["Customer Payment<br/>Subtotal + ₹5 Platform Fee + 5% GST<br/>(100% Free Delivery if > ₹99)"]
    
    CustomerBill --> Splitter["Authoritative Split Engine"]
    
    Splitter -->|90% Net Food Revenue| Vendor["👨‍🍳 Vendor Partner<br/>(Direct Bank Settlement)"]
    Splitter -->|₹30 – ₹35 Fixed Fee| Rider["🛵 Delivery Rider<br/>(Guaranteed Earning per Order)"]
    Splitter -->|10% Margin + ₹5 Fee - Subsidy| Platform["🛡️ Bhukkad Verse Platform<br/>(Sustainable Operations & Tech)"]
    Splitter -->|5% Collected Tax| Government["🏛️ GST Compliant Remittance"]
```

### Calculation Example (₹399 Order)
1. **Food Subtotal:** ₹399.00
2. **Delivery Fee:** ₹0.00 (Waived via 100% Free Delivery promotion on orders > ₹99)
3. **Platform Fee:** ₹5.00
4. **GST (5%):** ₹19.95
5. **Customer Grand Total:** ₹423.95 (Zero bill shock; saves ₹25+ vs Swiggy/Zomato)
6. **Vendor Net Payout:** ₹359.10 (90% of ₹399)
7. **Rider Guaranteed Payout:** ₹32.00
8. **Platform Net Margin:** ₹42.85

---

## 📍 Geospatial Discovery & Serviceability

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 Customer
    participant Frontend as ⚡ Next.js Client
    participant API as 🐍 Django DRF Backend
    participant DB as 🗄️ Database

    Customer->>Frontend: Grants Location / Sets Address Pin (lat, lng)
    Frontend->>API: GET /api/v1/shops/?lat=28.6139&lng=77.2090
    Note over API: Haversine Calculation:<br/>d = 2R * sin⁻¹(√[sin²(Δφ/2) + cos(φ1)cos(φ2)sin²(Δλ/2)])
    API->>DB: Fetch Active & Approved Shops
    API->>API: Filter shops where calculated_distance <= shop.delivery_radius_km
    API-->>Frontend: Return Serviceable Kitchens with ETA & Distance
    Frontend-->>Customer: Display Curated Tiers & Video Reels
```

---

## 🔐 Multi-Tenant Row-Level Isolation

To ensure absolute privacy and security among competing kitchen partners:
- The `Shop` model acts as the tenant root for all product catalogs.
- `request.user.shop` binds vendor operations.
- All vendor viewsets (`VendorProductViewSet`, `VendorCategoryViewSet`, `VendorOrderViewSet`) override `get_queryset()` to constrain access to the active shop.
- Attempts to inspect or modify another vendor's products or orders result in an immediate `HTTP 403 Forbidden` or `HTTP 404 Not Found`.

