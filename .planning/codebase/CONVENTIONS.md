# Coding Conventions & Development Standards — Bhukkad Verse
> **Analysis Date:** October 2026  
> **Source:** Existing codebase patterns in `backend/` and `frontend/`

---

## 🐍 Backend Standards (Python & Django 5)

### Naming Conventions
- **Models:** PascalCase singular (`Shop`, `Product`, `AddonGroup`, `Order`).
- **Database Tables:** Django default snake_case (`shops_shop`, `products_product`).
- **Fields & Attributes:** snake_case (`delivery_radius_km`, `is_vegetarian`, `base_price`).
- **Serializers:** PascalCase suffixed with `Serializer` (`ShopListSerializer`, `ProductVendorSerializer`).
- **Views:** Class-Based Views and ViewSets in PascalCase (`ShopViewSet`, `VendorProductViewSet`).

### Best Practices & Rules
1. **Explicit Monetary Types:**
   - Always use `models.DecimalField(max_digits=8, decimal_places=2)` for financial fields.
   - Always calculate currency values using Python's standard `decimal.Decimal`.
2. **Query Optimization:**
   - Use `select_related('shop', 'category')` for foreign key relationships.
   - Use `prefetch_related('variants', 'addon_groups')` for reverse lookups and ManyToMany relationships.
3. **Tenant Scoping:**
   - Vendor endpoints must always enforce row-level filtering: `queryset.filter(shop=self.request.user.shop)`.
4. **Error Responses:**
   - Return structured error dictionaries with descriptive message fields: `{"detail": "Error description"}`.

---

## ⚡ Frontend Standards (TypeScript & Next.js 16)

### Naming Conventions
- **Components:** PascalCase (`GrandEntranceShutter.tsx`, `DishCard.tsx`, `InteractiveMapPicker.tsx`).
- **Context Providers:** PascalCase with `Context` suffix (`AuthContext.tsx`, `CartContext.tsx`).
- **Hooks:** camelCase with `use` prefix (`useAuth.ts`, `useCart.ts`, `useLocation.ts`).
- **Types & Interfaces:** PascalCase (`Dish`, `Shop`, `OrderItem`, `CustomizationOption`).
- **Route Folders:** kebab-case or brackets for dynamic parameters (`[slug]`, `vendor/dashboard`).

### Best Practices & Rules
1. **Client / Server Component Separation:**
   - Keep page containers as Server Components where possible for SSR and SEO.
   - Add `'use client';` directive explicitly to components that handle user interactions, state, or DOM APIs.
2. **Dynamic Imports for Browser Globals:**
   - Any library accessing `window`, `navigator`, or Leaflet must be wrapped in `next/dynamic` with `{ ssr: false }`.
3. **Tailwind CSS v4 Token Consistency:**
   - Primary Accent: `amber-500` / `amber-400`.
   - Secondary Accent: `orange-600` / `orange-500`.
   - Dark Surfaces: `neutral-900` / `neutral-950` / `neutral-800`.
   - Border Highlights: `border-amber-500/20` or `border-neutral-800`.
4. **TypeScript Strictness:**
   - Avoid `any` types. Provide explicit types for API response envelopes and component props.

---

## 🌿 Git & Workflow Standards

- **Commit Message Format:** Follow Conventional Commits:
  - `feat: add Haversine distance filtering to ShopViewSet`
  - `fix: resolve hydration warning in InteractiveMapPicker`
  - `test: add unit tests for customer address creation`
  - `docs: update ROADMAP.md with Phase 5 completion`
- **Branch Naming:**
  - `feat/<feature-name>`
  - `fix/<bug-description>`
  - `refactor/<module-name>`

