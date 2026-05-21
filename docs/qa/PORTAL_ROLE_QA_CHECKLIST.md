# Portal Role QA Checklist

Use this checklist against staging credentials supplied outside the repository. Do not write passwords, session cookies or temporary secrets into this file.

## Authentication

- [ ] Valid admin login succeeds and routes to the admin dashboard.
- [ ] Valid technician login succeeds and routes to the technician dashboard.
- [ ] Valid finance login succeeds and routes to the finance dashboard.
- [ ] Valid client login succeeds and routes to the client dashboard.
- [ ] Invalid password fails with a visible error and no session is issued.
- [ ] Disabled user cannot login.
- [ ] Force-password-change user is redirected to `/portal/account/password`.

## RBAC Routing

- [ ] Client accessing `/portal/admin/dashboard` redirects or blocks.
- [ ] Client accessing `/portal/finance/dashboard` redirects or blocks.
- [ ] Finance accessing `/portal/admin/dashboard` redirects or blocks.
- [ ] Technician accessing `/portal/admin/dashboard` redirects or blocks.
- [ ] Admin can access `/portal/admin/dashboard`.
- [ ] Admin can access `/portal/finance/dashboard` as intended by current middleware.
- [ ] Admin can access `/portal/tech/dashboard` as intended by current middleware.

## Data Access

- [ ] Client sees only mapped site systems.
- [ ] Client cannot download another site's jobcard.
- [ ] Technician sees assigned jobs only.
- [ ] Technician cannot close another technician's job.
- [ ] Finance can see ledger records but cannot access admin operations unless explicitly authorized.
- [ ] Admin can see all operational records.

## State-Changing Actions

- [ ] Missing CSRF token is blocked with HTTP 403.
- [ ] Invalid CSRF token is blocked with HTTP 403.
- [ ] Valid CSRF token is accepted for authorized actions.
- [ ] Rate limit exceeded returns HTTP 429 and a `retry-after` response header.
- [ ] Audit events are recorded for success, failure and blocked attempts where applicable.

## Documents

- [ ] Valid jobcard PDF download works.
- [ ] Invalid jobcard path is blocked.
- [ ] Path traversal is blocked.
- [ ] Missing document returns a safe error.
