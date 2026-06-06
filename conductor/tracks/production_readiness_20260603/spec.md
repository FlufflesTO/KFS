# Specification: Production Readiness (Phase 0)

## Background
The project is approaching production cutover to `kharon.co.za`. A "Safety Reset" is required to ensure that temporary development credentials, shared accounts, and non-authoritative data indicators are addressed before the system goes live.

## Objectives
- Secure all elevated role accounts with mandatory MFA.
- Visually distinguish QA environments from production.
- Formalize backup and secret management procedures.
- Close all legal and policy sign-off gates (POPIA/HR).

## Success Criteria
- [ ] No temporary passwords remain in the production database.
- [ ] MFA is required and enabled for all admin/finance users.
- [ ] QA environments show a clear warning banner.
- [ ] All production approval gates are signed off in the roadmap.

