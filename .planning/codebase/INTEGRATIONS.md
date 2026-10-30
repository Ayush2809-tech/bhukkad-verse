# External Integrations & Services — Bhukkad Verse
> **Analysis Date:** October 2026  
> **Source:** `docs/PRODUCTION_READINESS_AUDIT.md`, `docs/PROJECT_REPORT.md`, `settings.py`

---

## 🌐 API & External Services Inventory

| Category | Provider / Technology | Status | Integration Pattern | Fallback Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | SimpleJWT / Custom User Model | `ACTIVE` | Stateless Bearer Tokens stored in frontend `localStorage` / HTTP headers | Refresh token rotation endpoint (`/api/v1/auth/token/refresh/`) |
| **SMS / Mobile OTP** | MSG91 / Twilio (Planned) | `CONFIG READY` | Frontend `MobileOtpModal` currently simulates verification code for local dev | Fallback to email/password authentication |
| **Maps & Geocoding** | Google Maps JavaScript API | `CONFIG READY` | Enabled if `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is present in environment | Automatic degradation to Leaflet + OpenStreetMap + Manual Address Form |
| **Open Source Maps** | Leaflet + OpenStreetMap Nominatim | `ACTIVE` | Client-side dynamic import (`InteractiveMapPicker.tsx`) with reverse geocoding | Manual address input (house, street, landmark, pincode) |
| **Payment Gateway** | Razorpay / Stripe (Planned) | `CONFIG READY` | Server-side order creation (`/api/v1/orders/checkout/`) + client SDK payment sheet | Webhook HMAC signature verification before fulfilling order |
| **Media & Video Reels** | Local File Storage / S3 | `ACTIVE (LOCAL)` | Django `FileSystemStorage` under `/media/videos/` and `/media/shops/` | Cloudflare R2 / AWS S3 storage backend in production via `django-storages` |
| **Type Generation** | `drf-spectacular` + `@hey-api` | `PLANNED` | Automated OpenAPI 3.0 extraction from DRF viewsets into TypeScript SDK | Manual type definitions in `frontend/src/types/` |

---

## 🔐 Environment Variables & Configuration

### Backend (`backend/.env`)
```env
DEBUG=True
SECRET_KEY=django-insecure-bhukkad-verse-super-secret-key-change-in-prod
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Database Configuration (Defaults to SQLite if omitted)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=bhukkadverse
DB_USER=bhukkad
DB_PASSWORD=bhukkadversepass
DB_HOST=127.0.0.1
DB_PORT=5432

# External Service Keys
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

