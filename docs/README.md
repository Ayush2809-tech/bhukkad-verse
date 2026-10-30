# Bhukkad Verse Documentation Directory

Welcome to the internal engineering, architecture, and planning documentation for **Bhukkad Verse** (*"Your Cravings. Your Universe."*).

This directory organizes the technical specifications, architectural designs, readiness audits, and engineering reports that power the platform.

---

## 📚 Document Index

| Document | Description | Target Audience |
| :--- | :--- | :--- |
| **[PROJECT_REPORT.md](./PROJECT_REPORT.md)** | Comprehensive technical report containing full ER diagrams, API contracts, financial split models (4-way real-world economics), lifecycle state machines, and system performance specs. | All Contributors, Architects, Tech Leads |
| **[FOODHUB_ARCHITECTURE_PLAN.md](./FOODHUB_ARCHITECTURE_PLAN.md)** | Multi-vendor food marketplace blueprint, 3D experiential showcase design, multi-tenant row-level authorization design, and technical component blueprints. | Frontend & Backend Engineers |
| **[PRODUCTION_READINESS_AUDIT.md](./PRODUCTION_READINESS_AUDIT.md)** | Production readiness audit across database integrity, provider-agnostic maps/geocoding, vendor isolation, server-side serviceability calculations, and security checklists. | QA, DevOps, Core Maintainers |

---

## 🛠 Project Structure Overview

```text
Bhukkad-Verse/
├── backend/                  # Django 5 + Django REST Framework service
│   ├── apps/                 # Modular Django apps (authentication, core, shops, products, orders, customers)
│   ├── bhukkadverse/         # Core project settings and WSGI/ASGI configuration
│   └── manage.py             # Django management CLI
├── frontend/                 # Next.js 15+ (App Router) + React 19 + TypeScript + Tailwind v4
│   ├── src/                  # Application source (components, pages, context, hooks)
│   └── public/               # Static assets & icons
├── docs/                     # Technical specs, architecture plans, and audit documents
├── .github/                  # GitHub workflows, issue templates, PR template & automation
├── CONTRIBUTING.md           # Guidelines for contributing to Bhukkad Verse
├── CODE_OF_CONDUCT.md        # Community standards and conduct expectations
├── SECURITY.md               # Vulnerability reporting process and security policies
└── LICENSE                   # Project license (MIT)
```

---

## 💡 Adding New Documentation

When writing new documentation or architectural decision records (ADRs):
1. Place new documentation files inside this `docs/` folder (or appropriate subfolder).
2. Use GitHub Flavored Markdown with mermaid diagrams for flowcharts or sequence charts.
3. Update this `docs/README.md` index and link from the root [README.md](../README.md) if relevant.
