# Technical Debt, Concerns & Mitigation Plan — Bhukkad Verse
> **Analysis Date:** October 2026  
> **Source:** `docs/PRODUCTION_READINESS_AUDIT.md`, `tech_stack_and_scale_plan.md`

---

## 🚨 Critical Items & Immediate Remediations

### 1. Hardcoded Sample Dishes on Frontend Homepage
- **Location:** `frontend/src/app/page.tsx` (`SAMPLE_DISHES` array, lines 31–74).
- **Issue:** Homepage currently renders hardcoded sample dishes with fabricated ratings (4.8, 4.9) and mock restaurant names.
- **Risk:** Breaks data hygiene; customer orders placed against mock dishes will fail on backend checkout.
- **Mitigation:** Update `page.tsx` to dynamically query featured products from approved vendors via `/api/v1/products/featured/` or `/api/v1/shops/`.

### 2. SQLite to PostgreSQL Production Transition
- **Location:** `backend/bhukkadverse/settings.py` and `docker-compose.yml`.
- **Issue:** The local environment runs on SQLite (`db.sqlite3`). While convenient for setup, SQLite lacks support for high-concurrency writes, connection pooling, and PostGIS geospatial indexing.
- **Risk:** Potential write lock contention when multiple mobile riders stream GPS telemetry concurrently.
- **Mitigation:** Activate PostgreSQL 16 via Docker Compose for all staging and production deployments.

### 3. Lack of Native Mobile App (Scope Limit)
- **Location:** Entire codebase (currently Web-Only).
- **Issue:** Over 80% of food delivery transactions happen on mobile. Riders require background GPS tracking when screens are locked, and customers require native push notifications.
- **Risk:** High churn and operational friction if delivery relies on mobile web browsers.
- **Mitigation:** Follow the architectural scaling plan to scaffold a React Native (Expo SDK 52) application sharing types, cart math, and tokens with the Next.js app.

### 4. Manual TypeScript Interface Drift
- **Location:** `frontend/src/types/` vs. `backend/apps/*/models.py`.
- **Issue:** Frontend TypeScript interfaces are currently manually maintained and duplicated from Django models.
- **Risk:** Renaming or modifying a model field in Django may silently break frontend or mobile views at runtime.
- **Mitigation:** Integrate `drf-spectacular` on Django to emit an OpenAPI 3.0 schema and use `@hey-api/openapi-ts` to automatically generate strict TypeScript types.

### 5. Media Asset Storage in Local Filesystem
- **Location:** `backend/media/`.
- **Issue:** Kitchen video reels and hero photography are currently saved to the local container disk.
- **Risk:** Ephemeral containers (e.g., on Render, Railway, AWS ECS) will lose uploaded videos upon restart.
- **Mitigation:** Configure `django-storages` with AWS S3, Cloudflare R2, or Cloudinary for production media hosting.

