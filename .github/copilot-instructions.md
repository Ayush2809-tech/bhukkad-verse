# GitHub Copilot & Cursor Instructions — Bhukkad Verse
> **Project:** Bhukkad Verse ("Your Cravings. Your Universe.")  
> **Repository:** `Bhukkad-Verse`

## General Guidelines
- You are working on Bhukkad Verse, a hyperlocal food marketplace with a Django 5 REST Framework backend and a Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 frontend.
- When generating or modifying code, preserve existing coding style, type safety, and architectural boundaries.
- For architectural context, review `docs/PROJECT_REPORT.md` and `docs/FOODHUB_ARCHITECTURE_PLAN.md`.

## Python / Django 5 DRF Rules
- All models representing money, fees, discounts, and prices MUST use `models.DecimalField(max_digits=8, decimal_places=2)`.
- Use Python's `decimal.Decimal` for currency calculations. Never use Python `float`.
- In all vendor-scoped API views and viewsets, enforce tenant isolation:
  ```python
  def get_queryset(self):
      return Model.objects.filter(shop=self.request.user.shop)
  ```
- Optimize database queries using `select_related()` for ForeignKey/OneToOne and `prefetch_related()` for ManyToMany relationships.
- Write tests in `tests.py` using `rest_framework.test.APITestCase`.

## Next.js 16 / TypeScript / React 19 Rules
- Place App Router pages in `frontend/src/app/`.
- Reusable UI components belong in `frontend/src/components/<domain>/`.
- Declare `'use client';` at the top of components that use state, effects, context hooks, or browser APIs (`window`, `localStorage`, `navigator`).
- Dynamic imports with `{ ssr: false }` MUST be used when rendering Leaflet map components or components dependent on browser canvas/hardware APIs.
- Use Tailwind CSS v4 utility classes. Keep the brand palette centered on amber (`amber-500`), orange (`orange-600`), and dark neutrals (`neutral-900`, `neutral-950`).
- Avoid `any` types. Ensure all API responses and component props have explicit TypeScript types.

## Business Logic & Economics
- Honest 4-way economics:
  - 100% Free delivery for customer orders above ₹99 (₹25 standard fee if below ₹99).
  - Flat ₹5.00 platform convenience fee.
  - Transparent 5% food GST.
  - Flat 10% platform commission on food (vendor retains 90%).
  - Guaranteed ₹30–₹35 rider payout per order.
- Three culinary tiers:
  - `STREET_FOOD` (Iconic Street Food & Legendary Carts)
  - `HERITAGE_LUXURY` (Luxury Fine Dining & Heritage Palaces)
  - `CLOUD_KITCHEN` (Fresh Neighborhood Cloud Kitchens)

