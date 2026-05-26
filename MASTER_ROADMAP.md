# Kharon Portal - Master Roadmap

## Phase 0: Release Freeze & Safety Reset (CURRENT - BLOCKED BY PRODUCTION SIGN-OFF)
- [ ] Rotate all temporary role credentials
- [ ] Require unique user accounts (not shared)
- [ ] Require MFA for admin and finance roles
- [ ] Confirm D1/R2 backup procedures
- [ ] Confirm all secrets in Cloudflare (not in code)
- [ ] Add staging banner to portal.tequit.co.za

## Phase 1: Foundation & Core Infrastructure (COMPLETED)
- [x] Astro v6.3.3 setup with SSR output
- [x] Cloudflare Pages deployment configuration
- [x] D1 database schema implementation (20+ tables)
- [x] User authentication and role management
- [x] Session management with CSRF protection
- [x] Rate limiting and basic security measures
- [x] Core portal functionality (admin, tech, client, finance roles)

## Phase 2: Public Website Development (COMPLETED - NEEDS COPY CORRECTIONS)
- [x] Landing page and service pages implementation
- [x] Responsive design for mobile/desktop
- [x] SEO optimization with meta tags and structured data
- [x] Accessibility features (skip links, ARIA labels)
- [x] Contact forms with spam protection
- [x] Compliance pages (SANS standards, emergency support)
- [ ] Remove stale "default email client" copy from contact pages
- [ ] Rename "Assessment Intake" to "Request a Site Assessment"
- [ ] Fix text encoding issues (e.g., 2000m² instead of 2000mï¿½2)

## Phase 3: Portal Core Features (COMPLETED - NEEDS FINANCE REFACTOR)
- [x] Job dispatch and scheduling system
- [x] Technician field reporting
- [x] Client dashboard for site access
- [x] Document management with R2 storage
- [x] Audit logging for compliance
- [x] MFA implementation (completed - was marked as incomplete)
- [x] Password reset functionality (completed - was marked as incomplete)
- [ ] Refactor finance to be Sage-first (convert portal invoices to finance tasks)

## Phase 4: Security & Compliance Hardening (COMPLETED)
- [x] MFA implementation
- [x] Enhanced session management
- [x] POPIA compliance measures
- [x] SAQCC certification display
- [x] B-BBEE compliance information
- [x] PAIA manual publication

## Phase 5: UI/UX & Performance Optimization (COMPLETED)
- [x] Premium card-based layouts for system pages
- [x] Animation optimization with Intersection Observer
- [x] Honeypot security hardening
- [x] Print stylesheet implementation
- [x] WebP image optimization
- [x] SVG accessibility improvements
- [x] Corporate trust signals in footer
- [x] POPIA-compliant analytics

## Phase 6: Advanced Portal Features (COMPLETED)
- [x] Offline PWA capabilities for field technicians
- [x] Route optimization for job dispatch
- [x] Parts inventory management
- [x] Automated defect escalation
- [x] Calendar view for dispatch scheduling
- [x] Bulk operations for job assignment

## Phase 7: Finance Integration (PARTIALLY COMPLETED - CRITICAL GAP)
- [x] Manual Sage entry with portal tracking
- [x] Quote → Invoice → Payment workflow
- [x] VAT handling with separate amounts stored
- [x] Credit note tracking with self-referential structure
- [ ] **CRITICAL**: Refactor to Sage-first model (portal creates finance tasks, not official records)
- [ ] **CRITICAL**: Remove invoice creation from jobcard submission
- [ ] **CRITICAL**: Remove quote-to-invoice conversion on approval
- [ ] **CRITICAL**: Update payment handling to track Sage references only

## Phase 8: Advanced Compliance & Reporting (COMPLETED)
- [x] Certificate PDF generation
- [x] Automated compliance reporting
- [x] Defect classification system
- [x] SLA tracking and alerts
- [x] Advanced audit analytics

## Phase 9: Portal UX Refactor (NEEDS IMPLEMENTATION)
- [ ] Split admin operations into separate pages (currently overloaded)
- [ ] Add search/filter/pagination to all admin views
- [ ] Add import preview/dry-run functionality
- [ ] Add admin dashboard priority queues
- [ ] Add compliance dashboard link to client navigation
- [ ] Add technician draft autosave and upload retry model
- [ ] Add client compliance summary view

## Phase 10: Enterprise Features (PLANNED)
- [ ] Multi-client management
- [ ] Advanced reporting dashboard
- [ ] API for third-party integrations
- [ ] Mobile app for field technicians
- [ ] Predictive maintenance algorithms

## Phase 11: Continuous Improvement (ONGOING)
- [x] Performance monitoring and optimization (Health API implemented with D1/R2 checks)
- [ ] User feedback integration
- [ ] A/B testing for UX improvements
- [ ] Regular security audits
- [ ] Compliance updates for regulatory changes

## Production Approval Gates (BLOCKERS)
- [ ] Director sign-off for kharon.co.za cutover
- [ ] Credential rotation and MFA enforcement
- [ ] Sage-first finance model implementation
- [ ] Admin UX density improvements
- [ ] Public copy corrections
- [ ] POPIA compliance documentation
- [ ] Security audit completion