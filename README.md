# Kharon Fire and Security Solutions

Comprehensive fire protection and security solutions portal for South African commercial/industrial applications. Built with Astro, deployed on Cloudflare Pages with D1 database and R2 storage.

## 🚀 Features

### Public Website
- Responsive design optimized for South African market
- Comprehensive service pages (Gas Suppression, Fire Detection, Security Systems)
- Emergency support and compliance information
- SEO optimized with proper meta tags and structured data
- Accessibility features including skip links and ARIA labels

### Field Service Management (FSM) Portal
- Role-based access control (admin, tech, client, finance)
- Job dispatch and scheduling system
- Technician field reporting with GPS tracking
- Client dashboard for compliance monitoring
- Financial workflow integration with Sage
- Document management with R2 storage

### Security & Compliance
- POPIA-compliant data handling
- Multi-factor authentication (MFA)
- Session management with CSRF protection
- Rate limiting and IP-based security
- Forensic audit logging and error telemetry
- South African regulatory compliance (SANS standards)
- Zero-tolerance type safety across backend middleware

### Performance & Optimization
- Server-side rendering (SSR) with Astro
- CSS purging for minimal bundle sizes
- Image optimization with WebP fallbacks
- Animation optimization with Intersection Observer
- Print-optimized stylesheets
- Mobile-first responsive design
- IndexedDB offline telemetry queue with exponential backoff

## 🛠 Tech Stack

- **Framework**: Astro v6.3.3 with SSR
- **Styling**: TailwindCSS v4 with custom components
- **Deployment**: Cloudflare Pages with D1 database and R2 storage
- **Authentication**: Custom session management with CSRF protection
- **Forms**: Anti-spam with honeypot fields and rate limiting
- **Analytics**: POPIA-compliant (Plausible/Fathom)

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