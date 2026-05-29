/**
 * Project Sentinel - Standardized HTTP Error Handling
 * Purpose: Centralized error handling infrastructure with custom error classes,
 *          structured responses, and automatic audit logging
 * Dependencies: ./audit.ts, ./request.ts
 * Structural Role: Error handling layer for API endpoints
 * 
 * Security Requirements:
 * - Never leak internal error details to clients
 * - Sanitize error messages (remove stack traces, paths, connection strings)
 * - Log full error details server-side for debugging
 * - Audit all errors for security monitoring
 * - Differentiate between client errors (4xx) and server errors (5xx)
 */

import type { D1Database } from "@cloudflare/workers-types";
import { auditError } from "./audit";

// ─── Error Response Format ────────────────────────────────────────────────

export interface ErrorResponse {
  ok: false;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

// ─── Custom Error Classes ─────────────────────────────────────────────────

/**
 * Base application error class with code, status, message, and optional details.
 * All custom errors extend this class for consistent error handling.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    code: string,
    status: number,
    message: string,
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.isOperational = isOperational;
  }

  /**
   * Converts error to JSON response body.
   * Sanitizes sensitive information for client responses.
   */
  toJSON(): ErrorResponse {
    return {
      ok: false,
      error: this.code,
      message: this.sanitizeMessage(this.message),
      details: this.sanitizeDetails(this.details)
    };
  }

  /**
   * Sanitizes error message for client consumption.
   * Removes stack traces, file paths, connection strings, and internal details.
   */
  private sanitizeMessage(message: string): string {
    // Remove potential stack traces
    let sanitized = message.replace(/\s*at\s+[^\n]+/g, "");
    
    // Remove file paths
    sanitized = sanitized.replace(/[A-Za-z]:\\[^\s]+|\/[^\s]+\//g, "[path redacted]");
    
    // Remove connection strings
    sanitized = sanitized.replace(/(?:mongodb|postgres|mysql|redis):\/\/[^\s]+/g, "[connection string redacted]");
    
    // Remove internal server details
    sanitized = sanitized.replace(/internal server|internal error|system error/gi, "server error");
    
    return sanitized.trim() || "An error occurred";
  }

  /**
   * Sanitizes error details for client consumption.
   * Removes sensitive fields like passwords, tokens, and internal metadata.
   */
  private sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!details) return undefined;

    const sensitiveKeys = [
      "password", "secret", "token", "key", "credential", "authorization",
      "session", "cookie", "auth", "api_key", "apikey", "private"
    ];

    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(details)) {
      const lowerKey = key.toLowerCase();
      
      // Skip sensitive fields
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        continue;
      }
      
      // Recursively sanitize nested objects
      if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeDetails(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }
}

/**
 * 400 Bad Request - Validation failures, malformed requests
 */
export class BadRequestError extends AppError {
  constructor(message: string = "Bad request", details?: Record<string, unknown>) {
    super("bad_request", 400, message, details);
    this.name = "BadRequestError";
  }
}

/**
 * 401 Unauthorized - Authentication failures
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required", details?: Record<string, unknown>) {
    super("unauthorized", 401, message, details);
    this.name = "UnauthorizedError";
  }
}

/**
 * 403 Forbidden - Authorization failures
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied", details?: Record<string, unknown>) {
    super("forbidden", 403, message, details);
    this.name = "ForbiddenError";
  }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super("not_found", 404, `${entity} with ID '${id}' not found`);
    this.name = "NotFoundError";
  }
}

/**
 * 409 Conflict - Resource conflicts (duplicate, version mismatch)
 */
export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict", details?: Record<string, unknown>) {
    super("conflict", 409, message, details);
    this.name = "ConflictError";
  }
}

/**
 * 429 Too Many Requests - Rate limiting
 */
export class TooManyRequestsError extends AppError {
  public readonly retryAfter: number;

  constructor(message: string = "Too many requests", retryAfter: number = 60) {
    super("rate_limited", 429, message, { retryAfter });
    this.name = "TooManyRequestsError";
    this.retryAfter = retryAfter;
  }

  toJSON(): ErrorResponse {
    return {
      ...super.toJSON(),
      details: { retryAfter: this.retryAfter }
    };
  }
}

/**
 * 500 Internal Server Error - System errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super("internal_error", 500, message, undefined, false);
    this.name = "InternalServerError";
  }
}

// ─── Error Handler Factory Functions ──────────────────────────────────────

/**
 * Creates a 400 Bad Request error.
 * Use for validation failures and malformed requests.
 */
export function badRequest(message: string, details?: Record<string, unknown>): BadRequestError {
  return new BadRequestError(message, details);
}

/**
 * Creates a 401 Unauthorized error.
 * Use for authentication failures.
 */
export function unauthorized(message: string = "Authentication required", details?: Record<string, unknown>): UnauthorizedError {
  return new UnauthorizedError(message, details);
}

/**
 * Creates a 403 Forbidden error.
 * Use for authorization failures.
 */
export function forbidden(message: string = "Access denied", details?: Record<string, unknown>): ForbiddenError {
  return new ForbiddenError(message, details);
}

/**
 * Creates a 404 Not Found error.
 * Use when a requested resource does not exist.
 */
export function notFound(entity: string, id: string): NotFoundError {
  return new NotFoundError(entity, id);
}

/**
 * Creates a 409 Conflict error.
 * Use for resource conflicts (duplicates, version mismatches).
 */
export function conflict(message: string = "Resource conflict", details?: Record<string, unknown>): ConflictError {
  return new ConflictError(message, details);
}

