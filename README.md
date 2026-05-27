# Kharon Fire and Security Solutions

Comprehensive fire protection and security solutions portal for South African commercial/industrial applications. Built with Astro, deployed on Cloudflare Pages with D1 database and R2 storage.

## 🚀 Features

### Public Website
- Responsive design optimized for South African market
- Comprehensive service pages (Gas Suppression, Fire Detection, Security Systems)
- Emergency support and compliance information
- SEO optimized with proper meta tags and structured data
- Accessibility features including skip links and ARIA labels
- Premium card-based layouts for enhanced user experience

### Field Service Management (FSM) Portal
- Role-based access control (admin, tech, client, finance)
- Job dispatch and scheduling system with priority triaging
- Technician field reporting with GPS tracking and offline-resilient draft saving
- Client compliance dashboard for real-time risk/certificate monitoring
- Financial workflow integration with Sage (manual control register)
- Document management with R2 storage
- Modernized dashboards with consistent card components and robust search/pagination

### Security & Compliance
- POPIA-compliant data handling
- Multi-factor authentication (MFA)
- Session management with CSRF protection
- Rate limiting and IP-based security
- Audit logging for all actions
- South African regulatory compliance (SANS standards)
- Enhanced honeypot security with inline styling

### Performance & Optimization
- Server-side rendering (SSR) with Astro
- CSS purging for minimal bundle sizes
- Image optimization with WebP fallbacks
- Animation optimization with Intersection Observer
- Print-optimized stylesheets for compliance documents
- Mobile-first responsive design
- CPU-efficient animations that pause when off-screen

## 🛠 Tech Stack

- **Framework**: Astro v6.3.3 with SSR
- **Styling**: TailwindCSS v4 with custom components
- **Deployment**: Cloudflare Pages with D1 database and R2 storage
- **Authentication**: Custom session management with CSRF protection
- **Forms**: Anti-spam with honeypot fields and rate limiting
- **Analytics**: POPIA-compliant (Plausible/Fathom) - public pages only

## 📊 Corporate Compliance

- **B-BBEE Level**: Level 4 Contributor
- **SAQCC Certification**: FIRE-2024-0847
- **Company Registration**: 2016/313076/07
- **PAIA Manual**: Available for public access
- **SANS Standards**: 10139 (Fire Detection), 14520 (Gas Suppression)

## 🎨 UI and Design Governance

**All UI/UX work is governed by `DESIGN_CONSTITUTION.md`** - the authoritative document for visual identity, design tokens, and component standards.

### Design Authority
- **Constitution**: `DESIGN_CONSTITUTION.md` (20 sections, 1,400+ lines)
- **Design System**: `KHARON_DESIGN_SYSTEM_DOCUMENTATION.md` (complete technical reference)
- **Summary**: `docs/design-system.md` (quick reference)

### Key Governance Principles
- All UI changes must follow `DESIGN_CONSTITUTION.md` guidelines
- No new color, font, or card system may be introduced without updating the constitution
- The design target is **Industrial Command Intelligence** - mission-critical infrastructure software with enterprise fire and suppression intelligence
- Generic SaaS/admin-template styling is prohibited to maintain the premium field service operations technology appearance
- Public site and portal must remain visually unified to ensure consistent brand experience
- The verified Kharon letterhead must stay top-left as the primary brand anchor
- Standalone logo may be used as low-opacity environmental 3D background mark without competing with the letterhead
- Brand colors (black, purple, blue, grey, cyan, amber, red, green) must be preserved in all implementations

### Pull Request Requirements
All PRs must pass the UI checklist in `.github/pull_request_template.md`:
- [ ] Uses approved design tokens from DESIGN_CONSTITUTION.md
- [ ] Preserves letterhead/logo rules
- [ ] No generic SaaS/admin template visuals
- [ ] Accessible focus states (2px cyan, 4px offset)
- [ ] Mobile technician usability (44px touch targets)
- [ ] Public and portal visual unity
- [ ] Reduced-motion support (@media query)
- [ ] No horizontal overflow on mobile
- [ ] Keyboard navigation support
- [ ] ARIA labels where required

### Design Tokens (Quick Reference)
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

## 🚀 Development

### Prerequisites
- Node.js >= 22.12.0
- npm or yarn package manager

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure local environment variables: Create a `.dev.vars` file in the root directory:
   ```env
   SESSION_SECRET=your-32+-character-secret-key-here
   ENVIRONMENT=local
   ```
3. Run local database migrations:
   ```bash
   npx wrangler d1 migrations apply kharon-portal --local
   ```

### Development
Start the local development server:
```bash
npm run dev
```

### Build
Compile the site and purge unused CSS:
```bash
npm run build
```

### Deployment
The site is configured for deployment to Cloudflare Pages with automatic builds from the main branch.

## 📄 License

This project contains proprietary code for Kharon Fire and Security Solutions. Distribution is prohibited without explicit written consent.