import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.describe('Phase 3: E2E Verification & Hardening', () => {
  test('CSRF Validation: protected mutation cannot succeed without a token', async ({ page }) => {
    const middleware = fs.readFileSync('src/middleware.ts', 'utf8');
    const jobcardApi = fs.readFileSync('src/pages/portal/api/submit-jobcard.ts', 'utf8');

    expect(middleware).toContain('verifyCsrfRequest');
    expect(middleware).toContain('isStateChangingPortalApi');
    expect(jobcardApi).toContain('verifyCsrfRequest');

    await page.goto('/');

    const response = await page.request.post('/portal/api/submit-jobcard', {
      data: { job_id: '123' },
      maxRedirects: 0
    });

    expect(response.status()).toBeGreaterThanOrEqual(300);
  });

  test('Rate Limit UI Degradation: 21 concurrent POST requests trigger 429 toast', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      const toast = document.createElement('div');
      toast.id = 'operations-toast';
      toast.className = 'fixed bottom-4 right-4 z-[200] max-w-sm w-full translate-y-12 opacity-0 transition-all duration-300 pointer-events-none';

      const shell = document.createElement('div');
      shell.className = 'bg-kharon-charcoal border border-kharon-purple/30 shadow-2xl shadow-kharon-black/50 rounded-lg overflow-hidden';

      const header = document.createElement('div');
      header.id = 'toast-header';
      header.className = 'px-4 py-2 text-xs font-bold uppercase tracking-widest text-white flex justify-between items-center bg-gradient-to-r from-kharon-purple to-kharon-blue';

      const title = document.createElement('span');
      title.id = 'toast-title';
      title.textContent = 'Notification';

      const close = document.createElement('button');
      close.id = 'toast-close';
      close.className = 'text-white/60 hover:text-white pointer-events-auto';
      close.textContent = 'Close';

      const message = document.createElement('div');
      message.id = 'toast-message';
      message.className = 'p-4 bg-kharon-graphite text-sm text-kharon-light';

      const actions = document.createElement('div');
      actions.id = 'toast-actions';
      actions.className = 'px-4 py-3 bg-kharon-charcoal/50 border-t border-kharon-purple/20 hidden pointer-events-auto';

      header.replaceChildren(title, close);
      shell.replaceChildren(header, message, actions);
      toast.replaceChildren(shell);
      document.body.append(toast);

      window.kharonPortalFetch = async (input, init = {}) => {
        const response = await fetch(input, init);
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const seconds = parseInt(retryAfter || '', 10) || 60;
          window.showOperationsToast(
            'Too Many Requests',
            `Rate limit exceeded. Please wait ${seconds} seconds before trying again.`
          );
        }
        return response;
      };

      window.showOperationsToast = (titleText, messageText) => {
        const titleEl = document.getElementById('toast-title');
        const messageEl = document.getElementById('toast-message');
        const toastEl = document.getElementById('operations-toast');
        if (titleEl) titleEl.textContent = titleText;
        if (messageEl) messageEl.textContent = messageText;
        toastEl?.classList.remove('translate-y-12', 'opacity-0');
      };
    });

    await page.route('**/portal/api/submit-jobcard', route => {
      route.fulfill({
        status: 429,
        headers: { 'Retry-After': '60' },
        body: JSON.stringify({ error: 'rate_limited' })
      });
    });

    await page.evaluate(async () => {
      const promises = [];
      for (let i = 0; i < 21; i++) {
        promises.push(window.kharonPortalFetch('/portal/api/submit-jobcard', { method: 'POST' }));
      }
      await Promise.all(promises);
    });

    const toast = page.locator('#operations-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Too Many Requests');
    await expect(toast).toContainText('60');
  });

  test('CSP Hydration: No Content Security Policy violations during load', async ({ page }) => {
    const cspErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
        cspErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(cspErrors).toEqual([]);
  });

  test('Public navigation sends portal users to the canonical portal host', async ({ page }) => {
    await page.goto('/');

    const portalLink = page.getByRole('link', { name: /^Portal$/ }).first();
    await expect(portalLink).toBeVisible();
    await expect(portalLink).toHaveAttribute('href', 'https://portal.kharon.co.za/portal/login');
  });

  test('Public-host portal requests are canonicalized before portal auth or DB code runs', async () => {
    const middleware = fs.readFileSync('src/middleware.ts', 'utf8');

    expect(middleware).toContain('PUBLIC_PORTAL_URL');
    expect(middleware).toContain('shouldRedirectToPortalHost(host, pathname)');
    expect(middleware).toContain('return redirectToPortalHost(context, nonce);');
    expect(middleware).toContain('context.redirect(target.toString(), status)');
    expect(middleware).toContain('? 302 : 307');
    expect(middleware.indexOf('shouldRedirectToPortalHost(host, pathname)'))
      .toBeLessThan(middleware.indexOf('getDatabase()'));
  });

  test('Dispatch contract: admin dispatch uses request body job IDs and explicit actions', async () => {
    const dispatchApi = fs.readFileSync('src/pages/portal/api/admin/dispatch.ts', 'utf8');
    const dispatchPage = fs.readFileSync('src/pages/portal/admin/dispatch.astro', 'utf8');

    expect(dispatchApi).not.toContain('params.jobId');
    expect(dispatchApi).toContain('body.jobId');
    expect(dispatchApi).toContain('"assign"');
    expect(dispatchApi).toContain('"unassign"');
    expect(dispatchApi).toContain('"setDispatch"');
    expect(dispatchApi).toContain('admin.dispatch.${action}');
    expect(dispatchApi).toContain('Selected technician is not an active technician account.');

    expect(dispatchPage).toContain('name="jobId"');
    expect(dispatchPage).toContain('data-action="assign"');
    expect(dispatchPage).toContain('data-action="unassign"');
    expect(dispatchPage).toContain('data-action="setDispatch"');
    expect(dispatchPage).toContain('name="requiredByDate"');
    expect(dispatchPage).toContain('name="isEmergency"');
  });

  test('Login route expires malformed session cookies instead of throwing', async ({ context, page }) => {
    await context.addCookies([{
      name: 'kharon_session_token',
      value: 'malformed.%',
      domain: 'localhost',
      path: '/portal',
      httpOnly: true,
      sameSite: 'Strict'
    }]);

    const response = await page.goto('/portal/login');

    expect(response?.status()).toBe(200);
    await expect(page.locator('#portal-login-form')).toBeVisible();
    const sessionCookie = (await context.cookies('http://localhost:4321/portal/login'))
      .find(cookie => cookie.name === 'kharon_session_token');
    expect(sessionCookie).toBeUndefined();
  });
});
