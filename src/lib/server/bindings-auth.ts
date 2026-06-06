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
  // Primary: Cloudflare Workers runtime env (Workers + `astro dev` under workerd).
  const runtime = workerEnv as AuthEnv | undefined;
  if (runtime && (runtime.SESSION_SECRET || runtime.MFA_SECRET || runtime.DB)) {
    return runtime;
  }

  // Fallback: local tooling / CLI scripts via process.env.
  if (typeof process !== "undefined" && process.env) {
    const env: AuthEnv = {
      SESSION_SECRET: process.env.SESSION_SECRET,
      AUTH_SECRET: process.env.AUTH_SECRET,
      MFA_SECRET: process.env.MFA_SECRET,
      ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
      CSRF_SECRET: process.env.CSRF_SECRET,
      AUDIT_IP_SALT: process.env.AUDIT_IP_SALT,
      FINGERPRINT_SECRET: process.env.FINGERPRINT_SECRET,
      ENVIRONMENT: process.env.ENVIRONMENT
    };

    const environment = env.ENVIRONMENT || "local";
    if (environment !== "local" && !env.SESSION_SECRET) {
      throw new Error("SESSION_SECRET must be configured in production environment");
    }

    return env;
  }

  return {};
}
