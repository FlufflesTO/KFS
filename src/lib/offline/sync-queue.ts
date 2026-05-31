/**
 * Project Sentinel - Background Sync Queue
 * Purpose: Provides IndexedDB-backed request queue for offline API requests with
 *          automatic retry, exponential backoff, and priority handling.
 * 
 * Features:
 * - Queue POST requests when offline for later synchronization
 * - Priority-based processing (high, normal, low)
 * - Exponential backoff retry logic
 * - Maximum retry limit with failure handling
 * - Online/offline event handling
 * - Service worker communication for queue management
 * - Type-safe with full TypeScript compliance
 * 
 * Queue Processing Flow:
 * 1. Request intercepted by service worker when offline
 * 2. Request queued with priority and timestamp
 * 3. On online event or periodic check, queue is processed
 * 4. Successful requests removed from queue
 * 5. Failed requests retried with exponential backoff
 * 6. After max retries, request marked as failed
 * 
 * Dependencies: None (native IndexedDB API)
 * Structural Role: Client-side offline request queue layer
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type RequestPriority = "low" | "normal" | "high";

export type SyncStatus = "pending" | "processing" | "completed" | "failed";

export interface QueuedRequest {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
  retries: number;
  priority: RequestPriority;
  lastAttempt?: number;
  nextAttempt?: number;
  errorMessage?: string;
}

export interface SyncQueueOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  processIntervalMs?: number;
}

export interface QueueStats {
  totalRequests: number;
  pendingRequests: number;
  processingRequests: number;
  failedRequests: number;
  oldestRequestTimestamp: number | null;
  newestRequestTimestamp: number | null;
  highPriorityCount: number;
}

export interface SyncResult {
  success: number;
  failed: number;
  remaining: number;
}

// ============================================================================
// Constants & Configuration
// ============================================================================

const DB_NAME = "KharonSyncQueueDB";
const DB_VERSION = 2;
const QUEUE_STORE = "sync_queue";

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_BASE_DELAY_MS = 1000; // 1 second
const DEFAULT_MAX_DELAY_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_PROCESS_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Priority weights for sorting
const PRIORITY_WEIGHTS: Record<RequestPriority, number> = {
  high: 0,
  normal: 1,
  low: 2
};

// ============================================================================
// Database Connection
// ============================================================================

let dbPromise: Promise<IDBDatabase> | null = null;
let processIntervalId: number | null = null;

/**
 * Open or retrieve the IndexedDB database connection.
 */
function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      const error = request.error;
      console.error("[SyncQueue] Database open error:", error);
      dbPromise = null;
      reject(new SyncQueueError("Failed to open database", error));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      console.log(
        `[SyncQueue] Database upgrade from version ${oldVersion} to ${DB_VERSION}`
      );

      // Version 1: Initial schema
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const store = db.createObjectStore(QUEUE_STORE, {
            keyPath: "id",
            autoIncrement: true
          });

          // Create indexes for efficient querying
          store.createIndex("url", "url", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("priority", "priority", { unique: false });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("nextAttempt", "nextAttempt", { unique: false });
        }
      }

      // Version 2: Add retry tracking fields
      if (oldVersion < 2) {
        // Fields: lastAttempt, nextAttempt, errorMessage
        // Added implicitly on write
        console.log("[SyncQueue] Migrated to version 2 (retry tracking fields)");
      }
    };
  });

  return dbPromise;
}

/**
 * Reset database connection (for testing or error recovery)
 */
