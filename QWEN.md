# Kharon Fire & Security Solutions - Project Context

## Project Overview

**Kharon Website** is a comprehensive fire protection and security solutions portal for South African commercial/industrial applications. Built with **Astro 6.3.3**, deployed on **Cloudflare Pages** with **D1 database** and **R2 storage**.

### Core Characteristics

- **Type**: Full-stack web application with SSR
- **Primary Domain**: www.tequit.co.za (public site), portal.tequit.co.za (FSM portal)
- **Target Audience**: South African commercial/industrial fire & security sector
- **Design Aesthetic**: Industrial Command Intelligence - dark-themed, mission-critical infrastructure interface

### Key Features

#### Public Website
- Responsive design optimized for South African market
- Comprehensive service pages (Gas Suppression, Fire Detection, Security Systems)
- Emergency support and compliance information
- SEO optimized with proper meta tags and structured data
- Accessibility features (skip links, ARIA labels, WCAG compliance)

#### Field Service Management (FSM) Portal
- Role-based access control (admin, tech, client, finance)
- Job dispatch and scheduling with priority triaging
- Technician field reporting with GPS tracking
- Client compliance dashboard for risk/certificate monitoring
- Financial workflow integration with Sage
- Document management with R2 storage
- Offline-resilient draft saving

#### Security & Compliance
- POPIA-compliant data handling
- Multi-factor authentication (MFA)
- Session management with CSRF protection
- Rate limiting and IP-based security
- Audit logging for all actions
- SANS standards compliance (10139, 14520)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Astro v6.3.3 with SSR |
| **Styling** | TailwindCSS v4 (CSS-first configuration) |
| **Deployment** | Cloudflare Pages |
| **Database** | Cloudflare D1 (SQLite) |
| **Storage** | Cloudflare R2 |
| **Language** | TypeScript (strict mode) |
| **Validation** | Zod v4.4.3 |
| **PDF Generation** | pdf-lib |

### Key Dependencies

```json
{
  "@astrojs/cloudflare": "^13.5.3",
  "@tailwindcss/vite": "^4.3.0",
  "astro": "^6.3.3",
  "tailwindcss": "^4.3.0",
  "zod": "^4.4.3",
  "typescript": "^6.0.3",
  "wrangler": "^4.92.0"
}
```

---

## Building and Running

### Prerequisites

- **Node.js**: >= 22.12.0
- **npm**: >= 9.6.5

### Installation

```bash
# Install dependencies
npm install

# Configure local environment
# Create .dev.vars file with:
# SESSION_SECRET=your-32+-character-secret-key-here
# ENVIRONMENT=local

# Run local database migrations
npx wrangler d1 migrations apply kharon-portal --local
```

### Development

```bash
# Start local development server
npm run dev
```

### Build

```bash
# Compile site and purge unused CSS
npm run build
```

### Deployment

```bash
# Authenticate with Cloudflare
npm run auth:cloudflare

# Deploy to production
npm run deploy:cloudflare

# Deploy to preview
npm run deploy:cloudflare:preview
```

### Other Commands

| Command | Description |
|---------|-------------|
| `npm run lint` | ESLint check |
| `npm run preview` | Preview production build locally |
| `npm run audit:site` | Site audit script |
| `npm run portal:monitor` | Portal monitoring PowerShell script |
| `npm run portal:qa:roles` | Role-based QA check |

---

## Project Structure

