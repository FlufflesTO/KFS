/**
 * Project Sentinel - Global Typings
 * Purpose: Declares global namespaces, environment variables, and Astro context Locals
 * Dependencies: @sentinel/types
 * Structural Role: Global TypeScript type declarations
 */

/// <reference path="../.astro/types.d.ts" />
declare namespace App {
  interface Locals {
    user?: import("./lib/server/auth").SessionUser;
    nonce?: string;
    csrfToken?: string;
    shouldSetCsrfCookie?: boolean;
    variant?: string;
    needsVariantCookie?: boolean;
  }
}

declare var process: any;