export function resetConnection(): void {
  dbPromise = null;
  if (processIntervalId !== null) {
    window.clearInterval(processIntervalId);
    processIntervalId = null;
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class SyncQueueError extends Error {
  public override readonly cause?: unknown;
  public readonly code: string;
  public override name = "SyncQueueError";

  constructor(message: string, cause?: unknown, code: string = "SYNC_QUEUE_ERROR") {
    super(message);
    this.cause = cause;
    this.code = code;
  }
}

export class SyncQueueQuotaExceededError extends SyncQueueError {
  public override name = "SyncQueueQuotaExceededError";

  constructor(message: string = "Storage quota exceeded") {
    super(message, undefined, "QUOTA_EXCEEDED");
  }
}

// ============================================================================
// Core Queue Operations
// ============================================================================

/**
 * Calculate the next retry delay using exponential backoff with jitter.
 * 
 * @param retries - Number of previous retries
 * @param options - Configuration options
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(
  retries: number,
  options: SyncQueueOptions = {}
): number {
  const baseDelay = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelay = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;

  // Exponential backoff: baseDelay * 2^retries
  const exponentialDelay = baseDelay * Math.pow(2, retries);

  // Add jitter (±25% randomness)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  const delayWithJitter = exponentialDelay + jitter;

  // Cap at maximum delay
  return Math.min(delayWithJitter, maxDelay);
}

/**
 * Add a request to the sync queue.
 * 
 * @param url - Request URL
 * @param method - HTTP method
 * @param headers - Request headers
 * @param body - Request body (string or null)
 * @param priority - Request priority (default: "normal")
 * @param options - Configuration options
 * @returns Queue item ID
 * @throws {SyncQueueQuotaExceededError} If storage quota is exceeded
 * @throws {SyncQueueError} For other storage errors
 */
export async function enqueueRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string | null,
  priority: RequestPriority = "normal",
  _options: SyncQueueOptions = {}
): Promise<number> {
  let db: IDBDatabase | null = null;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new SyncQueueError("Failed to open database", error, "DB_OPEN_FAILED");
  }

  const now = Date.now();
  const queuedRequest: QueuedRequest = {
    url,
    method,
    headers,
    body,
    timestamp: now,
    retries: 0,
    priority,
    lastAttempt: undefined,
    nextAttempt: now // Ready for immediate processing
  };

  return new Promise<number>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(QUEUE_STORE, "readwrite");
    } catch (error) {
      reject(new SyncQueueError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      const error = tx.error;

      if (
        error?.name === "QuotaExceededError" ||
        error?.message?.includes("quota")
      ) {
        reject(new SyncQueueQuotaExceededError());
      } else {
        reject(new SyncQueueError("Transaction error", error));
      }
    };

    const store = tx.objectStore(QUEUE_STORE);
    const request = store.add(queuedRequest);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      const error = request.error;

      if (
        error?.name === "QuotaExceededError" ||
        error?.message?.includes("quota")
      ) {
        reject(new SyncQueueQuotaExceededError());
      } else {
        reject(new SyncQueueError("Failed to enqueue request", error));
      }
    };
  });
}

/**
 * Get a queued request by ID.
 * 
 * @param id - Queue item ID
 * @returns The queued request or null if not found
 * @throws {SyncQueueError} For storage errors
 */
export async function getQueuedRequest(id: number): Promise<QueuedRequest | null> {
  let db: IDBDatabase | null = null;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new SyncQueueError("Failed to open database", error, "DB_OPEN_FAILED");
  }

  return new Promise<QueuedRequest | null>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(QUEUE_STORE, "readonly");
    } catch (error) {
      reject(new SyncQueueError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      reject(new SyncQueueError("Transaction error", tx.error));
    };

    const store = tx.objectStore(QUEUE_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as QueuedRequest | null);
    };

    request.onerror = () => {
      reject(new SyncQueueError("Failed to retrieve queued request", request.error));
    };
  });
}

/**
 * Get all queued requests, sorted by priority and timestamp.
 * 
 * @param options - Configuration options
 * @returns Array of queued requests
 * @throws {SyncQueueError} For storage errors
 */
export async function getAllQueuedRequests(
  _options: SyncQueueOptions = {}
): Promise<QueuedRequest[]> {
  let db: IDBDatabase | null = null;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new SyncQueueError("Failed to open database", error, "DB_OPEN_FAILED");
  }

  return new Promise<QueuedRequest[]>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(QUEUE_STORE, "readonly");
    } catch (error) {
      reject(new SyncQueueError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      reject(new SyncQueueError("Transaction error", tx.error));
    };

    const store = tx.objectStore(QUEUE_STORE);
    const request = store.getAll() as IDBRequest<QueuedRequest[]>;

    request.onsuccess = () => {
      const items = request.result;

      // Sort by priority (high first) then by nextAttempt (soonest first)
      items.sort((a, b) => {
        const priorityDiff = PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        const now = Date.now();
        const aReady = (a.nextAttempt ?? now) <= now;
        const bReady = (b.nextAttempt ?? now) <= now;

        // Ready items first
        if (aReady && !bReady) return -1;
        if (!aReady && bReady) return 1;

        // Then by nextAttempt
        const attemptDiff = (a.nextAttempt ?? 0) - (b.nextAttempt ?? 0);
        if (attemptDiff !== 0) return attemptDiff;

        // Finally by timestamp (oldest first)
        return a.timestamp - b.timestamp;
      });

      resolve(items);
    };

    request.onerror = () => {
      reject(new SyncQueueError("Failed to retrieve queued requests", request.error));
    };
  });
}

