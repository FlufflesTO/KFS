# SYSTEM ARCHITECTURE CONSTITUTION & GLOBAL RULES

**CRITICAL TIME BASELINE:** May 2026 (Enforce current tooling standards)

---

## 1. Core Architectural Stack

| Layer | Technology | Constraints |
|-------|------------|-------------|
| **Framework** | Astro SSR (Server Mode) | Strictly typed TypeScript only |
| **Deployment Runtime** | Cloudflare Pages & Workers | Serverless V8 isolates |
| **Relational Database** | Cloudflare D1 | SQLite engine |
| **UI Framework** | Tailwind CSS v4 | No custom CSS unless required |
| **Runtime Validation** | Zod schemas | Explicit object-level parsing |

---

## 2. Inviolable Legislative & Visual Mandates

### 2.1 POPIA Compliance (Protection of Personal Information Act, South Africa)

| Section | Requirement | Implementation Rule |
|---------|-------------|---------------------|
| **Section 14** | Data Minimization | No raw tracking metrics. IP addresses MUST be hashed using SHA-256 before storage. |
| **Section 24** | Security Safeguards | PII must support irreversible anonymization while maintaining deterministic historical accounting dependencies. Password hashing requires PBKDF2-SHA256 with minimum 600,000 iterations or Argon2id. |
| **Section 26** | Data Subject Rights | All user data must support deletion/anonymization workflow. Audit trails preserve event records but anonymize actor references. |

### 2.2 SARS VAT Compliance (South African Revenue Service)

| Requirement | Implementation Rule |
|-------------|---------------------|
| **Currency Precision** | All monetary values MUST be stored as `INTEGER` (cents). `REAL` floating-point columns are **strictly prohibited** for financial data. |
| **VAT Calculation** | Standard VAT rate is hardcoded to **15%**. Line-item VAT calculation required (not total-based). |
| **Prohibited Operations** | Floating-point arithmetic (`*`, `/`, `.toFixed()`) on monetary values is **strictly prohibited**. Use `Math.round()` for all VAT calculations. |
| **Invoice Retention** | PDF invoices MUST be generated in PDF/A archival format for 5-year SARS retention requirement. |

### 2.3 Design Constitution: "Industrial Command Intelligence"

