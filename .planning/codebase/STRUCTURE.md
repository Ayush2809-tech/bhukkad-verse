# Directory Structure & Organization — Bhukkad Verse
> **Analysis Date:** October 2026  
> **Source:** Repository tree analysis

---

## 📂 Root Repository Layout

```text
Bhukkad-Verse/
├── .github/                      # CI/CD Workflows & GitHub issue/PR templates
│   ├── workflows/                # frontend-ci.yml, backend-ci.yml
│   ├── ISSUE_TEMPLATE/           # Structured bug & feature templates
│   ├── PULL_REQUEST_TEMPLATE.md  # PR verification checklist
│   └── copilot-instructions.md   # Guidelines for GitHub Copilot & Cursor
├── .planning/                    # GSD Planning, Roadmap, and Codebase Map
│   ├── codebase/                 # 7 structured codebase intelligence docs
│   ├── PROJECT.md                # Project context, vision, and core values
│   ├── REQUIREMENTS.md           # Scoped system requirements
│   ├── ROADMAP.md                # Phased milestones & task tracking
│   ├── STATE.md                  # Active memory, decisions, and next steps
│   └── config.json               # GSD workflow configuration
├── docs/                         # Authoritative engineering documentation
│   ├── FOODHUB_ARCHITECTURE_PLAN.md # Deep architectural blueprint
│   ├── PRODUCTION_READINESS_AUDIT.md# Security, data hygiene & readiness audit
│   ├── PROJECT_REPORT.md         # Comprehensive project report & specs
│   └── README.md                 # Documentation index & guide
├── backend/                      # Python Django 5 & DRF Service
│   ├── apps/                     # Modular Django domain apps
│   │   ├── authentication/       # Custom user model, SimpleJWT, roles
│   │   ├── core/                 # Video reels, settings CMS, platform reviews
│   │   ├── shops/                # Kitchen shops, tiers, schedules, delivery radius
│   │   ├── products/             # Categories, dishes, variants, addon groups
│   │   ├── orders/               # Cart, checkout, 4-way economic split
│   │   └── customers/            # Saved addresses, support tickets
│   ├── bhukkadverse/             # Django settings, WSGI, ASGI, root URLs
│   ├── fixtures/                 # Seed fixtures & initial data
│   ├── manage.py                 # Django CLI management entrypoint
│   └── requirements.txt          # Python dependencies
├── frontend/                     # Next.js 16 App Router & Tailwind CSS v4
│   ├── public/                   # Static assets, branding, and icons
│   ├── src/
│   │   ├── app/                  # Next.js App Router routes
│   │   │   ├── (auth)/           # /login, /register
│   │   │   ├── (customer)/       # /, /shops, /shops/[slug], /cart, /orders, /profile
│   │   │   ├── (vendor)/         # /vendor/register, /vendor/dashboard
│   │   │   ├── (admin)/          # /admin
│   │   │   └── (static)/         # /about, /terms, /privacy, /support, /reviews
│   │   ├── components/           # Reusable UI component modules
│   │   │   ├── auth/             # MobileOtpModal
│   │   │   ├── brand/            # BrandLogo, Badges
│   │   │   ├── home/             # GrandEntranceShutter, ContinuousDishesSlider, etc.
│   │   │   ├── layout/           # Navbar, Footer
│   │   │   ├── location/         # InteractiveMapPicker, LocationSelectorModal
│   │   │   ├── notifications/    # TrendingFoodPopup
│   │   │   └── search/           # DishCard, SearchFilters
│   │   ├── context/              # AuthContext, CartContext, LocationContext
│   │   └── types/                # TypeScript interface contracts
│   ├── package.json              # Frontend scripts and dependencies
│   └── tailwind.config.ts        # Tailwind CSS theme configuration
├── scripts/                      # Utility and deployment automation scripts
├── AGENTS.md                     # Universal AI Agent Instruction Manual
├── CLAUDE.md                     # Claude Code / Anthropic profile directives
├── GEMINI.md                     # Gemini CLI / Antigravity Agent profile directives
├── docker-compose.yml            # PostgreSQL 16 & Redis orchestration
├── README.md                     # Public repository landing page
└── LICENSE                       # MIT License
```

---

## 🧩 Architectural Separation of Concerns

- **`backend/apps/shops` vs. `backend/apps/products`**: `shops` owns kitchen entity lifecycle and geographic serviceability; `products` owns item hierarchies (categories, variants, add-on groups) scoped to each shop.
- **`frontend/src/context` vs. `frontend/src/components`**: Global cross-cutting state (user JWT token, current shopping cart items, selected delivery coordinates) is isolated inside React Context providers; UI components consume them via custom hooks (`useAuth`, `useCart`, `useLocation`).
- **`backend/apps/orders`**: Holds the authoritative financial split calculations so frontend clients cannot modify commissions or price subtotals.

