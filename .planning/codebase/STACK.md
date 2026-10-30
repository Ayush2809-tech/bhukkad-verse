# Technology Stack — Bhukkad Verse
> **Analysis Date:** October 2026  
> **Source:** Codebase inspection of `backend/`, `frontend/`, `docs/`, and `docker-compose.yml`

---

## 💻 Languages

**Primary:**
- **TypeScript 5.x:** All frontend web application code, components, context providers, and page routes (`frontend/src/`).
- **Python 3.11+ / 3.10+:** Entire backend REST service, database models, serializers, views, migrations, and test suite (`backend/apps/`).

**Secondary:**
- **CSS / Tailwind CSS v4:** Styling, custom brand palettes, responsive utility classes.
- **SQL / Relational Schema:** SQLite schema definitions locally; PostgreSQL 16 schema definitions for staging and production.
- **YAML / Docker Compose:** Container orchestration for PostgreSQL and Redis services.

---

## 🏃 Runtimes & Environments

**Frontend Web Runtime:**
- **Node.js:** v20.x or v22.x LTS.
- **Package Manager:** npm (with `package-lock.json`).
- **Compiler / Bundler:** Next.js Turbopack compiler (`next dev`, `next build`).

**Backend Service Runtime:**
- **Python Runtime:** Python 3.10 / 3.11+.
- **Virtual Environment:** Python standard `venv`.
- **WSGI / ASGI:** Django default WSGI handler (`bhukkadverse.wsgi`), ASGI ready for WebSockets (`bhukkadverse.asgi`).

---

## 🚀 Frameworks & Core Libraries

### Backend Frameworks
- **Django 5.0+:** Core web framework, ORM, authentication system, migration engine, and admin portal.
- **Django REST Framework (DRF) 3.15+:** RESTful API views, model serializers, permission classes, and pagination.
- **django-cors-headers 4.3+:** Cross-Origin Resource Sharing middleware enabling decoupled Next.js client access.
- **djangorestframework-simplejwt 5.3+:** JSON Web Token (JWT) stateless authentication and token refresh handling.
- **Pillow 10.0+:** Image processing and validation for kitchen logos, dish banners, and user avatars.

### Frontend Frameworks
- **Next.js 16.4.3 (App Router):** Server-Side Rendering (SSR), Partial Prerendering (PPR), static optimization, and file-based route handlers.
- **React 19.3.0 & React DOM 19.3.0:** React server components, modern hooks, concurrent features.
- **Tailwind CSS v4:** Modern utility-first styling with `@tailwindcss/turbopack` integration.
- **Lucide React 1.62+:** Comprehensive SVG iconography across customer, vendor, and admin portals.
- **Leaflet 1.9.4 & @types/leaflet:** Provider-agnostic interactive map pin adjustment and geocoding fallback.

---

## 🗄️ Database & Infrastructure

- **Development Database:** SQLite 3 (`backend/db.sqlite3`) for zero-dependency local setup.
- **Production Database:** PostgreSQL 16 (configured in `backend/bhukkadverse/settings.py` and `docker-compose.yml`).
- **Caching & Broker (Planned):** Redis 7 (configured in `docker-compose.yml` for session caching and Django Channels WebSockets).
- **Containerization:** `docker-compose.yml` orchestrating `db` (Postgres 16) and `redis` (Redis Alpine).

