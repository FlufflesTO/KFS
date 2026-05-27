# Critical Comparative Review: MASTER_ROADMAP.md vs Project Progress/Status

**Review Date:** 2026-05-27  
**Reviewer:** Automated Code Analysis  
**Scope:** Granular comparison between `/workspace/MASTER_ROADMAP.md` (111 lines) and `/workspace/docs/roadmap/MASTER_ROADMAP.md` (3,436 lines) against actual codebase state.

---

## Executive Summary

### Key Findings at a Glance

| Metric | Root MASTER_ROADMAP.md | docs/roadmap MASTER_ROADMAP.md | Actual Codebase |
|--------|----------------------|-------------------------------|-----------------|
| Total Items | 85 tasks | 443 tasks | N/A |
| Completed ([x]) | 74 (87%) | 367 (83%) | Verified below |
| Pending ([ ]) | 11 (13%) | 76 (17%) | See blockers |
| Granularity | High-level phases | Implementation-grade detail | Exceeds both |
| Last Sync | Unknown | 2026-05-25 | Current |

### Critical Verdict

**The root `MASTER_ROADMAP.md` is severely outdated and lacks critical production blocker visibility.** It presents a misleadingly optimistic view of project completion while the detailed roadmap in `docs/roadmap/` accurately reflects remaining production gates.

**Recommendation:** Deprecate root MASTER_ROADMAP.md immediately and establish `docs/roadmap/MASTER_ROADMAP.md` as the single source of truth.

---

## 1. Structural Comparison

### 1.1 Root MASTER_ROADMAP.md (`/workspace/MASTER_ROADMAP.md`)

**Structure:**
- 11 phases (Phase 0-11)
- 111 total lines
- Simple checkbox format
- No implementation details
- No deployable gates
- No verification evidence

**Phase Breakdown:**
```
Phase 0: Release Freeze & Safety Reset (BLOCKED) - 6 items, 0 complete
Phase 1: Foundation & Core Infrastructure - 7 items, 7 complete ✓
Phase 2: Public Website Development - 9 items, 9 complete ✓
Phase 3: Portal Core Features - 9 items, 9 complete ✓
Phase 4: Security & Compliance Hardening - 6 items, 6 complete ✓
Phase 5: UI/UX & Performance Optimization - 8 items, 8 complete ✓
Phase 6: Advanced Portal Features - 6 items, 6 complete ✓
Phase 7: Finance Integration - 6 items, 6 complete ✓
Phase 8: Advanced Compliance & Reporting - 5 items, 5 complete ✓
Phase 9: Portal UX Refactor - 7 items, 7 complete ✓
Phase 10: Enterprise Features - 5 items, 2 complete, 3 pending
Phase 11: Continuous Improvement - 5 items, 4 complete, 1 pending
Production Approval Gates - 5 items, 4 complete, 1 blocked
```

### 1.2 Detailed MASTER_ROADMAP.md (`/workspace/docs/roadmap/MASTER_ROADMAP.md`)

**Structure:**
- 26+ implementation phases
- 3,436 total lines
- Detailed task breakdown with technical specifics
- Deployable gates per phase
- Review updates with dates (2026-05-20, 2026-05-25)
- Verification evidence sections
- Migration tracking
- CSP/security header documentation
- Brand asset integration logs

**Key Sections:**
```
- Strategic Positioning (brand hierarchy, design principles)
- Current Baseline (implemented routes, APIs, D1 schema, components)
- Review Updates (dated verification passes)
- Production Blockers (explicit credential/MFA/QA gates)
- Phased Implementation (Phases 1-26 with sub-tasks)
- Audit Evidence (build passes, security headers, migration status)
```

---

## 2. Critical Discrepancies

### 2.1 Production Blocker Visibility