| Prohibited | Required |
|------------|----------|
| ❌ Pastel color schemes | ✅ Dark headers (#0B0D0F), high-contrast content regions |
| ❌ Casual descriptions or tone | ✅ Formal, technical language |
| ❌ Emojis in UI elements | ✅ SVG iconography only |
| ❌ Generic SaaS/admin template visuals | ✅ Dense information architecture |
| ❌ Rounded pastel dashboards | ✅ Purple (#4B2E83) primary actions, Blue (#1F4E79) hover states |
| ❌ Touch targets < 44×44px | ✅ Minimum 44×44px interactive boundaries (field equipment usability) |

**Brand Color Palette:**

| Color | Hex | Usage |
|-------|-----|-------|
| Purple | `#4B2E83` | Primary action buttons, active states, links |
| Blue | `#1F4E79` | Hover states, secondary emphasis |
| Black | `#0B0D0F` | Headers, dark surfaces, mobile navigation |
| Cyan | `#00C2FF` | Focus states, highlights (accessibility) |
| Amber | `#F59E0B` | Warnings only |
| Red | `#C4332F` | Errors/critical alerts only |
| Green | `#16A34A` | Success/valid states only |

---

## 3. Code Generation Requirements

### 3.1 Completeness Mandate

| Prohibited Pattern | Required Pattern |
|--------------------|------------------|
| ❌ `// TODO: implement remaining logic` | ✅ Complete implementation with all edge cases |
| ❌ Stub methods with empty bodies | ✅ Full method implementation or explicit `throw new Error("Not implemented")` |
| ❌ Truncated code blocks (`// ... rest of code`) | ✅ Complete, production-ready output |

### 3.2 Type Safety Enforcement

| Prohibited | Required |
|------------|----------|
| ❌ `any` type (unless Cloudflare interface wrapper) | ✅ Explicit type annotations |
| ❌ Type casts (`as Type`) without validation | ✅ Zod runtime validation before casting |
| ❌ Implicit `undefined` handling | ✅ Optional chaining (`?.`) and nullish coalescing (`??`) |

### 3.3 Offline-First Preservation

All modifications MUST preserve:

1. **Service Worker Interceptors** - Network-first for API, cache-first for static assets
2. **IndexedDB Draft Storage** - Transaction safety, quota handling
3. **Background Sync Queue** - Exponential backoff retry logic
4. **Network Loss Fallbacks** - Graceful degradation when offline

---

## 4. Database Architecture Standards

### 4.1 Soft-Delete Pattern

```sql
-- Standard soft-delete column
deleted_at TEXT

-- Index requirement
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);

-- Query pattern (MANDATORY)
SELECT * FROM {table} WHERE id = ? AND deleted_at IS NULL
```

**Exception:** `users` table uses `is_active INTEGER CHECK (is_active IN (0, 1))` with `deleted_at` for timestamp tracking.

### 4.2 Repository Pattern Enforcement

| Operation | Rule |
|-----------|------|
| **Read** | All queries MUST use repository methods. Direct `db.prepare()` calls prohibited. |
| **Write** | All mutations MUST use repository methods with automatic audit logging. |
| **Soft-Delete** | Repository methods MUST filter `deleted_at IS NULL` by default. |

### 4.3 Foreign Key Cascade Rules

| Relationship | Rule |
|--------------|------|
| Parent → Child (audit trail) | `ON DELETE SET NULL` (preserve history) |
| Parent → Child (financial) | `ON DELETE SET NULL` + soft-delete propagation trigger |
| Parent → Child (operational) | Soft-delete propagation trigger (no CASCADE) |

**Prohibited:** `ON DELETE CASCADE` on tables with audit/financial/compliance data.

---

## 5. Security Architecture Standards

### 5.1 Session Management

| Requirement | Implementation |
|-------------|----------------|
| **Token Format** | HMAC-SHA256 signed JWT-like payload.signature |
| **Constant-Time Comparison** | All token comparisons MUST use constant-time algorithm |
| **Session Duration** | Absolute timeout: 8 hours from issuance |
| **Cookie Flags** | `HttpOnly; Secure; SameSite=Strict; Path=/portal` |

### 5.2 MFA Enforcement

| Scenario | Rule |
|----------|------|
| **API Endpoints** | MFA redirect check applies to ALL routes including `/portal/api/*` |
| **Secret Storage** | MFA secrets encrypted with AES-GCM using PBKDF2-derived key |
| **TOTP Algorithm** | HMAC-SHA256 (not SHA-1), 30-second window |

### 5.3 Rate Limiting

| Component | Standard |
|-----------|----------|
| **Fingerprint** | IP-based primary key (Cloudflare CF-Connecting-IP) |
| **Window** | Sliding window with read-only TTL matching |
| **Pruning** | Separate `pruneRateLimits()` function, batch deletion (1000 rows) |
| **Limits** | Authentication: 5/15min, API: 100/15min, Admin: 500/15min |

---

## 6. Financial Transaction Standards

### 6.1 State Machine

```
financial_records.payment_status:
  Unpaid → Partially Paid → Paid
  Unpaid → Settled (via Sage)

finance_tasks.status:
  Pending → In Progress → Completed
  Pending → Cancelled
```

### 6.2 Optimistic Locking

```sql
-- Add version column to all mutable financial tables
ALTER TABLE {table} ADD COLUMN version INTEGER DEFAULT 0;

-- Update pattern (MANDATORY for financial records)
UPDATE {table} SET ..., version = version + 1 
WHERE id = ? AND version = ?
```

### 6.3 Sage Integration

| Operation | Rule |
|-----------|------|
| **Idempotency** | All Sage API calls MUST include `Idempotency-Key` header |
| **Webhook Security** | `SAGE_WEBHOOK_SECRET` is MANDATORY (no optional validation) |
| **Payment Sync** | Portal payments MUST push to Sage API within same transaction |

---

## 7. Job Lifecycle & Certificate Standards

### 7.1 Job Completion Requirements

| Requirement | Validation |
|-------------|------------|
| **Evidence Photos** | Minimum 1 photo required (`min(1)` in Zod schema) |
| **GPS Coordinates** | Extract from EXIF or manual entry with site validation |
| **Technician Signature** | Minimum 2000 bytes signature image data |
| **Checklist Completion** | All checklist items must be completed before status → Completed |

### 7.2 Certificate Issuance Blocking

Certificate generation MUST verify:

1. ✅ No blocking defects exist (`certificate_blocking = 1 AND status IN ('Open', 'In Progress')`)
2. ✅ Associated job status = 'Completed'
3. ✅ Inspection checklist 100% complete
4. ✅ Technician signature present and valid size

**Atomic Check:** Defect check and certificate insert MUST be in same transaction (TOCTOU prevention).

---

## 8. Service Worker & Offline Standards

### 8.1 Caching Strategy

| Resource Type | Strategy | Max Age |
|---------------|----------|---------|
| API Endpoints | Network-first with stale fallback | 5 minutes |
| Static Assets | Cache-first with network revalidation | 30 days |
| Service Worker | Network-first with immediate update | N/A |
| Offline Fallback | Cache-only (offline.html) | Indefinite |

### 8.2 Background Sync Queue

| Priority | Retry Strategy | Max Attempts |
|----------|----------------|--------------|
| High (Payments) | Exponential backoff (2^n seconds) | 10 |
| Normal (Jobcards) | Exponential backoff (2^n seconds) | 5 |
| Low (Analytics) | Exponential backoff (2^n seconds) | 3 |

### 8.3 IndexedDB Draft Storage

| Requirement | Implementation |
|-------------|----------------|
| **Transaction Safety** | All operations in explicit transactions with error handling |
| **Quota Management** | Detect `QuotaExceededError`, compress/evict oldest drafts |
| **Image Compression** | Max 1920×1080, JPEG quality 80%, WebP preferred format |

---

## 9. CI/CD & Deployment Standards

### 9.1 Migration Pipeline

```yaml
# MANDATORY: Apply D1 migrations before deployment
- name: Apply D1 Migrations
  run: npx wrangler d1 migrations apply kharon-portal --remote
  before_deploy: true
```

### 9.2 Deployment Gates

| Gate | Validation |
|------|------------|
| **Build** | `npm run build` passes with zero TypeScript errors |
| **Audit** | `npm run audit:site` passes (security headers, CSP) |
| **Tests** | Playwright E2E tests pass (staging environment) |
| **Migrations** | D1 migrations applied successfully |

### 9.3 Rollback Procedure

```bash
# Automatic rollback on health check failure
PREV_DEPLOY=$(npx wrangler pages deployment list --project-name kharon-website | head -2 | tail -1)
npx wrangler pages deployment rollback $PREV_DEPLOY --project-name kharon-website
```

---

## 10. Audit Trail Standards

### 10.1 Event Logging

| Field | Requirement |
|-------|-------------|
| **IP Address** | SHA-256 hash only (no raw storage) |
| **User Agent** | Store as-is (for forensic analysis) |
| **Metadata** | Sanitize sensitive keys (password, secret, token, mfaCode) |
| **Stack Traces** | Prohibited in audit logs (security risk) |

### 10.2 Retention Policy

| Entity Type | Retention Period | Legal Basis |
|-------------|------------------|-------------|
| audit_events | 730 days | Security monitoring |
| user_feedback | 365 days | Product improvement |
| rate_limits | 1 day | Minimal necessary |
| document_access_logs | 365 days | Compliance auditing |
| password_reset_tokens | 1 day | Security requirement |
| inactive_users | 1095 days | Account dormancy policy |

---

## 11. Prohibited Patterns Reference

### 11.1 Database Anti-Patterns

```typescript
// ❌ PROHIBITED: Direct db.prepare() bypassing repository
const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();

// ✅ REQUIRED: Repository method with soft-delete filtering
const user = await userRepository.findById(id);
```

```sql
-- ❌ PROHIBITED: CASCADE delete on audit/financial tables
FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE

-- ✅ REQUIRED: SET NULL with soft-delete propagation
FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
```

```sql
-- ❌ PROHIBITED: REAL columns for financial data
ALTER TABLE financial_records ADD COLUMN amount REAL;

-- ✅ REQUIRED: INTEGER (cents) for financial data
ALTER TABLE financial_records ADD COLUMN amount INTEGER;
```

### 11.2 Security Anti-Patterns

```typescript
// ❌ PROHIBITED: Non-constant-time comparison
if (token === expectedToken) return true;

// ✅ REQUIRED: Constant-time comparison
function constantTimeEqual(a: string, b: string): boolean {
  // XOR-based accumulation without branching
}
```

```typescript
// ❌ PROHIBITED: Floating-point VAT calculation
const vat = amount * 0.15;

// ✅ REQUIRED: Integer VAT calculation
const vatCents = Math.round((amountCents * 15) / 100);
```

### 11.3 UI Anti-Patterns

```astro
<!-- ❌ PROHIBITED: Touch target below 44×44px -->
<button class="w-8 h-8">...</button>

<!-- ✅ REQUIRED: Minimum 44×44px -->
<button class="min-w-[44px] min-h-[44px]">...</button>
```

```astro
<!-- ❌ PROHIBITED: Non-brand colors -->
<div class="bg-emerald-100 text-emerald-800">...</div>

<!-- ✅ REQUIRED: Brand colors -->
<div class="bg-kharon-green/20 text-kharon-green">...</div>
```

---

## 12. Quick Reference: File Locations

| Component | Path |
|-----------|------|
| **Database Schema** | `schema.sql`, `migrations/` |
| **Repository Layer** | `src/lib/server/db/*-repository.ts` |
| **Authentication** | `src/lib/server/auth.ts`, `src/lib/server/session.ts` |
| **Rate Limiting** | `src/lib/server/rateLimit.ts` |
| **Service Worker** | `src/sw.ts` |
| **Offline Storage** | `src/lib/offline/draft-storage.ts`, `src/lib/offline/sync-queue.ts` |
| **PDF Generation** | `src/lib/pdf/invoice-generator.ts`, `src/lib/server/jobcardPdf.ts` |
| **Financial Services** | `src/lib/server/services/finance-service.ts` |
| **Error Handling** | `src/lib/server/http-errors.ts` |
| **Audit Logging** | `src/lib/server/audit.ts` |
| **Design System** | `DESIGN_CONSTITUTION.md`, `src/styles/global.css` |
| **Type Definitions** | `packages/types/src/domain.ts` |

---

## 13. Compliance Checklist (Pre-Deployment)

### POPIA Compliance

- [ ] IP addresses hashed (SHA-256) in all logs
- [ ] User anonymization workflow implemented
- [ ] Data retention policies enforced (cron job active)
- [ ] Password hashing meets 2026 standards (600k+ PBKDF2 iterations)

### SARS VAT Compliance

- [ ] All financial columns are INTEGER (cents)
- [ ] VAT rate enforced at 15% (or 0% for zero-rated)
- [ ] Line-item VAT calculation (not total-based)
- [ ] PDF invoices generated in PDF/A format

### Design Constitution

- [ ] All touch targets ≥ 44×44px
- [ ] Brand colors used correctly (Purple/Blue/Black)
- [ ] No prohibited aesthetics (pastels, emojis, gradients)
- [ ] Focus states use Cyan (#00C2FF)

### Security Hardening

- [ ] MFA enforced for all API endpoints
- [ ] Session tokens use constant-time comparison
- [ ] Rate limiting active on authentication endpoints
- [ ] Sage webhook secret mandatory

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-30  
**Next Review:** 2026-08-30 (Quarterly)  
**Classification:** INTERNAL - Engineering Team Only
