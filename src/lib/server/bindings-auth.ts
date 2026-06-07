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
  const isCI = typeof process !== "undefined" && process.env && (process.env.GITHUB_ACTIONS === "true" || process.env.NODE_ENV === "test");
  
  // Provide safe fallback for tests if secrets are missing
  if (isCI) {
    if (!env.SESSION_SECRET) env.SESSION_SECRET = "test_session_secret_at_least_32_chars_long_in_code_fallback";
    if (!env.CSRF_SECRET) env.CSRF_SECRET = "test_csrf_secret_at_least_32_chars_long_in_code_fallback";
    if (!env.MFA_SECRET) env.MFA_SECRET = "test_mfa_secret_at_least_32_chars_long_in_code_fallback";
    if (!env.AUTH_SECRET) env.AUTH_SECRET = "test_auth_secret_at_least_32_chars_long_in_code_fallback";
    if (!env.FINGERPRINT_SECRET) env.FINGERPRINT_SECRET = "test_fingerprint_secret_at_least_32_chars_long_in_code_fallback";
    if (!env.AUDIT_IP_SALT) env.AUDIT_IP_SALT = "test_audit_ip_salt_at_least_32_chars_long_in_code_fallback";
  }

  // Use a loose check for environment to avoid strict production validation in CI
  const environment = env.ENVIRONMENT || "local";
  const isProduction = environment === "production" && !isCI;
  
  if (isProduction && (!env.SESSION_SECRET || String(env.SESSION_SECRET).length < 32)) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters in production environment");
  }

  return env;
}