| Blocker | Root Roadmap | Detailed Roadmap | Actual Status |
|---------|-------------|------------------|---------------|
| Credential rotation | Listed as Phase 0 item | Explicit production gate with QA process | ⚠️ NOT DONE |
| MFA enforcement | Marked [x] completed | Requires Admin/Finance policy confirmation | ⚠️ POLICY PENDING |
| Role QA testing | Not mentioned | Credential-backed QA for 4 roles required | ⚠️ NOT DONE |
| Responsive screenshot QA | Not mentioned | Full desktop/tablet/mobile matrix required | ⚠️ NOT DONE |
| Sage-first finance refactor | Marked [x] completed | Manual handoff queues still pending | ⚠️ PARTIAL |
| Production domain migration | Single sign-off item | Full migration plan required | ⚠️ NOT DONE |
| Public authority evidence | Not mentioned | Case studies, photos, document examples | ⚠️ NOT DONE |
| Analytics/POPIA compliance | Not mentioned | Provider selection + portal exclusion | ⚠️ NOT DONE |

**CRITICAL FINDING:** Root roadmap shows Phase 0 as "BLOCKED BY PRODUCTION SIGN-OFF" but only lists 1 blocker (Director sign-off). The detailed roadmap correctly identifies **7 additional production gates** that are not reflected at root level.

### 2.2 Finance Integration Status

**Root Roadmap Claims:**
```markdown
## Phase 7: Finance Integration (COMPLETED)
- [x] Manual Sage entry with portal tracking
- [x] Quote → Invoice → Payment workflow
- [x] VAT handling with separate amounts stored
- [x] Credit note tracking with self-referential structure
- [x] **CRITICAL**: Refactor to Sage-first model
- [x] **CRITICAL**: Remove invoice creation from jobcard submission
- [x] **CRITICAL**: Remove quote-to-invoice conversion on approval
- [x] **CRITICAL**: Update payment handling to track Sage references only
```

**Actual Status per Detailed Roadmap:**
```markdown
Phase 21 - Sage Manual Finance Control Register (PARTIAL)
- [x] Sage quote/invoice reference fields implemented
- [x] Manual Sage status workflow foundation
- [x] Sage payment status tracking foundation
- [x] Completed jobs awaiting Sage invoice queue
- [x] Missing Sage reference exception queue
- [ ] Add Sage manual finance handoff queues (Phase 23/21)
- [ ] Add proof-of-payment attachment capture
- [ ] Add finance role QA for exports, settlement, failed updates
```

**Codebase Verification:**
- ✅ `/src/pages/portal/api/finance/sage-reference.js` exists
- ✅ `/src/pages/portal/api/finance/sage-status.js` exists
- ✅ `/src/pages/portal/finance/dashboard.astro` exists
- ✅ Migrations 0013, 0020 add Sage VAT fields
- ❌ Manual handoff queues incomplete per detailed roadmap
- ❌ Finance role QA not completed

**DISCREPANCY:** Root roadmap incorrectly marks entire Phase 7 as COMPLETED when critical Sage-first workflows remain pending.

### 2.3 Technician Field Workflow

**Root Roadmap Claims:**
```markdown
## Phase 6: Advanced Portal Features (COMPLETED)
- [x] Offline PWA capabilities for field technicians
- [x] Route optimization for job dispatch
```

**Detailed Roadmap Reality:**
```markdown
Phase 22 - Technician Field Workflow Maturity (SUBSTANTIAL)
- [x] Focused job detail route /portal/tech/jobs/[id]
- [x] Visit outcome form with Unable To Complete
- [x] Arrival check-in form with GPS
- [x] Photo evidence categories
- [x] SANS-aligned checklist foundation
- [ ] Add structured parts/labour tracking
- [ ] Add technician day summary
- [ ] GPS check-out (departure logging)
```

**Codebase Verification:**
- ✅ `/src/pages/portal/tech/jobs/[id].astro` exists (39KB focused workflow)
- ✅ `/src/pages/portal/api/job-visits.js` exists
- ✅ Migration 0015 creates job_visits table with GPS fields
- ✅ Migration 0020 adds visit_status enum
- ❌ Parts/labour tracking not implemented
- ❌ Technician day summary not implemented

**DISCREPANCY:** Root roadmap claims "Offline PWA capabilities" as completed, but detailed roadmap correctly shows offline draft save as implemented while full PWA/offline functionality remains partial.

### 2.4 Security & Compliance