```
kfs/
├── src/
│   ├── components/       # Astro components
│   │   ├── ui/           # Reusable UI (Button, Card, StatusIndicator)
│   │   ├── layout/       # Header, Footer
│   │   ├── sections/     # Page sections (Hero, ServiceGrid, etc.)
│   │   └── portal/       # Portal-specific components
│   ├── layouts/          # Astro layouts
│   ├── pages/            # Route definitions
│   │   ├── portal/       # Portal pages (admin, tech, client, finance)
│   │   └── *.astro       # Public pages
│   ├── middleware.ts     # Security middleware (auth, CSRF, RBAC)
│   ├── lib/              # Utility libraries
│   │   ├── server/       # Server-side utilities (auth, csrf, audit)
│   │   │   └── db/       # Repository layer (finance, job, user)
│   │   └── algorithms/   # Business logic (capacity, SLA)
│   ├── styles/           # Global CSS
│   ├── types/            # TypeScript types
│   └── assets/           # Static assets
├── public/               # Static files served directly
├── migrations/           # D1 database migrations
├── scripts/              # Build and deployment scripts
├── docs/                 # Documentation
├── tests/                # Playwright tests
├── memory/               # Project memory files
├── package.json
├── astro.config.ts
├── tsconfig.json
├── wrangler.jsonc
├── playwright.config.ts
└── schema.sql            # Database schema
```

---

## Development Conventions

### TypeScript Configuration

The project uses **strict TypeScript** with `exactOptionalPropertyTypes: true`. Key rules:

- All optional properties must explicitly handle `undefined`
- Use `??` instead of `typeof x !== "undefined" ? x : fallback`
- For database handles, declare `let db: IDBDatabase | null = null` outside try block
- Use `Astor.locals.user ?? null` for nullable user objects

### DOM Type Safety Helpers

**New in Sprint 1 (2026-05-30):** Use safe DOM query helpers from `src/lib/types/dom.ts` to avoid `as any` escapes:

```typescript
import { safeQuerySelector, safeQuerySelectorAll, safeJsonResponse } from '../../lib/types/dom';

// Instead of: const select = document.querySelector('#id') as HTMLSelectElement;
const select = safeQuerySelector<HTMLSelectElement>('#id');

// Instead of: const body = await response.json() as { ok?: boolean };
const body = await safeJsonResponse<{ ok?: boolean }>(response);

// Type guard for API responses
if (isApiResponse(body) && body.ok) {
  // Safe to access body.ok and body.message
}
```

**Available Helpers:**
- `safeQuerySelector<T>(selector, context?)` - Type-safe single element query
- `safeQuerySelectorAll<T>(selector, context?)` - Type-safe multi-element query
- `safeJsonResponse<T>(response)` - Safe JSON parsing with error handling
- `isApiResponse(data)` - Type guard for `{ ok: boolean; message?: string }`
- `addSafeEventListener(target, type, handler)` - Type-safe event listener

### IndexedDB Null-Safety Pattern

**Critical for Field Operations:** All IndexedDB functions must use null-safe declaration:

```typescript
// ✅ CORRECT - Field operations safe
let db: IDBDatabase | null = null;
try {
  db = await openDatabase();
  // ... operations
} catch (error) {
  // db is null here - safe to reference
  throw new DraftStorageError("Failed", error, "DB_OPEN_FAILED");
}

// ❌ WRONG - TypeScript error, runtime risk
let db: IDBDatabase;  // Could be undefined if openDatabase() throws
```

**Files Updated:** `sync-queue.ts` (7 functions), `draft-storage.ts` (9 functions)

### Repository Layer

New repository pattern for database access:
- `src/lib/server/db/finance-repository.ts` - Financial records
- `src/lib/server/db/job-repository.ts` - Job management
- `src/lib/server/db/user-repository.ts` - User operations

### Design Governance

**All UI/UX work is governed by `DESIGN_CONSTITUTION.md`** - the authoritative document for visual identity.

#### Design Principles

- **Industrial Command Intelligence**: Dark-themed, mission-critical infrastructure aesthetic
- **Technical Competence**: Clean, engineered aesthetics
- **Regulatory Authority**: Formal, compliance-oriented presentation
- **No Generic SaaS Templates**: Prohibited aesthetics include rounded pastel dashboards, playful illustrations

#### Design Tokens (Quick Reference)

