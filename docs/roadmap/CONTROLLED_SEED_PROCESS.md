# Controlled Portal Seed Process

This process is for staging and dry-run data only. Do not commit live passwords, password hashes, reset links, MFA secrets, session cookies, Cloudflare tokens or client-confidential production exports.

## Purpose

Seed enough representative portal data to review dashboards, role behavior, dispatch planning, lifecycle calendars, finance visibility and document access without turning staging data into uncontrolled production evidence.

## Allowed Seed Data

- Synthetic or approved staging sites.
- Synthetic protected systems linked to staging sites.
- Synthetic jobs linked to staging systems.
- Synthetic financial records linked to staging jobs or sites.
- Synthetic maintenance requests.
- Test users only when created through an operator-run command or admin UI with external passwords.

## Forbidden In Committed Seed Files

- Real user passwords.
- Password hashes.
- Reset URLs.
- MFA secrets or provisioning URIs.
- Session cookies.
- Live customer confidential documents.
- R2 object credentials.
- Cloudflare account tokens.

## User Creation

Preferred path:

1. Use `/portal/admin/operations` to create the user.
2. Set `Force password change`.
3. Require MFA for admin and finance test accounts where appropriate.
4. Issue a reset link if the test account should use reset onboarding.
5. Deliver credentials or reset links outside the repository.

CLI hash path, only when deliberately needed:

```powershell
npm run portal:hash-password -- "<external-password>"
```

Rules:

- Generate hashes locally only for the target environment.
- Paste hashes directly into a local or remote D1 command file that is excluded from git.
- Delete temporary seed files containing hashes after execution.
- Never add generated password hashes to committed `schema.sql`, docs or examples.

## Recommended Seed Order

1. Sites
2. Systems
3. Users
4. Jobs
5. Maintenance requests
6. Financial records
7. Evidence records only if matching R2 objects exist

## Safe SQL Shape

Committed seed examples may show structure, but values must stay synthetic and must not include hashes:

```sql
INSERT INTO sites (id, owner_company_name, physical_address, site_contact_person, site_contact_email, billing_emails)
VALUES ('site-demo-001', 'Demo Critical Facility', 'Demo industrial address', 'Demo Contact', 'contact@example.co.za', 'billing@example.co.za');
```

User seed SQL containing `password_hash` is operational material, not source material.

## Pre-Seed Checklist

- [ ] Confirm target: local D1, staging D1 or production D1.
- [ ] Export D1 before modifying shared staging or production data.
- [ ] Confirm seed file contains no live passwords or hashes if it will be committed.
- [ ] Confirm users are unique per tester.
- [ ] Confirm test users use external credentials.
- [ ] Confirm client users are mapped only to their intended test site.

## Post-Seed Checklist

- [ ] Run `npm run portal:monitor`.
- [ ] Run `npm run portal:qa:roles -- -SkipCredentialTests`.
- [ ] Run credential-backed role QA with externally supplied test credentials where required.
- [ ] Confirm admin planning page has scheduled jobs, technician load and lifecycle due records.
- [ ] Confirm client users see only mapped systems.
- [ ] Disable or rotate any temporary user created only for setup.

## Cleanup

- Remove temporary SQL files containing password hashes.
- Clear terminal history only where policy permits and where credentials were accidentally pasted.
- Disable stale staging users after QA.
- Keep D1 backups and approved QA records outside the repository.