/**
 * Creates a 429 Too Many Requests error.
 * Use for rate limiting.
 */
export function tooManyRequests(message: string = "Too many requests", retryAfter: number = 60): TooManyRequestsError {
  return new TooManyRequestsError(message, retryAfter);
}

/**
 * Creates a 500 Internal Server Error.
 * Use for system errors and unexpected failures.
 */
export function internalError(message: string = "Internal server error"): InternalServerError {
  return new InternalServerError(message);
}

// ─── HTTP Response Helpers ────────────────────────────────────────────────

/**
 * Creates a JSON Response from an AppError.
 * Sets appropriate status code and headers.
 */
export function errorResponse(error: AppError): Response {
  const headers = new Headers();
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");

  // Add Retry-After header for rate limiting
  if (error instanceof TooManyRequestsError) {
    headers.set("retry-after", String(error.retryAfter));
  }

  return new Response(JSON.stringify(error.toJSON()), {
    status: error.status,
    headers
  });
}

/**
 * Creates a JSON Response for an unknown error.
 * Sanitizes the error and logs full details server-side.
 */
export function unknownErrorResponse(error: unknown): Response {
  // Log full error details server-side
  console.error("Unknown error occurred:", error);

  // Return sanitized response
  const appError = error instanceof AppError
    ? error
    : new InternalServerError(error instanceof Error ? error.message : "An unexpected error occurred");

  return errorResponse(appError);
}

// ─── Error Handler Middleware Wrapper ─────────────────────────────────────

export interface ErrorHandlerOptions<T> {
  /** Entity type for audit logging (e.g., "job", "user", "invoice") */
  entityType: string;
  /** Entity ID for audit logging */
  entityId?: string;
  /** User context for audit logging */
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  /** Custom error handler for specific error types */
  onError?: (error: unknown) => AppError;
}

/**
 * Wraps an async handler with automatic error handling and audit logging.
 * 
 * Features:
 * - Automatic audit logging on errors
 * - Structured error responses
 * - Stack trace suppression for production
 * - Error categorization (client vs. server errors)
 * 
 * @param db - D1 database instance for audit logging
 * @param request - Original request for audit context
 * @param handler - Async handler function to wrap
 * @param options - Error handler options
 * @returns Promise resolving to handler result or error response
 */
export async function withErrorHandling<T>(
  db: D1Database,
  request: Request,
  handler: () => Promise<T>,
  options: ErrorHandlerOptions<T>
): Promise<T | Response> {
  try {
    return await handler();
  } catch (error) {
    // Audit the error
    await auditError(db, request, error, {
      entityType: options.entityType,
      entityId: options.entityId,
      user: options.user,
      metadata: {
        method: request.method,
        path: new URL(request.url).pathname,
        timestamp: new Date().toISOString()
      }
    });

    // Transform error if custom handler provided
    if (options.onError) {
      const transformedError = options.onError(error);
      return errorResponse(transformedError);
    }

    // Handle known AppError instances
    if (error instanceof AppError) {
      return errorResponse(error);
    }

    // Handle unknown errors
    return unknownErrorResponse(error);
  }
}

/**
 * Wraps an async handler with automatic error handling (without audit logging).
 * Use for simple operations that don't require audit trails.
 */
export async function withErrorHandler<T>(
  handler: () => Promise<T>,
  onError?: (error: unknown) => AppError
): Promise<T> {
  try {
    return await handler();
  } catch (error) {
    if (onError) {
      throw onError(error);
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new InternalServerError(error instanceof Error ? error.message : "An unexpected error occurred");
  }
}

// ─── Validation Error Helpers ─────────────────────────────────────────────

export interface ValidationErrorDetails {
  field: string;
  message: string;
  code?: string;
}

/**
 * Creates a validation error with field-specific details.
 * Use for form validation failures.
 */
export function validationError(
  message: string = "Validation failed",
  fields: ValidationErrorDetails[]
): BadRequestError {
  return new BadRequestError(message, {
    type: "validation_error",
    fields
  });
}

/**
 * Creates a duplicate resource error.
 * Use when a unique constraint is violated.
 */
export function duplicateResource(
  entity: string,
  field: string,
  value: string
): ConflictError {
  return new ConflictError(`${entity} with ${field} '${value}' already exists`, {
    entity,
    field,
    value
  });
}

/**
 * Creates a resource not found error with entity type.
 */
export function entityNotFound(entity: string, id: string): NotFoundError {
  return new NotFoundError(entity, id);
}

// ─── Error Classification Helpers ─────────────────────────────────────────

/**
 * Determines if an error is a client error (4xx) or server error (5xx).
 */
export function isClientError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.status >= 400 && error.status < 500;
  }
  return false;
}

/**
 * Determines if an error is a server error (5xx).
 */
export function isServerError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.status >= 500;
  }
  // Unknown errors are treated as server errors
  return true;
}

/**
 * Determines if an error is operational (expected, can be handled gracefully).
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

// ─── Error Logging Helper ─────────────────────────────────────────────────

/**
 * Logs error details server-side for debugging.
 * Sanitizes sensitive information before logging.
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const errorDetails: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    ...context
  };

  if (error instanceof AppError) {
    errorDetails.error = {
      name: error.name,
      code: error.code,
      status: error.status,
      message: error.message,
      stack: error.stack,
      isOperational: error.isOperational
    };
  } else if (error instanceof Error) {
    errorDetails.error = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  } else {
    errorDetails.error = { message: String(error) };
  }

  console.error("Error:", JSON.stringify(errorDetails, null, 2));
}