```css
/* Brand Colors */
--color-kharon-purple: #4B2E83;  /* Primary action */
--color-kharon-blue: #1F4E79;    /* Hover states */
--color-kharon-black: #0B0D0F;   /* Headers, backgrounds */
--color-kharon-cyan: #00C2FF;    /* Highlights, focus */
--color-kharon-amber: #F59E0B;   /* Warnings */
--color-kharon-red: #C4332F;     /* Errors, critical */
--color-kharon-green: #16A34A;   /* Success, valid */

/* Typography */
--font-sans: "Inter", system-ui, sans-serif;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;

/* Spacing */
--header-height: 5rem;           /* 80px fixed header */
--touch-target: 44px;            /* Minimum WCAG */
```

#### UI Checklist (Required for PRs)

- [ ] Uses approved color tokens from DESIGN_CONSTITUTION.md
- [ ] Preserves letterhead/logo rules
- [ ] No generic SaaS/admin template visuals
- [ ] Accessible focus states (2px cyan, 4px offset)
- [ ] Mobile technician usability (44px touch targets)
- [ ] Public and portal visual unity
- [ ] Reduced-motion support (@media query)
- [ ] No horizontal overflow on mobile
- [ ] Keyboard navigation support
- [ ] ARIA labels where required

### Security Middleware

The middleware stack (`src/middleware.ts`) enforces:

1. **Setup**: CSP nonce, A/B testing variant cookies
2. **Security Headers**: CSP, X-Frame-Options, HSTS, etc.
3. **Authentication**: Session verification with HMAC-signed tokens
4. **CSRF Protection**: Per-user tokens with 12-hour duration
5. **Rate Limiting**: Per-endpoint sliding window limits
6. **RBAC**: Role-based access control (admin, tech, client, finance)

### Database Schema

Key entities in `schema.sql`:

- **users**: Authentication with MFA support, role-based access
- **clients/companies**: Client company records
- **sites**: Physical locations with GPS coordinates
- **systems**: Fire/security systems installed at sites
- **jobs**: Service jobs with scheduling and status tracking
- **job_cards**: Technician field reports with evidence
- **financial_records**: Invoices and payments (Sage integration)
- **audit_events**: Security and operational audit logging
- **portal_rate_limits**: Rate limiting state

---

## Corporate Compliance

- **B-BBEE Level**: Level 4 Contributor
- **SAQCC Certification**: FIRE-2024-0847
- **Company Registration**: 2016/313076/07
- **SANS Standards**: 10139 (Fire Detection), 14520 (Gas Suppression)

---

## Key Documentation

| Document | Purpose |
|----------|---------|
| `DESIGN_CONSTITUTION.md` | Authoritative design rules (20 sections, 1,400+ lines) |
| `docs/KHARON_DESIGN_SYSTEM_DOCUMENTATION.md` | Complete technical design reference |
| `docs/design-system.md` | Quick reference design summary |
| `docs/cloudflare-deployment.md` | Cloudflare deployment configuration |
| `docs/GLOBAL_INSTRUCTIONS.md` | Global development instructions |
| `docs/MASTER_ROADMAP.md` | Project roadmap |
| `README.md` | Project overview and quick start |
| `schema.sql` | Database schema definition |

---

## Memory System

Project memories are stored in `memory/` and indexed in `memory/MEMORY.md`. These contain:

- TypeScript hardening status and enforcement patterns
- Deployment status and verification results
- UI/UX standardization details
- Design system documentation references

---

## Common Gotchas

1. **TypeScript Strict Mode**: `exactOptionalPropertyTypes: true` means optional properties cannot implicitly accept `undefined`
2. **Design Governance**: No UI changes may be made without consulting `DESIGN_CONSTITUTION.md`
3. **Database Scoping**: Always declare database handles outside try blocks for catch block access
4. **Session Timeout**: 8-hour absolute timeout for session tokens
5. **CSRF Tokens**: 12-hour duration, per-user, must be verified for state-changing API calls
6. **Rate Limits**: Configured per-endpoint with sliding windows (e.g., 5 attempts/15min for login)

---

## Contact

- **Primary**: admin@kharon.co.za
- **Technical**: admin@kharon.co.za