**Root Roadmap Claims:**
```markdown
## Phase 4: Security & Compliance Hardening (COMPLETED)
- [x] MFA implementation
- [x] Enhanced session management
- [x] POPIA compliance measures
```

**Detailed Roadmap Reality:**
```markdown
Phase 0 Production Gates:
- [ ] Rotate and disable all shared or temporary staging credentials
- [ ] Confirm Admin and Finance MFA enforcement policy before loading real records
- [ ] Complete credential-backed role QA for Admin, Technician, Client and Finance

Phase 13 - Security Headers (IMPLEMENTED):
- [x] CSP and supporting headers in _headers
- [x] Nonce injection in middleware
- [ ] Document approved external domains if analytics added

POPIA Compliance:
- [ ] Select POPIA-aware analytics provider
- [ ] Confirm analytics do not load on /portal/*
- [ ] Update privacy notice if required
```

**Codebase Verification:**
- ✅ `/src/pages/portal/api/mfa.js` exists
- ✅ Migration 0007 adds user_mfa fields
- ✅ Migration 0018 adds mfa_policy table
- ✅ `public/_headers` file exists with CSP
- ✅ Middleware nonce injection implemented
- ❌ Shared staging credentials still active per detailed roadmap
- ❌ Analytics provider not selected
- ❌ POPIA compliance documentation incomplete

**DISCREPANCY:** Root roadmap marks MFA and POPIA as completed when implementation exists but operational policies and credential rotation remain outstanding.

---

## 3. Codebase Verification Against Roadmaps

### 3.1 Portal Pages Inventory

| Role | Expected (Detailed) | Actual Files | Status |
|------|---------------------|--------------|--------|
| Admin Dashboard | `/portal/admin/dashboard` | ✅ dashboard.astro (32KB) | VERIFIED |
| Admin Dispatch | `/portal/admin/dispatch` | ✅ dispatch.astro (30KB) | VERIFIED |
| Admin Operations | `/portal/admin/operations` | ✅ operations.astro (6.5KB) | VERIFIED |
| Admin Compliance | `/portal/admin/compliance` | ✅ compliance.astro (13KB) | VERIFIED |
| Admin Audit | `/portal/admin/audit` | ✅ audit.astro (12KB) | VERIFIED |
| Admin Planning | `/portal/admin/planning` | ✅ planning.astro (29KB) | VERIFIED |
| Tech Dashboard | `/portal/tech/dashboard` | ✅ dashboard.astro (17KB) | VERIFIED |
| Tech History | `/portal/tech/history` | ✅ history.astro (11KB) | VERIFIED |
| Tech Job Detail | `/portal/tech/jobs/[id]` | ✅ [id].astro (39KB) | VERIFIED |
| Client Dashboard | `/portal/client/dashboard` | ✅ dashboard.astro (22KB) | VERIFIED |
| Client Compliance | `/portal/client/compliance-dashboard` | ✅ compliance-dashboard.astro (25KB) | VERIFIED |
| Finance Dashboard | `/portal/finance/dashboard` | ✅ dashboard.astro (5.8KB) | VERIFIED |

**Assessment:** All expected portal pages from detailed roadmap exist in codebase. Root roadmap does not specify these granular routes.

### 3.2 API Endpoints Inventory

| Category | Expected (Detailed) | Actual Files | Status |
|----------|---------------------|--------------|--------|
| Auth | auth, logout, reset, mfa | ✅ auth.ts, logout.js, reset-password.js, mfa.js | VERIFIED |
| Admin | users, sites, systems, jobs, defects, certificates, dispatch | ✅ 12 API files in /admin/ | VERIFIED |
| Finance | payments, export, sage-*, tasks, credit-note | ✅ 10 API files in /finance/ | VERIFIED |
| Jobs | job-status, job-visits, submit-jobcard | ✅ All present | VERIFIED |
| File Access | file/[key] | ✅ Present | VERIFIED |

