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

## 🚀 Development

### Prerequisites
- Node.js >= 22.12.0
- npm or yarn package manager

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Deployment
The site is configured for deployment to Cloudflare Pages with automatic builds from the main branch.

## 📄 License

This project contains proprietary code for Kharon Fire and Security Solutions. Distribution is prohibited without explicit written consent.