/**
 * Get queued requests that are ready for processing.
 * 
 * @returns Array of ready queued requests
 * @throws {SyncQueueError} For storage errors
 */
export async function getReadyQueuedRequests(): Promise<QueuedRequest[]> {
  const allRequests = await getAllQueuedRequests();
  const now = Date.now();

  return allRequests.filter((req) => (req.nextAttempt ?? now) <= now);
}

/**
 * Delete a queued request by ID.
 * 
 * @param id - Queue item ID
 * @returns True if deleted, false if not found
 * @throws {SyncQueueError} For storage errors
 */
export async function deleteQueuedRequest(id: number): Promise<boolean> {
  let db: IDBDatabase | null = null;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new SyncQueueError("Failed to open database", error, "DB_OPEN_FAILED");
  }

  return new Promise<boolean>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(QUEUE_STORE, "readwrite");
    } catch (error) {
      reject(new SyncQueueError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      reject(new SyncQueueError("Transaction error", tx.error));
    };

    const store = tx.objectStore(QUEUE_STORE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      if (getRequest.result) {
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => resolve(true);
        deleteRequest.onerror = () =>
          reject(new SyncQueueError("Failed to delete request", deleteRequest.error));
      } else {
        resolve(false);
      }
    };

    getRequest.onerror = () => {
      reject(new SyncQueueError("Failed to check for request", getRequest.error));
    };
  });
}

/**
 * Update a queued request's retry information.
 * 
 * @param id - Queue item ID
 * @param retries - New retry count
 * @param errorMessage - Optional error message
 * @param options - Configuration options
 * @throws {SyncQueueError} For storage errors
 */
export async function updateRequestRetry(
  id: number,
  retries: number,
  errorMessage?: string,
  options: SyncQueueOptions = {}
): Promise<void> {
  let db: IDBDatabase | null = null;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new SyncQueueError("Failed to open database", error, "DB_OPEN_FAILED");
  }

  return new Promise<void>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(QUEUE_STORE, "readwrite");
    } catch (error) {
      reject(new SyncQueueError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      reject(new SyncQueueError("Transaction error", tx.error));
    };

    const store = tx.objectStore(QUEUE_STORE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const item = getRequest.result as QueuedRequest | undefined;

      if (!item) {
        tx.abort();
        reject(new SyncQueueError(`Request not found: ${id}`, undefined, "NOT_FOUND"));
        return;
      }

      const maxDelay = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
      const nextAttemptDelay = calculateBackoffDelay(retries, options);

      const updatedItem: QueuedRequest = {
        ...item,
        retries,
        lastAttempt: Date.now(),
        nextAttempt: Date.now() + Math.min(nextAttemptDelay, maxDelay)
      };

      if (errorMessage) {
        updatedItem.errorMessage = errorMessage;
      }

      const putRequest = store.put(updatedItem);

      putRequest.onsuccess = () => {
        resolve();
      };

      putRequest.onerror = () => {
        reject(new SyncQueueError("Failed to update request retry", putRequest.error));
      };
    };

    getRequest.onerror = () => {
      reject(new SyncQueueError("Failed to retrieve request", getRequest.error));
    };
  });
}

/**
 * Clear all queued requests from storage.
 * 
 * @returns Number of requests cleared
 * @throws {SyncQueueError} For storage errors
 */