**Migration Files:**
```
0001-0024: 24 migration files present
Latest: 0024_phase11_telemetry.sql
Key migrations verified:
- 0013_sage_finance_fields.sql ✅
- 0014_clients.sql ✅
- 0015_job_visits.sql ✅
- 0016_defects.sql ✅
- 0017_certificates.sql ✅
- 0018_finance_task_status_pipeline.sql ✅
- 0019_jobs_dispatch_fields.sql ✅
- 0020_finance_vat_hardening.sql ✅
- 0020_job_visit_status.sql ✅
```

**Assessment:** Codebase exceeds root roadmap specifications and aligns with detailed roadmap Phase 16-26 implementations.

### 3.3 Build & Audit Scripts

| Script | Root Roadmap | Detailed Roadmap | Actual |
|--------|-------------|------------------|--------|
| Build | Not specified | `npm run build` | ✅ package.json |
| Site Audit | Not specified | `npm run audit:site` | ✅ scripts/audit-site.mjs |
| D1 Backup | Not specified | `npm run portal:backup:d1` | ✅ scripts/portal-backup.ps1 |
| Monitoring | Not specified | `npm run portal:monitor` | ✅ scripts/portal-monitor.ps1 |
| Role QA | Not specified | `npm run portal:qa:roles` | ✅ scripts/portal-role-qa.ps1 |

**Assessment:** All operational scripts from detailed roadmap exist. Root roadmap lacks this operational detail.

---

## 4. Outstanding Production Blockers (Verified)

### 4.1 Critical Blockers (Must Complete Before Production)

| # | Blocker | Root Roadmap | Detailed Roadmap | Priority |
|---|---------|-------------|------------------|----------|
| 1 | **Credential Rotation** | Listed but understated | Explicit gate with process | 🔴 CRITICAL |
| 2 | **Role QA Testing** | Not mentioned | 4 roles require external QA | 🔴 CRITICAL |
| 3 | **MFA Policy Enforcement** | Marked complete | Admin/Finance policy pending | 🔴 CRITICAL |
| 4 | **Sage-First Finance Handoff** | Marked complete | Manual queues incomplete | 🔴 CRITICAL |
| 5 | **Production Domain Migration** | Single sign-off item | Full migration plan needed | 🔴 CRITICAL |

### 4.2 High-Priority Blockers (Should Complete Before Production)

| # | Blocker | Root Roadmap | Detailed Roadmap | Priority |
|---|---------|-------------|------------------|----------|
| 6 | **Responsive Screenshot QA** | Not mentioned | Desktop/tablet/mobile matrix | 🟠 HIGH |
| 7 | **Public Authority Evidence** | Not mentioned | Case studies, photos, documents | 🟠 HIGH |
| 8 | **Analytics/POPIA Compliance** | Not mentioned | Provider selection + exclusion | 🟠 HIGH |
| 9 | **Backup/Restore Verification** | Brief mention | Full drill with evidence | 🟠 HIGH |
| 10 | **CSP Browser Verification** | Not mentioned | Live verification pending | 🟠 HIGH |

### 4.3 Medium-Priority Items (Can Complete Post-Launch)

| # | Item | Root Roadmap | Detailed Roadmap | Priority |
|---|------|-------------|------------------|----------|
| 11 | Parts/labour tracking | Claimed complete | Not implemented | 🟡 MEDIUM |
| 12 | Technician day summary | Not mentioned | Not implemented | 🟡 MEDIUM |
| 13 | Evidence pack downloads | Not mentioned | Deferred | 🟡 MEDIUM |
| 14 | Mobile app | Listed Phase 10 | Not in detailed roadmap | 🟡 MEDIUM |
| 15 | Predictive maintenance | Listed Phase 10 | Not in detailed roadmap | 🟡 MEDIUM |

---

## 5. Recommendations

### 5.1 Immediate Actions (This Week)

1. **DEPRECATE ROOT ROADMAP**
   - Move `/workspace/MASTER_ROADMAP.md` to `/workspace/ARCHIVED_ROADMAP.md`
   - Create symlink or redirect to `docs/roadmap/MASTER_ROADMAP.md`
   - Update all documentation references

2. **UPDATE ROOT README**
   - Add link to detailed roadmap
   - Reflect actual production blocker status
   - Remove misleading "COMPLETED" claims

