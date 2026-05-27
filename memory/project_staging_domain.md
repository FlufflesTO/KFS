---
name: Staging domain context
description: tequit.co.za is the intentional staging domain during construction; will move to kharon.co.za only after director approval
type: project
---

tequit.co.za is the deliberate staging/build domain for the Kharon site and portal while everything is under construction. The site defaults to this domain in site.js and the fallback is intentional.

**Why:** The site is being built and reviewed on tequit.co.za before being shown to the director. Upon director approval, the codebase moves to kharon.co.za and will use the associated Google Workspace kharon.co.za email addresses.

**How to apply:** Do not flag the tequit.co.za default URL as an error. The only action required is updating PUBLIC_SITE_URL, PUBLIC_PORTAL_URL, and PUBLIC_CONTACT_EMAIL environment variables at production cutover — no code changes needed for the domain switch. Email sending (Phase 9) will also use kharon.co.za addresses once the Google Workspace integration is wired up.
