/**
 * Helper module for resolving bindings in auth context.
 * This provides a unified way to access environment variables across local and production.
 */

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
 * @throws {Error} If required secrets are missing in production
 */
export function resolveBindingsForAuth(): AuthEnv {
  // Try Cloudflare Pages SSR context first
  if (typeof globalThis !== "undefined") {
    const gh = globalThis as Record<string, unknown>;

    // Cloudflare Pages injects env vars into globalThis.__env__
    const pagesEnv = gh.__env__ as AuthEnv | undefined;
    if (pagesEnv && (pagesEnv.SESSION_SECRET || pagesEnv.MFA_SECRET || pagesEnv.DB)) {
      return pagesEnv;
    }

    // Astro Cloudflare adapter may use __astro_locals__
    const astroLocals = gh.__astro_locals__ as Record<string, unknown> | undefined;
    if (astroLocals && (astroLocals.SESSION_SECRET || astroLocals.MFA_SECRET)) {
      return astroLocals as AuthEnv;
    }

    // Direct global properties
    if (gh.SESSION_SECRET || gh.MFA_SECRET) {
      return gh as AuthEnv;
    }
  }

  // Local development fallback - use process.env
  if (typeof process !== "undefined" && process.env) {
    const env = {
      SESSION_SECRET: process.env.SESSION_SECRET,
      AUTH_SECRET: process.env.AUTH_SECRET,
      MFA_SECRET: process.env.MFA_SECRET,
      ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
      CSRF_SECRET: process.env.CSRF_SECRET,
      AUDIT_IP_SALT: process.env.AUDIT_IP_SALT,
      FINGERPRINT_SECRET: process.env.FINGERPRINT_SECRET,
      ENVIRONMENT: process.env.ENVIRONMENT
    };
    
    // In production, require secrets to be configured
    const environment = env.ENVIRONMENT || "local";
    if (environment !== "local" && !env.SESSION_SECRET) {
      throw new Error("SESSION_SECRET must be configured in production environment");
    }
    
    return env;
  }

  // If we reach here with no secrets, check if we're in production
  const environment = (globalThis as Record<string, unknown>).ENVIRONMENT as string | undefined;
  if (environment && environment !== "local") {
    throw new Error("Required secrets not configured. Set SESSION_SECRET and MFA_SECRET in Cloudflare Pages.");
  }

  return {};
}
