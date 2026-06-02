# Kharon Fire and Security Solutions: Core Product Guidelines

## 1. Product Vision & Brand Philosophy
The digital platform for Kharon Fire and Security Solutions (KFS) is a mission-critical system. Our users—from field technicians servicing gas suppression systems in server rooms to financial controllers managing enterprise accounts—rely on this platform to ensure the safety, compliance, and operational continuity of critical global infrastructure.

**The Core Tenets of the Kharon Brand:**
- **Reliability is Non-Negotiable:** If the system is down, life-safety and fire suppression infrastructure is at risk.
- **Offline-First Reality:** Connectivity is a luxury, not a guarantee. The system must adapt to the field technician's environment (e.g., deep basements, remote radio towers), not the other way around.
- **Frictionless Compliance:** Industry compliance (SANS, POPIA, PAIA) should be an automated byproduct of doing the work correctly, not an administrative burden.

## 2. UI/UX & Design Principles
The interface must reflect the serious, authoritative nature of Kharon Fire and Security Solutions.

- **Visual Hierarchy & Status:**
  - Use color strictly for state and status indication.
  - Red/Amber/Green must be reserved exclusively for System Status, SLA Countdowns, and Compliance Heatmaps.
  - The general UI should be neutral (dark modes optimized for control rooms, high-contrast light modes for field visibility).
- **Information Density:** Public and Portal interfaces require high data density. Avoid excessive whitespace; use compact section padding (2.5rem mobile / 4.5rem desktop) and tight component grouping to maintain an authoritative, command-center feel.
- **Layout:** Maintain a hub-and-spoke navigation model for complex service offerings, ensuring a central "Command Matrix" (Solutions Hub) links to deep technical specifications.
- **Technician Portal (Mobile-First):** Tap targets must be large (minimum 44x44px) to accommodate gloved hands. Contrast must account for glare from direct sunlight or poor lighting in utility basements. Forms must support auto-save immediately upon input.

## 3. Engineering & Architecture Standards
To maintain our edge-optimized, serverless architecture, all development for Kharon Fire and Security Solutions must adhere to the following constraints:

- **The Edge Mandate:** All backend logic must execute on Cloudflare Pages/Workers. Cold starts must remain under 50ms.
- **Strict Type Safety:** End-to-end type safety is required. Database schemas (Cloudflare D1/Drizzle ORM), API payloads, and frontend props (Astro/React) must share a single source of truth to prevent runtime data corruption.
- **Offline Mutations & Sync:**
  - No mobile feature can assume a persistent connection.
  - All POST/PUT/DELETE requests from the Tech Portal must pass through the offline background sync architecture.
  - Conflict resolution must favor the most recent field data, while preserving an audit trail of overwritten records.

## 4. Security & Data Governance Mandate
Kharon Fire and Security Solutions handles sensitive infrastructural and financial data. Security must be implemented at every layer.

- **Zero-Trust Access:**
  - Role-Based Access Control (RBAC) must be validated on every API route, not just the frontend UI.
  - Multi-Factor Authentication (MFA) is mandatory for Admin and Finance roles.
- **Immutable Audit Trails:** Any state change regarding job status, fire system compliance, or financial records must generate an immutable log entry containing the User ID, Timestamp, and IP context.
- **Idempotency:** All financial webhook handlers (Sage ERP) and job card submissions must utilize idempotency keys to prevent duplicate transactions caused by network retries.
- **Data Privacy:** PII (Personally Identifiable Information) must be pruned according to automated data retention schedules to maintain POPIA/PAIA compliance.

## 5. Algorithmic & Automation Rules
When extending Kharon's intelligent algorithms, adhere to these rules:

- **SLA Precedence:** Urgent and Critical severity flags absolutely override geographical optimization. A technician must be routed to a critical fire system failure even if it breaks a geographically optimized cluster of planned maintenance.
- **Financial Synchronicity:** The gap between operational completion and financial invoicing must be zero. Automated PDF generation (Job Cards, Service Certificates) and Sage ERP payloads must trigger synchronously upon the technician's digital signature.

## 6. Brand Voice & Tone
- **Authoritative & Assuring:** Communicate with clarity, precision, and authority. Kharon is the guardian of critical infrastructure. Avoid playful, colloquial, or ambiguous language.
- **Action-Oriented:** Error messages and alerts must clearly state what went wrong and provide the immediate next step to resolve it (e.g., “Sync Failed: Local draft saved. Move to an area with cellular reception to retry.” instead of “Oops, something went wrong.”).