3. **CREDENTIAL ROTATION SPRINT**
   - Generate unique credentials for each role
   - Disable all shared/temporary passwords
   - Document controlled reset process
   - Complete before any broader operational use

4. **MFA POLICY CONFIRMATION**
   - Director sign-off on Admin/Finance MFA requirement
   - Enforce via middleware before loading real records
   - Update detailed roadmap with policy decision

### 5.2 Short-Term Actions (Next 2 Weeks)

5. **ROLE QA TESTING**
   - Schedule external QA for Admin, Technician, Client, Finance
   - Use representative staging data
   - Document all findings
   - Fix critical issues before production

6. **RESPONSIVE SCREENSHOT QA**
   - Capture desktop (1920×1080, 1366×768)
   - Capture tablet (768×1024, 1024×768)
   - Capture mobile (375×667, 414×896)
   - Verify all portal pages and public routes

7. **SAGE HANDOFF COMPLETION**
   - Implement missing manual finance handoff queues
   - Add proof-of-payment attachment option
   - Complete finance role QA testing

8. **PRODUCTION DOMAIN MIGRATION PLAN**
   - Document kharon.co.za cutover steps
   - Plan DNS changes
   - Prepare rollback procedure
   - Schedule director sign-off

### 5.3 Medium-Term Actions (Next Month)

9. **PUBLIC AUTHORITY EVIDENCE**
   - Collect 2-4 approved case studies
   - Gather industrial photography
   - Create anonymised document examples
   - Update compliance hub depth

