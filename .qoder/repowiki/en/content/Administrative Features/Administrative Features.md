# Administrative Features

<cite>
**Referenced Files in This Document**
- [admin.js](file://src/lib/server/admin.js)
- [audit.js](file://src/lib/server/audit.js)
- [dashboard.astro](file://src/pages/portal/admin/dashboard.astro)
- [operations.astro](file://src/pages/portal/admin/operations.astro)
- [planning.astro](file://src/pages/portal/admin/planning.astro)
- [audit.astro](file://src/pages/portal/admin/audit.astro)
- [users.js](file://src/pages/portal/api/admin/users.js)
- [sites.js](file://src/pages/portal/api/admin/sites.js)
- [systems.js](file://src/pages/portal/api/admin/systems.js)
- [jobs.js](file://src/pages/portal/api/admin/jobs.js)
- [maintenance-requests.js](file://src/pages/portal/api/admin/maintenance-requests.js)
- [export.js](file://src/pages/portal/api/admin/export.js)
- [schema.sql](file://schema.sql)
- [document_access_logs.sql](file://migrations/0008_document_access_logs.sql)
- [revoked_sessions.sql](file://migrations/0009_revoked_sessions.sql)
- [client_site_access.sql](file://migrations/0012_client_site_access.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes the administrative features of the portal, focusing on comprehensive management and oversight capabilities. It covers the admin dashboard, operations monitoring, audit logging, and strategic planning tools. It also documents the user management system, system administration interfaces, compliance reporting features, audit trail functionality, compliance tracking, operational metrics collection, administrative workflows for user provisioning, system configuration, and policy management. Practical examples of administrative tasks, reporting dashboards, compliance monitoring, and system maintenance procedures are included, along with administrative security measures, audit requirements, and operational excellence frameworks.

## Project Structure
The administrative surface is organized around four primary admin views and supporting server-side APIs:
- Admin Dashboard: Operational overview and quick actions
- Operations: CRUD for users, sites, systems, jobs, and data import/export
- Planning: Dispatch load, lifecycle due calendar, and open requests
- Audit Console: Read-only audit event browsing and filtering

```mermaid
graph TB
subgraph "Admin Views"
D["Dashboard<br/>dashboard.astro"]
O["Operations<br/>operations.astro"]
P["Planning<br/>planning.astro"]
A["Audit Console<br/>audit.astro"]
end
subgraph "Admin APIs"
U["Users API<br/>users.js"]
S["Sites API<br/>sites.js"]
Sys["Systems API<br/>systems.js"]
J["Jobs API<br/>jobs.js"]
MR["Maintenance Requests API<br/>maintenance-requests.js"]
EXP["Export API<br/>export.js"]
end
subgraph "Shared Admin Utilities"
ADM["Admin Utilities<br/>admin.js"]
AUD["Audit Utility<br/>audit.js"]
end
D --> U
D --> S
D --> Sys
D --> J
D --> MR
O --> U
O --> S
O --> Sys
O --> J
P --> J
P --> Sys
P --> MR
A --> AUD
U --> ADM
S --> ADM
Sys --> ADM
J --> ADM
MR --> ADM
EXP --> ADM
AUD --> ADM
```

**Diagram sources**
- [dashboard.astro](file://src/pages/portal/admin/dashboard.astro)
- [operations.astro](file://src/pages/portal/admin/operations.astro)
- [planning.astro](file://src/pages/portal/admin/planning.astro)
- [audit.astro](file://src/pages/portal/admin/audit.astro)
- [users.js](file://src/pages/portal/api/admin/users.js)
- [sites.js](file://src/pages/portal/api/admin/sites.js)
- [systems.js](file://src/pages/portal/api/admin/systems.js)
- [jobs.js](file://src/pages/portal/api/admin/jobs.js)
- [maintenance-requests.js](file://src/pages/portal/api/admin/maintenance-requests.js)
- [export.js](file://src/pages/portal/api/admin/export.js)
- [admin.js](file://src/lib/server/admin.js)
- [audit.js](file://src/lib/server/audit.js)

**Section sources**
- [dashboard.astro](file://src/pages/portal/admin/dashboard.astro)
- [operations.astro](file://src/pages/portal/admin/operations.astro)
- [planning.astro](file://src/pages/portal/admin/planning.astro)
- [audit.astro](file://src/pages/portal/admin/audit.astro)

## Core Components
- Admin utilities: Input sanitization and validation helpers used across admin APIs
- Audit utility: Centralized event recording with fingerprinting and metadata
- Admin APIs: CRUD endpoints for users, sites, systems, jobs, maintenance requests, and exports
- Admin views: Interactive dashboards for operations, planning, and audit

Key responsibilities:
- Enforce admin-only access for privileged operations
- Validate and sanitize inputs consistently
- Record audit events for all administrative actions
- Provide filtered, paginated audit consoles
- Support bulk import/export for operational data

**Section sources**
- [admin.js](file://src/lib/server/admin.js)
- [audit.js](file://src/lib/server/audit.js)
- [users.js](file://src/pages/portal/api/admin/users.js)
- [sites.js](file://src/pages/portal/api/admin/sites.js)
- [systems.js](file://src/pages/portal/api/admin/systems.js)
- [jobs.js](file://src/pages/portal/api/admin/jobs.js)
- [maintenance-requests.js](file://src/pages/portal/api/admin/maintenance-requests.js)
- [export.js](file://src/pages/portal/api/admin/export.js)

## Architecture Overview
Administrative workflows follow a consistent pattern:
- UI renders admin panels and forms
- Client submits JSON payloads via POST endpoints
- Server validates inputs, enforces admin-only access, performs updates
- Audit events are recorded for traceability
- Responses include structured results and optional CSV exports

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant API as "Admin API Endpoint"
participant DB as "Database"
participant Audit as "Audit Utility"
Admin->>API : "POST { action, ...payload }"
API->>API : "requireAdmin(user)"
API->>API : "clean* validators"
API->>DB : "INSERT/UPDATE/DELETE"
DB-->>API : "OK"
API->>Audit : "auditEvent(db, request, options)"
Audit->>DB : "INSERT INTO audit_events"
DB-->>Audit : "OK"
API-->>Admin : "{ ok, id, ... }"
```

**Diagram sources**
- [users.js](file://src/pages/portal/api/admin/users.js)
- [sites.js](file://src/pages/portal/api/admin/sites.js)
- [systems.js](file://src/pages/portal/api/admin/systems.js)
- [jobs.js](file://src/pages/portal/api/admin/jobs.js)
- [maintenance-requests.js](file://src/pages/portal/api/admin/maintenance-requests.js)
- [audit.js](file://src/lib/server/audit.js)

## Detailed Component Analysis

### Admin Dashboard
The dashboard aggregates operational KPIs and recent activity to support dispatch and lifecycle oversight.

Key features:
- Quick stats: active jobs, unassigned jobs, overdue systems, open requests, missing documentation
- Recent lists: completed works, active dispatches, lifecycle due dates
- Exception queues: overdue systems, missing documentation, finance follow-up
- Inline actions: mark jobs as invoiced, update maintenance request status, schedule dispatches

```mermaid
flowchart TD
Start(["Load Dashboard"]) --> Queries["Run batched SQL queries"]
Queries --> Stats["Compute KPIs"]
Stats --> Lists["Fetch recent lists"]
Lists --> Render["Render widgets and cards"]
Render --> Actions["Attach JS handlers for inline actions"]
Actions --> End(["Ready"])
```

**Diagram sources**
- [dashboard.astro](file://src/pages/portal/admin/dashboard.astro)

Practical examples:
- Mark a completed job as invoiced from the “Completed works” list
- Update a maintenance request’s status from the “Client request queue”
- Schedule a dispatch from a request, selecting system, technician, and date

**Section sources**
- [dashboard.astro](file://src/pages/portal/admin/dashboard.astro)

### Operations Management
The operations view centralizes administrative CRUD for users, sites, systems, jobs, and data import/export.

Key features:
- Users: create/update users, issue password reset links, reset MFA for admin/finance
- Sites: create/update sites
- Systems: create/update systems with lifecycle fields
- Jobs: create/update jobs, set status, assign technicians
- Data: export users/sites/systems; import sites/systems via CSV
- Client site access: grant/revoke additional access for client users

```mermaid
sequenceDiagram
participant UI as "Operations UI"
participant API as "Admin API"
participant DB as "Database"
participant Aud as "Audit"
UI->>API : "POST /portal/api/admin/users { action : create, ... }"
API->>DB : "INSERT INTO users"
API->>Aud : "auditEvent(..., { eventType : 'admin.user.create' })"
Aud->>DB : "INSERT INTO audit_events"
DB-->>API : "OK"
API-->>UI : "{ ok, id }"
```

**Diagram sources**
- [operations.astro](file://src/pages/portal/admin/operations.astro)
- [users.js](file://src/pages/portal/api/admin/users.js)
- [audit.js](file://src/lib/server/audit.js)

Practical examples:
- Provision a new technician user and require MFA
- Bulk import systems from a CSV with exact column headers
- Grant a client user access to an additional site

**Section sources**
- [operations.astro](file://src/pages/portal/admin/operations.astro)
- [users.js](file://src/pages/portal/api/admin/users.js)
- [sites.js](file://src/pages/portal/api/admin/sites.js)
- [systems.js](file://src/pages/portal/api/admin/systems.js)
- [jobs.js](file://src/pages/portal/api/admin/jobs.js)
- [maintenance-requests.js](file://src/pages/portal/api/admin/maintenance-requests.js)
- [export.js](file://src/pages/portal/api/admin/export.js)

### Strategic Planning
The planning view supports dispatch load balancing, lifecycle due calendar, and prioritization of open client requests.

Key features:
- Management KPIs: scheduled, in-progress, overdue, due soon, critical requests, unassigned jobs
- Dispatch planner: filterable list of active jobs
- Technician load: capacity snapshot per technician
- Lifecycle due calendar: risk classification for upcoming due dates
- Open client requests: priority-driven review queue

```mermaid
flowchart TD
LoadPlan["Load Planning Data"] --> Aggregates["Aggregate counts across jobs/systems/requests"]
Aggregates --> Lists["Fetch lists (dispatch, tech load, lifecycle, requests)"]
Lists --> Filter["Client-side filters for dispatch and lifecycle"]
Filter --> Display["Render cards and summaries"]
```

**Diagram sources**
- [planning.astro](file://src/pages/portal/admin/planning.astro)

Practical examples:
- Review overdue systems and plan remediation
- Balance technician loads before scheduling new jobs
- Prioritize critical maintenance requests

**Section sources**
- [planning.astro](file://src/pages/portal/admin/planning.astro)

### Audit Console
The audit console provides a read-only view of security and operational events with filtering and export capabilities.

Key features:
- Filter by category (auth, admin, finance, job, security, document), outcome, and date range
- Export filtered events to CSV
- Display event type, entity, outcome, actor, and metadata preview

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant View as "Audit View"
participant DB as "Database"
Admin->>View : "GET /portal/admin/audit?category=admin&from=...&to=..."
View->>DB : "SELECT audit_events with WHERE conditions"
DB-->>View : "Events (LIMIT 100)"
View-->>Admin : "Render list + Export link"
```

**Diagram sources**
- [audit.astro](file://src/pages/portal/admin/audit.astro)
- [audit.js](file://src/lib/server/audit.js)

Practical examples:
- Investigate repeated failed logins (auth failures)
- Track all admin-initiated user updates
- Export monthly compliance events for retention

**Section sources**
- [audit.astro](file://src/pages/portal/admin/audit.astro)

### Admin Utilities and Validation
Reusable utilities ensure consistent input handling and security across admin endpoints.

Highlights:
- requireAdmin: enforce admin-only access
- readJson: safe JSON parsing with defaults
- cleanText/cleanId/cleanEmail/cleanDate/cleanChoice/cleanBoolean/cleanInt: strict validation with configurable bounds and defaults

```mermaid
flowchart TD
Input["Raw request body"] --> Clean["Cleaners validate and normalize"]
Clean --> Valid{"Valid?"}
Valid --> |Yes| Persist["Persist to DB"]
Valid --> |No| Error["badRequest(error.message)"]
```

**Diagram sources**
- [admin.js](file://src/lib/server/admin.js)

**Section sources**
- [admin.js](file://src/lib/server/admin.js)

### Audit Utility
Centralized audit event recording captures actor, event type, entity, outcome, IP hash, user agent, and metadata.

```mermaid
sequenceDiagram
participant API as "Admin API"
participant AUD as "auditEvent"
participant DB as "Database"
API->>AUD : "auditEvent(db, request, { eventType, entityType, entityId, outcome, metadata })"
AUD->>AUD : "requestFingerprint(request)"
AUD->>DB : "INSERT INTO audit_events"
DB-->>AUD : "OK"
AUD-->>API : "void"
```

**Diagram sources**
- [audit.js](file://src/lib/server/audit.js)

**Section sources**
- [audit.js](file://src/lib/server/audit.js)

### Data Model Overview
The administrative features operate over a normalized schema with strong referential integrity and indexes optimized for admin queries.

```mermaid
erDiagram
USERS {
text id PK
text name
text email
text password_hash
text role
text site_id FK
int is_active
int force_password_change
int mfa_required
int mfa_enabled
text mfa_secret_encrypted
text mfa_enabled_at
text password_changed_at
text last_login_at
text created_at
text updated_at
}
SITES {
text id PK
text owner_company_name
text physical_address
text site_contact_person
text site_contact_email
text site_contact_phone
text billing_emails
text created_at
text updated_at
}
SYSTEMS {
text id PK
text site_id FK
text system_type
text coverage_area
text manufacturer
text model_reference
int service_interval_months
text last_service_date
text last_checked_at
text next_due_date
text created_at
text updated_at
}
JOBS {
text id PK
text system_id FK
text assigned_technician_id FK
text scheduled_date
text status
text job_type
text site_notes
text tech_comments
text documentation_path
text completed_at
text created_at
text updated_at
}
MAINTENANCE_REQUESTS {
text id PK
text site_id FK
text system_id FK
text requester_user_id FK
text request_type
text priority
text status
text subject
text message
text linked_job_id FK
text created_at
text updated_at
}
CLIENT_SITE_ACCESS {
text user_id PK,FK
text site_id PK,FK
text access_level
text granted_by_user_id FK
text granted_at
}
FINANCIAL_RECORDS {
text id PK
text site_id FK
text job_id FK
numeric amount
text item_type
text payment_status
text distribution_date
text reference
text created_at
text updated_at
}
AUDIT_EVENTS {
text id PK
text actor_user_id FK
text actor_role
text event_type
text entity_type
text entity_id
text outcome
text ip_hash
text user_agent
text metadata_json
text created_at
}
JOB_EVIDENCE_FILES {
text id PK
text job_id FK
text system_id FK
text uploaded_by_user_id FK
text evidence_type
text storage_path
text content_type
int file_size_bytes
text caption
text created_at
}
DOCUMENT_ACCESS_LOGS {
text id PK
text actor_user_id FK
text actor_role
text site_id FK
text storage_path
text document_type
text outcome
text ip_hash
text user_agent
text reason
text created_at
}
PASSWORD_RESET_TOKENS {
text id PK
text user_id FK
text token_hash
text expires_at
text used_at
text created_by_user_id FK
text created_at
}
REVOKED_SESSIONS {
text fingerprint PK
int expires_at
}
CONTACT_SUBMISSIONS {
text id PK
text name
text email
text request_type
text message
text ip_hash
text submitted_at
}
USERS ||--o{ JOBS : "assigned"
SITES ||--o{ SYSTEMS : "contains"
SYSTEMS ||--o{ JOBS : "hosts"
SITES ||--o{ MAINTENANCE_REQUESTS : "hosts"
SYSTEMS ||--o{ MAINTENANCE_REQUESTS : "related_to"
USERS ||--o{ MAINTENANCE_REQUESTS : "requester"
JOBS ||--o{ FINANCIAL_RECORDS : "relates_to"
USERS ||--o{ CLIENT_SITE_ACCESS : "grants"
SITES ||--o{ CLIENT_SITE_ACCESS : "granted_to"
USERS ||--o{ AUDIT_EVENTS : "actors"
USERS ||--o{ DOCUMENT_ACCESS_LOGS : "actors"
SITES ||--o{ DOCUMENT_ACCESS_LOGS : "sites"
JOBS ||--o{ JOB_EVIDENCE_FILES : "uploads"
SYSTEMS ||--o{ JOB_EVIDENCE_FILES : "belongs_to"
USERS ||--o{ PASSWORD_RESET_TOKENS : "targets"
```

**Diagram sources**
- [schema.sql](file://schema.sql)
- [document_access_logs.sql](file://migrations/0008_document_access_logs.sql)
- [revoked_sessions.sql](file://migrations/0009_revoked_sessions.sql)
- [client_site_access.sql](file://migrations/0012_client_site_access.sql)

**Section sources**
- [schema.sql](file://schema.sql)

## Dependency Analysis
Administrative components depend on shared utilities and the database schema. The following diagram highlights key dependencies:

```mermaid
graph LR
ADM["admin.js"] --> UJS["users.js"]
ADM --> SJS["sites.js"]
ADM --> SYSJS["systems.js"]
ADM --> JJS["jobs.js"]
ADM --> MRJS["maintenance-requests.js"]
ADM --> EXPJS["export.js"]
AUD["audit.js"] --> UJS
AUD --> SJS
AUD --> SYSJS
AUD --> JJS
AUD --> MRJS
AUD --> EXPJS
DASH["dashboard.astro"] --> UJS
DASH --> SJS
DASH --> SYSJS
DASH --> JJS
DASH --> MRJS
OPS["operations.astro"] --> UJS
OPS --> SJS
OPS --> SYSJS
OPS --> JJS
PLAN["planning.astro"] --> JJS
PLAN --> SYSJS
PLAN --> MRJS
AUDV["audit.astro"] --> AUD
SCHEMA["schema.sql"] -.-> UJS
SCHEMA -.-> SJS
SCHEMA -.-> SYSJS
SCHEMA -.-> JJS
SCHEMA -.-> MRJS
SCHEMA -.-> EXPJS
SCHEMA -.-> AUD
```

**Diagram sources**
- [admin.js](file://src/lib/server/admin.js)
- [audit.js](file://src/lib/server/audit.js)
- [users.js](file://src/pages/portal/api/admin/users.js)
- [sites.js](file://src/pages/portal/api/admin/sites.js)
- [systems.js](file://src/pages/portal/api/admin/systems.js)
- [jobs.js](file://src/pages/portal/api/admin/jobs.js)
- [maintenance-requests.js](file://src/pages/portal/api/admin/maintenance-requests.js)
- [export.js](file://src/pages/portal/api/admin/export.js)
- [dashboard.astro](file://src/pages/portal/admin/dashboard.astro)
- [operations.astro](file://src/pages/portal/admin/operations.astro)
- [planning.astro](file://src/pages/portal/admin/planning.astro)
- [audit.astro](file://src/pages/portal/admin/audit.astro)
- [schema.sql](file://schema.sql)

**Section sources**
- [admin.js](file://src/lib/server/admin.js)
- [audit.js](file://src/lib/server/audit.js)
- [users.js](file://src/pages/portal/api/admin/users.js)
- [sites.js](file://src/pages/portal/api/admin/sites.js)
- [systems.js](file://src/pages/portal/api/admin/systems.js)
- [jobs.js](file://src/pages/portal/api/admin/jobs.js)
- [maintenance-requests.js](file://src/pages/portal/api/admin/maintenance-requests.js)
- [export.js](file://src/pages/portal/api/admin/export.js)
- [dashboard.astro](file://src/pages/portal/admin/dashboard.astro)
- [operations.astro](file://src/pages/portal/admin/operations.astro)
- [planning.astro](file://src/pages/portal/admin/planning.astro)
- [audit.astro](file://src/pages/portal/admin/audit.astro)
- [schema.sql](file://schema.sql)

## Performance Considerations
- Batched queries: The dashboard uses batched statements to reduce round-trips for KPI computation
- Indexes: Strategic indexes on audit events, jobs, systems, and maintenance requests optimize filtering and sorting
- Pagination: Audit console limits results to the most recent entries; use filters to narrow scope
- Client-side filtering: Planning and operations panels implement lightweight client-side filtering to reduce server load
- Export sizing: Export endpoints return CSV responses; consider filtering and limiting datasets for large exports

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Admin-only errors: Ensure the current user has role “admin”; otherwise, requests are rejected
- Validation failures: Review field constraints (lengths, formats, choices) enforced by admin utilities
- Audit writes: Failures are logged; check console for “audit event write failed”
- Import errors: CSV import reports per-row failures with row numbers and messages
- Export permissions: Exports require admin role

**Section sources**
- [admin.js](file://src/lib/server/admin.js)
- [audit.js](file://src/lib/server/audit.js)
- [operations.astro](file://src/pages/portal/admin/operations.astro)

## Conclusion
The administrative features provide a cohesive, secure, and auditable platform for managing users, sites, systems, jobs, and maintenance requests. The dashboards deliver actionable insights, while the audit console ensures transparency and compliance readiness. Robust validation, centralized auditing, and efficient data access patterns support operational excellence and regulatory compliance.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Administrative Workflows

- User provisioning
  - Create a new user with role and site mapping
  - Optionally require MFA for admin/finance roles
  - Issue a password reset link with expiration
  - Reset MFA for admin/finance users when needed

- System configuration
  - Create/update sites with contact and billing details
  - Create/update systems with lifecycle fields (due dates, intervals)
  - Assign systems to sites and configure coverage areas

- Policy management
  - Enforce MFA requirements for admin/finance roles
  - Deactivate users when necessary
  - Track and act on overdue systems and critical requests

- Operational maintenance
  - Bulk import sites/systems via CSV with exact headers
  - Export operational datasets for review and reconciliation
  - Monitor dispatch loads and technician capacity

[No sources needed since this section provides general guidance]