export async function clearQueue(): Promise<number> {
  let db: IDBDatabase | null = null;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new SyncQueueError("Failed to open database", error, "DB_OPEN_FAILED");
  }

  return new Promise<number>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(QUEUE_STORE, "readwrite");
    } catch (error) {
      reject(new SyncQueueError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      reject(new SyncQueueError("Transaction error", tx.error));
    };

    const store = tx.objectStore(QUEUE_STORE);
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      const count = countRequest.result;
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        resolve(count);
      };

      clearRequest.onerror = () => {
        reject(new SyncQueueError("Failed to clear queue", clearRequest.error));
      };
    };

    countRequest.onerror = () => {
      reject(new SyncQueueError("Failed to count requests", countRequest.error));
    };
  });
}

// ============================================================================
// Queue Processing
// ============================================================================

/**
 * Process a single queued request.
 * 
 * @param item - Queued request to process
 * @param options - Configuration options
 * @returns True if successful, false if failed
 */
async function processSingleRequest(
  item: QueuedRequest,
  options: SyncQueueOptions = {}
): Promise<boolean> {
  if (item.id === undefined) {
    return false;
  }

  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  try {
    const response = await fetch(item.url, {
      method: item.method,
      headers: item.headers,
      body: item.body
    });

    if (response.ok || response.status < 500) {
      // Success or non-retryable client error - remove from queue
      await deleteQueuedRequest(item.id);
      return true;
    } else {
      // 5xx error - retry later
      const newRetries = (item.retries || 0) + 1;

      if (newRetries >= maxRetries) {
        // Max retries exceeded, remove from queue
        await deleteQueuedRequest(item.id);
        return false;
      } else {
        // Update retry count with backoff
        await updateRequestRetry(
          item.id,
          newRetries,
          `Server error: ${response.status}`,
          options
        );
        return false;
      }
    }
  } catch (fetchError) {
    // Network error - update retry with backoff
    const newRetries = (item.retries || 0) + 1;
    const errorMessage = fetchError instanceof Error ? fetchError.message : "Network error";

    if (newRetries >= maxRetries) {
      // Max retries exceeded, remove from queue
      await deleteQueuedRequest(item.id);
      return false;
    } else {
      await updateRequestRetry(item.id, newRetries, errorMessage, options);
      return false;
    }
  }
}

/**
 * Process all ready queued requests.
 * 
 * @param options - Configuration options
 * @returns Sync result with success/failed counts
 */
export async function processQueue(options: SyncQueueOptions = {}): Promise<SyncResult> {
  const readyRequests = await getReadyQueuedRequests();

  if (readyRequests.length === 0) {
    return { success: 0, failed: 0, remaining: 0 };
  }

  let successCount = 0;
  let failedCount = 0;

  for (const item of readyRequests) {
    const success = await processSingleRequest(item, options);

    if (success) {
      successCount++;
    } else {
      failedCount++;
    }
  }

  const remainingCount = await getQueueCount();

  return {
    success: successCount,
    failed: failedCount,
    remaining: remainingCount
  };
}

/**
 * Get the count of queued requests.
 * 
 * @returns Number of queued requests
 * @throws {SyncQueueError} For storage errors
 */
export async function getQueueCount(): Promise<number> {
  let db: IDBDatabase | null = null;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new SyncQueueError("Failed to open database", error, "DB_OPEN_FAILED");
  }

  return new Promise<number>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(QUEUE_STORE, "readonly");
    } catch (error) {
      reject(new SyncQueueError("Failed to start transaction", error));
      resolve(0);
      return;
    }

    tx.onerror = () => {
      resolve(0);
    };

    const store = tx.objectStore(QUEUE_STORE);
    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      resolve(0);
    };
  });
}

/**
 * Get queue statistics.
 * 
 * @returns Queue statistics
 * @throws {SyncQueueError} For storage errors
 */
export async function getQueueStats(): Promise<QueueStats> {
  const requests = await getAllQueuedRequests();

  const stats: QueueStats = {
    totalRequests: requests.length,
    pendingRequests: 0,
    processingRequests: 0,
    failedRequests: 0,
    oldestRequestTimestamp: null,
    newestRequestTimestamp: null,
    highPriorityCount: 0
  };

  const now = Date.now();

  for (const req of requests) {
    // Count by status
    if ((req.nextAttempt ?? now) <= now) {
      stats.pendingRequests++;
    } else {
      stats.processingRequests++;
    }

    if ((req.retries || 0) >= (DEFAULT_MAX_RETRIES - 1)) {
      stats.failedRequests++;
    }

    // Count high priority
    if (req.priority === "high") {
      stats.highPriorityCount++;
    }

    // Track timestamps
    if (stats.oldestRequestTimestamp === null || req.timestamp < stats.oldestRequestTimestamp) {
      stats.oldestRequestTimestamp = req.timestamp;
    }

    if (stats.newestRequestTimestamp === null || req.timestamp > stats.newestRequestTimestamp) {
      stats.newestRequestTimestamp = req.timestamp;
    }
  }

  return stats;
}

