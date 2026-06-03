# Kharon Guardian System: Comprehensive Product Guide

## 1. Executive Summary
The Kharon Guardian System is an enterprise-grade, full-stack infrastructure and security management platform. Designed for mission-critical sectors, it provides end-to-end operational oversight, from intelligent technician dispatching and offline-capable job logging to deep financial integration and stringent compliance tracking. Built on a modern serverless edge architecture, the platform guarantees high availability, rapid response times, and robust security for both clients and internal operations teams.

## 2. Core Sectors & Services
Kharon is purpose-built to service and protect critical infrastructure across high-stakes industries.

**Target Sectors:**
- Control Rooms & Server Racks (Data Centers)
- Factories & Warehouses (Industrial)
- Healthcare Facilities
- Power Grids & Switchgear
- Radio & Telecommunication Towers

**Core Services:**
- Fire Detection & Suppression: (Including Gas Suppression systems)
- Security Systems: CCTV and Access Control
- Engineering Support: Emergency response and planned maintenance

## 3. Platform Architecture & Tech Stack
The platform utilizes a cutting-edge, edge-optimized technology stack to ensure global performance, offline resilience, and strict type safety.
- **Frontend Framework:** Astro (with React/UI components)
- **Styling:** Tailwind CSS (implied via modern Astro UI patterns)
- **Backend & API:** Cloudflare Pages (Serverless Functions)
- **Database:** Cloudflare D1 (Distributed SQLite) with Drizzle ORM
- **File Storage:** Cloudflare R2 (Object Storage for evidence files and PDFs)
- **Architecture:** Hub-and-spoke Solutions landing page with specialized technical detail pages.
- **Offline Capabilities:** Service Workers (sw.ts), IndexedDB Draft Storage, and Background Sync Queues.
- **Document Generation:** Automated PDF generation for Invoices, Certificates, and Job Cards.

## 4. Role-Based Portals
The system is divided into four distinct, secure portals tailored to specific user workflows.

### 4.1. Admin Portal (/portal/admin)
The central command center for Kharon operations.
- **Dashboard & Advanced Reporting:** High-level metrics, system health, and data exports.
- **Dispatch & Planning:** Centralized job allocation using SLA and capacity-balancing algorithms.
- **HR & Staff Management:** Technician profiles, skills tracking, and system access.
- **Audit & Compliance:** Oversight of PAIA/POPIA compliance, SANS Reference matrices, and system audit logs.
- **Multi-Client Management:** Global view of all client sites, systems, and active maintenance requests.

### 4.2. Client Portal (/portal/client)
A self-service hub for Kharon's customers.
- **Dashboard:** Real-time overview of site statuses and active jobs.
- **Maintenance Requests:** Direct system to log urgent or planned maintenance tickets.
- **Quotes & Approvals:** Review and digitally approve service quotes.
- **Compliance Dashboard & Heatmap:** Visual indicators of site compliance and upcoming service intervals.
- **Asset Management:** View installed systems and site access control logs.

### 4.3. Technician (Tech) Portal (/portal/tech)
A mobile-first, offline-ready application for field engineers.
- **Job Management:** View assigned schedules, job details, and site access instructions.
- **Visit Logging & Job Cards:** Log time, checklist parts, and submit digital job cards.
- **Defect Reporting:** Capture and upload photographic evidence of system defects.
- **Offline Sync:** Technicians can operate in areas with no cellular reception (e.g., basements, remote towers). Data is stored locally and automatically synced via the sync-queue when connectivity is restored.

### 4.4. Finance Portal (/portal/finance)
Dedicated financial workflow management with deep ERP integration.
- **Sage Integration:** Native OAuth integration, two-way sync, and webhook handling for Sage Accounting.
- **Ledger & Records:** Track payments, credit notes, and invoice statuses.
- **Task Pipeline:** Automated financial task routing and exception handling panels.

## 5. Intelligent Algorithms & Automation
Kharon goes beyond basic CRUD operations by implementing smart backend algorithms:
- **Capacity Balancing (capacity-balancing.ts):** Automatically distributes workload among technicians based on skills, availability, and geographical routing.
- **SLA Management (sla-algorithm.ts):** Prioritizes urgent/critical severity tasks and ensures compliance with client Service Level Agreements.
- **Automated Document Generation:** Instantly generates compliant PDF Certificates of Service, Job Cards, and Invoices upon job completion.

## 6. Security, Compliance & Data Governance
Security is baked into the foundation of the Kharon platform.
- **Authentication:** Multi-Factor Authentication (MFA), password reset tokenization, and strict session revocation.
- **API Security:** CSRF protection, strict rate limiting, and idempotency keys to prevent duplicate transaction submissions.
- **Data Retention & Privacy:** Automated cron jobs for data retention pruning, ensuring compliance with POPIA and PAIA regulations.
- **Telemetry & Hardening:** Built-in error telemetry, security hardening audits, and offline mutation tracking to prevent data corruption.

## 7. System Assessment & Analysis
**Strengths**
- **Offline-First Field Ops:** The inclusion of draft-storage.ts and sync-queue.ts is a massive operational advantage for field technicians working in infrastructure environments with poor connectivity.
- **Edge-Native Architecture:** Utilizing Cloudflare Pages and D1 ensures ultra-low latency, reduced server costs, and inherent DDoS protection.
- **ERP Cohesion:** The dedicated Sage webhooks, OAuth handlers, and sync services prevent financial bottlenecks and ensure invoicing occurs immediately after a job card is signed off.
- **Granular Data Model:** The migration history reveals a highly mature schema (managing jobs, checklists, defects, MFA, rate limits, and site access), indicating a system built for enterprise scale.

**Areas for Future Roadmap Consideration**
- **Predictive Maintenance:** With the amount of defect and telemetry data being gathered, implementing AI/ML models to predict component failures (e.g., gas suppression pressure drops) before they occur would be a natural next step.
- **Inventory/Fleet Tracking:** While parts.ts exists, integrating real-time geolocation of technician vehicles and van-stock inventory could further enhance the capacity-balancing.ts algorithm.
- **Client Notifications:** Expanding the webhook system to push real-time SMS/WhatsApp updates to clients during critical severity incidents.

## Conclusion
The Kharon Guardian System represents a highly sophisticated, robustly engineered platform. It effectively bridges the gap between complex field engineering tasks and back-office administrative/financial oversight, wrapped in a secure, modern tech stack.