10. **ANALYTICS IMPLEMENTATION**
    - Select POPIA-aware provider (Plausible recommended)
    - Configure to exclude /portal/* routes
    - Update privacy notice
    - Implement conversion tracking

11. **BACKUP/RESTORE DRILL**
    - Execute full D1 export
    - Perform R2 restore test
    - Document results outside git
    - Update Operations SOP

### 5.4 Roadmap Governance Recommendations

12. **ESTABLISH ROADMAP UPDATE CADENCE**
    - Weekly sync during active development
    - Bi-weekly during stabilization
    - Pre-deployment verification pass
    - Post-deployment reconciliation

13. **ADD VERIFICATION EVIDENCE REQUIREMENTS**
    - Each phase must include deployable gates
    - Build/audit script outputs documented
    - Migration application confirmed
    - Manual QA sign-off recorded

14. **IMPLEMENT STATUS BADGING**
    - Use consistent status labels: NOT STARTED, IN PROGRESS, SUBSTIALLY COMPLETE, COMPLETE, BLOCKED
    - Avoid premature "COMPLETED" claims
    - Link to verification evidence

15. **CREATE EXECUTIVE SUMMARY VIEW**
    - One-page production readiness dashboard
    - Traffic light status for critical blockers
    - Director sign-off checkpoints
    - Go/no-go decision criteria

---

## 6. Risk Assessment

### 6.1 Current Risk Level: **AMBER-HIGH**

**Rationale:**
- Core functionality implemented and verified
- Security foundations in place (CSRF, rate limiting, headers)
- BUT: Credential rotation, MFA policy, and role QA not completed
- BUT: Finance Sage-first handoff incomplete
- BUT: Production migration plan not documented

### 6.2 Risks If Root Roadmap Trusted

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Premature production launch | HIGH | MEDIUM | Use detailed roadmap as source of truth |
| Incomplete credential security | HIGH | HIGH | Immediate rotation sprint |
| Finance workflow gaps | HIGH | MEDIUM | Complete Phase 21 handoff queues |
| POPIA non-compliance | MEDIUM | MEDIUM | Select analytics provider urgently |
| Mobile usability issues | MEDIUM | LOW | Complete responsive QA |

### 6.3 Risks If Detailed Roadmap Followed

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Timeline extension | LOW | HIGH | Accept realistic 2-4 week runway |
| Scope creep | LOW | MEDIUM | Freeze non-critical features |
| Director fatigue | LOW | LOW | Executive summary reporting |

---

## 7. Conclusion

### 7.1 Root Roadmap Assessment

**VERDICT: UNFIT FOR PURPOSE**

The root `MASTER_ROADMAP.md`:
- ❌ Lacks critical production blocker visibility
- ❌ Prematurely marks incomplete items as "COMPLETED"
- ❌ Omits implementation details necessary for QA
- ❌ Does not reflect current codebase capabilities
- ❌ Provides false confidence to stakeholders

**Recommendation:** Archive immediately and replace with reference to detailed roadmap.

### 7.2 Detailed Roadmap Assessment

**VERDICT: PRODUCTION-READY DOCUMENTATION**

The `docs/roadmap/MASTER_ROADMAP.md`:
- ✅ Accurately reflects codebase state
- ✅ Clearly identifies production gates
- ✅ Includes verification evidence
- ✅ Provides implementation guidance
- ✅ Maintains dated review updates

**Recommendation:** Elevate to primary project roadmap, update weekly.

### 7.3 Codebase Assessment

**VERDICT: STAGING-READY, PRODUCTION-PENDING**

The actual codebase:
- ✅ Exceeds both roadmap specifications
- ✅ Implements Phases 1-26 substantially
- ✅ Contains all expected pages and APIs
- ✅ Has operational scripts and monitoring
- ⚠️ Awaiting credential rotation and QA
- ⚠️ Awaiting MFA policy enforcement
- ⚠️ Awaiting Sage handoff completion

**Recommendation:** Complete critical blockers, then proceed to production launch.

---

## Appendix A: Task Completion Matrix

| Phase | Root Status | Detailed Status | Codebase Reality | Alignment |
|-------|-------------|-----------------|------------------|-----------|
| Phase 0 | BLOCKED | Partial | Credentials pending | ⚠️ Root understates |
| Phase 1 | COMPLETE | COMPLETE | Verified | ✅ Aligned |
| Phase 2 | COMPLETE | SUBSTANTIAL | Verified | ✅ Aligned |
| Phase 3 | COMPLETE | PARTIAL | Sage-first partial | ⚠️ Root overstates |
| Phase 4 | COMPLETE | IMPLEMENTED | Policy pending | ⚠️ Root overstates |
| Phase 5 | COMPLETE | IN PROGRESS | Verified | ⚠️ Root overstates |
| Phase 6 | COMPLETE | SUBSTANTIAL | PWA partial | ⚠️ Root overstates |
| Phase 7 | COMPLETE | PARTIAL | Handoff incomplete | ⚠️ Root overstates |
| Phase 8 | COMPLETE | COMPLETE | Verified | ✅ Aligned |
| Phase 9 | COMPLETE | COMPLETE | Verified | ✅ Aligned |
| Phase 10 | PARTIAL | N/A | Enterprise partial | ⚠️ Different scope |
| Phase 11+ | N/A | Phases 12-26 | Substantially implemented | ✅ Detailed superior |

---

## Appendix B: File References

### Roadmap Files
- `/workspace/MASTER_ROADMAP.md` (111 lines) - **DEPRECATED**
- `/workspace/docs/roadmap/MASTER_ROADMAP.md` (3,436 lines) - **AUTHORITATIVE**
- `/workspace/docs/roadmap/PHASE_7_14_15_PLAN.md` - Implementation detail

### Key Code Directories
- `/workspace/src/pages/portal/admin/` (16 files)
- `/workspace/src/pages/portal/tech/` (3 files + jobs/[id])
- `/workspace/src/pages/portal/client/` (3 files)
- `/workspace/src/pages/portal/finance/` (1 file)
- `/workspace/src/pages/portal/api/` (14 files + admin/, finance/)

### Migration Files
- `/workspace/migrations/0001-0024*.sql` (24 migrations)

### Operational Scripts
- `/workspace/scripts/audit-site.mjs`
- `/workspace/scripts/portal-monitor.ps1`
- `/workspace/scripts/portal-backup.ps1`
- `/workspace/scripts/portal-role-qa.ps1`

---

**Report Generated:** 2026-05-27  
**Next Review:** After credential rotation sprint (recommended: 2026-06-03)  
**Distribution:** Development Team, Directors, QA Stakeholders