// ============================================================================
// Automatic Processing & Event Handlers
// ============================================================================

/**
 * Start automatic queue processing.
 * Processes queue on online events and at regular intervals.
 * 
 * @param options - Configuration options
 */
export function startAutoProcessing(options: SyncQueueOptions = {}): void {
  const processIntervalMs = options.processIntervalMs ?? DEFAULT_PROCESS_INTERVAL_MS;

  // Stop any existing processing
  stopAutoProcessing();

  // Process on online event
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      console.log("[SyncQueue] Online event detected, processing queue");
      processQueue(options).catch((error) => {
        console.error("[SyncQueue] Auto-processing error:", error);
      });
    });

    // Start periodic processing
    processIntervalId = window.setInterval(() => {
      if (navigator.onLine) {
        processQueue(options).catch((error) => {
          console.error("[SyncQueue] Periodic processing error:", error);
        });
      }
    }, processIntervalMs);

    // Initial processing if online
    if (navigator.onLine) {
      processQueue(options).catch((error) => {
        console.error("[SyncQueue] Initial processing error:", error);
      });
    }
  }
}

/**
 * Stop automatic queue processing.
 */
export function stopAutoProcessing(): void {
  if (processIntervalId !== null) {
    window.clearInterval(processIntervalId);
    processIntervalId = null;
  }
}

// ============================================================================
// Service Worker Communication
// ============================================================================

/**
 * Send queue drain request to service worker.
 * 
 * @returns Promise that resolves with sync result
 */
export function drainQueueViaServiceWorker(): Promise<SyncResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      // No service worker, process directly
      processQueue().then(resolve).catch(reject);
      return;
    }

    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      const response = event.data;

      if (response.type === "QUEUE_DRAIN_COMPLETE") {
        resolve({
          success: response.success ?? 0,
          failed: response.failed ?? 0,
          remaining: response.remaining ?? 0
        });
      }
    };

    navigator.serviceWorker.controller.postMessage(
      { type: "DRAIN_QUEUE" },
      [messageChannel.port2]
    );

    // Timeout after 30 seconds
    setTimeout(() => {
      reject(new SyncQueueError("Queue drain timeout"));
    }, 30000);
  });
}

/**
 * Get queue count via service worker.
 * 
 * @returns Promise that resolves with queue count
 */
export function getQueueCountViaServiceWorker(): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      // No service worker, get directly
      getQueueCount().then(resolve).catch(reject);
      return;
    }

    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      const response = event.data;

      if (response.type === "QUEUE_COUNT") {
        resolve(response.count ?? 0);
      }
    };

    navigator.serviceWorker.controller.postMessage(
      { type: "GET_QUEUE_COUNT" },
      [messageChannel.port2]
    );

    // Timeout after 5 seconds
    setTimeout(() => {
      reject(new SyncQueueError("Queue count timeout"));
    }, 5000);
  });
}

// ============================================================================
// Initialization Helper
// ============================================================================

/**
 * Initialize the sync queue system.
 * Call this once at application startup.
 * 
 * @param options - Configuration options
 */
export function initialize(options: SyncQueueOptions = {}): void {
  // Open database to trigger any migrations
  openDatabase().catch((error) => {
    console.error("[SyncQueue] Initialization error:", error);
  });

  // Start automatic processing
  startAutoProcessing(options);

  console.log("[SyncQueue] Initialized with options:", options);
}

/**
 * Cleanup the sync queue system.
 * Call this when the application is shutting down.
 */
export function cleanup(): void {
  stopAutoProcessing();
  resetConnection();
  console.log("[SyncQueue] Cleaned up");
}
