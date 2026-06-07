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
  // Check if we're in a CI test environment first to allow safe fallback
  const isTest = typeof process !== "undefined" && process.env && process.env.NODE_ENV === "test";
  
  if (isTest && !env.SESSION_SECRET) {
    env.SESSION_SECRET = "test_session_secret_at_least_32_chars_long_in_code_fallback";
    env.CSRF_SECRET = "test_csrf_secret_at_least_32_chars_long_in_code_fallback";
    env.MFA_SECRET = "test_mfa_secret_at_least_32_chars_long_in_code_fallback";
  }

  const environment = env.ENVIRONMENT || "local";
  if (environment !== "local" && !env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be configured in production environment");
  }

  return env;
}
