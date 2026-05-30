/**
 * Project Sentinel - Safe DOM Type Helpers
 * Purpose: Provide type-safe DOM element queries without 'as any' escapes
 * Dependencies: None (pure TypeScript utilities)
 * Structural Role: Centralized DOM type safety for Astro client-side scripts
 * 
 * Usage:
 *   import { safeQuerySelector, safeQuerySelectorAll } from '../../lib/types/dom';
 *   const select = safeQuerySelector<HTMLSelectElement>('#req-siteId');
 */

/**
 * Safely query a single DOM element with proper type assertion.
 * Returns null if element not found (matching TypeScript's strict null checks).
 * 
 * @param selector - CSS selector string
 * @param context - Document or Element context (defaults to document)
 * @returns Typed element or null
 */
export function safeQuerySelector<T>(
  selector: string,
  context: Document | Element = document
): T | null {
  const el = context.querySelector(selector);
  return el as T | null;
}

/**
 * Safely query multiple DOM elements with proper type assertion.
 * Returns empty array if no elements found.
 * 
 * @param selector - CSS selector string
 * @param context - Document or Element context (defaults to document)
 * @returns Array of typed elements
 */
export function safeQuerySelectorAll<T>(
  selector: string,
  context: Document | Element = document
): T[] {
  const elements = context.querySelectorAll(selector);
  return Array.from(elements) as T[];
}

/**
 * Type-safe event listener helper with proper event type inference.
 * 
 * @param target - Event target element
 * @param eventType - Event type (e.g., 'click', 'change', 'submit')
 * @param handler - Event handler function
 * @param options - AddEventListenerOptions
 */
export function addSafeEventListener<K extends keyof HTMLElementEventMap>(
  target: HTMLElement | null | undefined,
  eventType: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void {
  target?.addEventListener(eventType, handler as EventListener, options);
}

/**
 * Parse JSON response with proper error handling and type guard.
 * 
 * @param response - Fetch Response object
 * @returns Parsed JSON as Record<string, unknown> or null on error
 */
export async function safeJsonResponse<T = Record<string, unknown>>(
  response: Response
): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Type guard for API response with ok field.
 * 
 * @param data - Unknown data object
 * @returns True if data has ok: boolean field
 */
export function isApiResponse(data: unknown): data is { ok: boolean; message?: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'ok' in data &&
    typeof (data as Record<string, unknown>).ok === 'boolean'
  );
}
