1. Use `run_in_bash_session` to execute `rm plan.md` to clean up temporary files.
2. Execute `echo 'SESSION_SECRET="12345678901234567890123456789012"' >> .dev.vars && echo 'MFA_SECRET="12345678901234567890123456789012"' >> .dev.vars && echo 'CSRF_SECRET="12345678901234567890123456789012"' >> .dev.vars && echo 'ENCRYPTION_SECRET="12345678901234567890123456789012"' >> .dev.vars && echo 'SAGE_WEBHOOK_SECRET="12345678901234567890123456789012"' >> .dev.vars && echo 'AUTH_SECRET="12345678901234567890123456789012"' >> .dev.vars && echo 'FINGERPRINT_SECRET="12345678901234567890123456789012"' >> .dev.vars && echo 'AUDIT_IP_SALT="12345678901234567890123456789012"' >> .dev.vars && echo 'ENVIRONMENT="local"' >> .dev.vars` to satisfy test requirements.
3. Execute `pnpm run check` and `pnpm run lint` to verify the code base.
4. Execute `npx vitest run src/lib/server/test/` to run the project test suite.
5. Execute `npx wrangler d1 migrations apply kharon-portal --local --config wrangler.portal.jsonc`.
6. Execute `npx playwright test tests/visual.spec.ts --project=desktop-chrome`.
7. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
8. Call the `submit` tool with branch name `palette-add-type-button-portal-layout-17442929316075088061`, title '🎨 Palette: Add type="button" to interactive layout buttons' and description '💡 What: Added type="button" to non-submit buttons in PortalLayout.astro (mobile-drawer-close, mobile-drawer-toggle, open-feedback, close-feedback).
🎯 Why: In Astro/React components, <button> elements default to type="submit". Adding type="button" prevents unintended page reloads or form submissions when rendered near or inside form contexts.
📸 Before/After: N/A (Functional change only, no visual difference).
♿ Accessibility: N/A'.
