/**
 * Helper module for resolving bindings in auth context.
 * Provides a unified way to access secrets/config across Workers runtime and local tooling.
 *
 * Mirrors `bindings.ts`: reads the `cloudflare:workers` runtime `env` first (canonical for
 * the portal Worker and for `astro dev` under workerd in @astrojs/cloudflare v13), falling
 * back to `process.env` for non-worker contexts (CLI scripts).
 */

// @ts-ignore - cloudflare:workers is a Cloudflare runtime virtual module provided by the adapter
import { env as workerEnv } from "cloudflare:workers";

export interface AuthEnv {
  SESSION_SECRET?: string;
  AUTH_SECRET?: string;
  MFA_SECRET?: string;
  ENCRYPTION_SECRET?: string;
  CSRF_SECRET?: string;
  AUDIT_IP_SALT?: string;
  FINGERPRINT_SECRET?: string;
  DB?: unknown;
  STORAGE?: unknown;
  ENVIRONMENT?: string;
  [key: string]: unknown;
}

/**
 * Resolves bindings from the runtime environment.
 * Used by auth.ts and other server modules to access secrets and configuration.
 *
 * @throws {Error} If required secrets are missing in a non-local environment
 */
export function resolveBindingsForAuth(): AuthEnv {
  const runtime = workerEnv as AuthEnv | undefined;
  const env: AuthEnv = {};

  // 1. Load from process.env fallback (local tooling / CLI / astro preview env inheritance)
  if (typeof process !== "undefined" && process.env) {
    env.SESSION_SECRET = process.env.SESSION_SECRET;
    env.AUTH_SECRET = process.env.AUTH_SECRET;
    env.MFA_SECRET = process.env.MFA_SECRET;
    env.ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
    env.CSRF_SECRET = process.env.CSRF_SECRET;
    env.AUDIT_IP_SALT = process.env.AUDIT_IP_SALT;
    env.FINGERPRINT_SECRET = process.env.FINGERPRINT_SECRET;
    env.ENVIRONMENT = process.env.ENVIRONMENT;
  }

  // 2. Overlay Cloudflare Worker runtime bindings (takes precedence)
  if (runtime) {
    for (const key of Object.keys(runtime)) {
      const val = runtime[key];
      if (val !== undefined) {
        env[key] = val;
      }
    }
  }

  // 3. Validation guard
  // Check if we're in a CI environment (GITHUB_ACTIONS) or running tests (NODE_ENV)
  // Use various detection methods since process.env might be unstable in some bundled environments
  const isCI = !!(
    (typeof process !== "undefined" && process.env && (process.env.GITHUB_ACTIONS === "true" || process.env.NODE_ENV === "test")) ||
    (typeof (globalThis as any).process !== "undefined" && (globalThis as any).process.env && ((globalThis as any).process.env.GITHUB_ACTIONS === "true" || (globalThis as any).process.env.NODE_ENV === "test")) ||
    (runtime && (runtime.ENVIRONMENT === "local" || runtime.CI === "true" || (runtime as any).GITHUB_ACTIONS === "true"))
  );

  // Provide safe fallback for tests if secrets are missing
  if (isCI) {
    if (!env.SESSION_SECRET || String(env.SESSION_SECRET).length < 32) env.SESSION_SECRET = "CI_FALLBACK_SESSION_SECRET_V9_LITERAL_VALUE_32_CHARS";
    if (!env.CSRF_SECRET || String(env.CSRF_SECRET).length < 32) env.CSRF_SECRET = "CI_FALLBACK_CSRF_SECRET_V9_LITERAL_VALUE_32_CHARS";
    if (!env.MFA_SECRET || String(env.MFA_SECRET).length < 32) env.MFA_SECRET = "CI_FALLBACK_MFA_SECRET_V9_LITERAL_VALUE_32_CHARS";
    if (!env.AUTH_SECRET || String(env.AUTH_SECRET).length < 32) env.AUTH_SECRET = "CI_FALLBACK_AUTH_SECRET_V9_LITERAL_VALUE_32_CHARS";
    if (!env.FINGERPRINT_SECRET || String(env.FINGERPRINT_SECRET).length < 32) env.FINGERPRINT_SECRET = "CI_FALLBACK_FINGERPRINT_V9_LITERAL_VALUE_32_CHARS";
    if (!env.AUDIT_IP_SALT || String(env.AUDIT_IP_SALT).length < 32) env.AUDIT_IP_SALT = "CI_FALLBACK_AUDIT_SALT_V9_LITERAL_VALUE_32_CHARS";
  }

  // Definitively force local environment if in CI to bypass production secret strictness
  const environment = isCI ? "local" : (env.ENVIRONMENT || "local");

  if (environment !== "local" && (!env.SESSION_SECRET || String(env.SESSION_SECRET).length < 32)) {
    throw new Error(`SESSION_SECRET must be configured with at least 32 characters in production environment (Current: ${environment}, CI: ${isCI})`); 
  }

  return env;
}
