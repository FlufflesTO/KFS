/**
 * Project Sentinel - Offline Draft Storage
 * Purpose: Provides IndexedDB-backed draft storage for jobcard data during offline periods.
 *          Supports POPIA Section 14 data minimization by tracking draft lifecycle.
 * 
 * Features:
 * - Save draft: Store jobcard data locally when offline or explicitly saved
 * - Retrieve draft: Load draft for jobcard form pre-population
 * - Sync pending drafts: Queue drafts for server sync when online
 * - Clear synced drafts: Remove drafts after successful server submission
 * - Transaction safety: Handle IndexedDB transaction errors gracefully
 * - Type safety: Full TypeScript compliance with exactOptionalPropertyTypes
 * 
 * Database Schema:
 * - Store: drafts
 * - Fields: id (auto-increment), jobId, data, timestamp, status, syncAttempts, lastSyncAttempt, errorMessage
 * - Indexes: jobId, status, timestamp
 * 
 * Draft Status Flow:
 * pending -> syncing -> synced (deleted)
 *              |-> failed -> pending (retry)
 * 
 * Dependencies: None (native IndexedDB API)
 * Structural Role: Client-side offline data persistence layer
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type DraftStatus = "pending" | "syncing" | "synced" | "failed";

export interface Draft {
  id?: number;
  jobId: string;
  data: Record<string, unknown>;
  timestamp: number;
  status: DraftStatus;
  syncAttempts: number;
  lastSyncAttempt?: number;
  errorMessage?: string;
}

export interface DraftStorageOptions {
  maxSyncAttempts?: number;
  maxAgeDays?: number;
}

export interface DraftSyncResult {
  success: boolean;
  draftId?: number;
  error?: string;
}

export interface DraftStats {
  totalDrafts: number;
  pendingDrafts: number;
  syncingDrafts: number;
  failedDrafts: number;
  oldestDraftTimestamp: number | null;
  newestDraftTimestamp: number | null;
}

// ============================================================================
// Constants & Configuration
// ============================================================================

const DB_NAME = "KharonDraftStorageDB";
const DB_VERSION = 2;
const DRAFTS_STORE = "drafts";

const DEFAULT_MAX_SYNC_ATTEMPTS = 5;
const DEFAULT_MAX_AGE_DAYS = 30;

// ============================================================================
// Database Connection
// ============================================================================

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open or retrieve the IndexedDB database connection.
 * Implements version migration for schema updates.
 */
function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      const error = request.error;
      console.error("[DraftStorage] Database open error:", error);
      dbPromise = null;
      reject(new DraftStorageError("Failed to open database", error));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      console.log(
        `[DraftStorage] Database upgrade from version ${oldVersion} to ${DB_VERSION}`
      );

      // Version 1: Initial schema
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
          const store = db.createObjectStore(DRAFTS_STORE, {
            keyPath: "id",
            autoIncrement: true
          });

          // Create indexes for efficient querying
          store.createIndex("jobId", "jobId", { unique: false });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("jobIdStatus", ["jobId", "status"], {
            unique: false
          });
        }
      }

      // Version 2: Add sync tracking fields (implicit migration)
      // Fields: syncAttempts, lastSyncAttempt, errorMessage
      // These are added implicitly when records are written
      if (oldVersion < 2) {
        // No structural changes needed - fields are optional and added on write
        console.log("[DraftStorage] Migrated to version 2 (sync tracking fields)");
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
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class DraftStorageError extends Error {
  public readonly cause?: unknown;
  public readonly code: string;
  public override name = "DraftStorageError";

  constructor(message: string, cause?: unknown, code: string = "DRAFT_STORAGE_ERROR") {
    super(message);
    this.cause = cause;
    this.code = code;
  }
}

export class DraftQuotaExceededError extends DraftStorageError {
  public override name = "DraftQuotaExceededError";
  
  constructor(message: string = "Storage quota exceeded") {
    super(message, undefined, "QUOTA_EXCEEDED");
  }
}

export class DraftNotFoundError extends DraftStorageError {
  constructor(jobId: string) {
    super(`Draft not found for job: ${jobId}`, undefined, "DRAFT_NOT_FOUND");
    this.name = "DraftNotFoundError";
  }
}

export class DraftVersionConflictError extends DraftStorageError {
  constructor(message: string = "Draft version conflict") {
    super(message, undefined, "VERSION_CONFLICT");
    this.name = "DraftVersionConflictError";
  }
}

// ============================================================================
// Core Draft Operations
// ============================================================================

/**
 * Save a draft for a jobcard.
 * If a draft already exists for the jobId, it will be updated.
 * 
 * @param jobId - Unique identifier for the job
 * @param data - Jobcard data to store
 * @param options - Optional configuration
 * @returns Draft ID for the saved draft
 * @throws {DraftQuotaExceededError} If storage quota is exceeded
 * @throws {DraftStorageError} For other storage errors
 */
export async function saveDraft(
  jobId: string,
  data: Record<string, unknown>
): Promise<number> {
  let db: IDBDatabase;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new DraftStorageError(
      "Failed to open database",
      error,
      "DB_OPEN_FAILED"
    );
  }

  return new Promise<number>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(DRAFTS_STORE, "readwrite");
    } catch (error) {
      reject(new DraftStorageError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      const error = tx.error;
      
      // Check for quota exceeded
      if (
        error?.name === "QuotaExceededError" ||
        error?.message?.includes("quota")
      ) {
        reject(new DraftQuotaExceededError());
      } else {
        reject(new DraftStorageError("Transaction error", error));
      }
    };

    const store = tx.objectStore(DRAFTS_STORE);
    const index = store.index("jobId");
    const getRequest = index.get(jobId);

    getRequest.onsuccess = () => {
      const existing = getRequest.result as Draft | undefined;
      const now = Date.now();

      let draftToSave: Draft;

      if (existing && existing.id !== undefined) {
        // Update existing draft
        draftToSave = {
          ...existing,
          data,
          timestamp: now,
          status: "pending" as DraftStatus,
          syncAttempts: 0,
          lastSyncAttempt: undefined,
          errorMessage: undefined
        };
      } else {
        // Create new draft
        draftToSave = {
          jobId,
          data,
          timestamp: now,
          status: "pending" as DraftStatus,
          syncAttempts: 0
        };
      }

      const putRequest = store.put(draftToSave);

      putRequest.onsuccess = () => {
        resolve(putRequest.result as number);
      };

      putRequest.onerror = () => {
        const error = putRequest.error;
        
        if (
          error?.name === "QuotaExceededError" ||
          error?.message?.includes("quota")
        ) {
          reject(new DraftQuotaExceededError());
        } else {
          reject(new DraftStorageError("Failed to save draft", error));
        }
      };
    };

    getRequest.onerror = () => {
      reject(new DraftStorageError("Failed to check for existing draft", getRequest.error));
    };

    tx.oncomplete = () => {};
  });
}

/**
 * Retrieve a draft by job ID.
 * 
 * @param jobId - Unique identifier for the job
 * @returns The draft if found, null otherwise
 * @throws {DraftStorageError} For storage errors
 */
export async function getDraft(jobId: string): Promise<Draft | null> {
  let db: IDBDatabase;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new DraftStorageError(
      "Failed to open database",
      error,
      "DB_OPEN_FAILED"
    );
  }

  return new Promise<Draft | null>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(DRAFTS_STORE, "readonly");
    } catch (error) {
      reject(new DraftStorageError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      reject(new DraftStorageError("Transaction error", tx.error));
    };

    const store = tx.objectStore(DRAFTS_STORE);
    const index = store.index("jobId");
    const request = index.get(jobId);

    request.onsuccess = () => {
      const result = request.result as Draft | undefined;
      resolve(result ?? null);
    };

    request.onerror = () => {
      reject(new DraftStorageError("Failed to retrieve draft", request.error));
    };
  });
}

/**
 * Retrieve a draft by its ID.
 * 
 * @param id - Draft ID
 * @returns The draft if found, null otherwise
 * @throws {DraftStorageError} For storage errors
 */
export async function getDraftById(id: number): Promise<Draft | null> {
  let db: IDBDatabase;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new DraftStorageError(
      "Failed to open database",
      error,
      "DB_OPEN_FAILED"
    );
  }

  return new Promise<Draft | null>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(DRAFTS_STORE, "readonly");
    } catch (error) {
      reject(new DraftStorageError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      reject(new DraftStorageError("Transaction error", tx.error));
    };

    const store = tx.objectStore(DRAFTS_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      const result = request.result as Draft | undefined;
      resolve(result ?? null);
    };

    request.onerror = () => {
      reject(new DraftStorageError("Failed to retrieve draft", request.error));
    };
  });
}

/**
 * Retrieve all drafts, optionally filtered by status.
 * 
 * @param status - Optional status filter
 * @returns Array of drafts
 * @throws {DraftStorageError} For storage errors
 */
export async function getAllDrafts(status?: DraftStatus): Promise<Draft[]> {
  let db: IDBDatabase;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new DraftStorageError(
      "Failed to open database",
      error,
      "DB_OPEN_FAILED"
    );
  }

  return new Promise<Draft[]>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(DRAFTS_STORE, "readonly");
    } catch (error) {
      reject(new DraftStorageError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      reject(new DraftStorageError("Transaction error", tx.error));
    };

    const store = tx.objectStore(DRAFTS_STORE);
    let request: IDBRequest<Draft[]>;

    if (status) {
      const index = store.index("status");
      request = index.getAll(status) as IDBRequest<Draft[]>;
    } else {
      request = store.getAll() as IDBRequest<Draft[]>;
    }

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new DraftStorageError("Failed to retrieve drafts", request.error));
    };
  });
}

/**
 * Delete a draft by its ID.
 * 
 * @param id - Draft ID to delete
 * @returns True if draft was deleted, false if not found
 * @throws {DraftStorageError} For storage errors
 */
export async function deleteDraft(id: number): Promise<boolean> {
  let db: IDBDatabase;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new DraftStorageError(
      "Failed to open database",
      error,
      "DB_OPEN_FAILED"
    );
  }

  return new Promise<boolean>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(DRAFTS_STORE, "readwrite");
    } catch (error) {
      reject(new DraftStorageError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      reject(new DraftStorageError("Transaction error", tx.error));
    };

    const store = tx.objectStore(DRAFTS_STORE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      if (getRequest.result) {
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => resolve(true);
        deleteRequest.onerror = () =>
          reject(new DraftStorageError("Failed to delete draft", deleteRequest.error));
      } else {
        resolve(false);
      }
    };

    getRequest.onerror = () => {
      reject(new DraftStorageError("Failed to check for draft", getRequest.error));
    };
  });
}

/**
 * Delete a draft by job ID.
 * 
 * @param jobId - Job ID for the draft to delete
 * @returns True if draft was deleted, false if not found
 * @throws {DraftStorageError} For storage errors
 */
export async function deleteDraftByJobId(jobId: string): Promise<boolean> {
  const draft = await getDraft(jobId);
  
  if (!draft || draft.id === undefined) {
    return false;
  }

  return deleteDraft(draft.id);
}

/**
 * Clear all drafts from storage.
 * 
 * @returns Number of drafts cleared
 * @throws {DraftStorageError} For storage errors
 */
export async function clearAllDrafts(): Promise<number> {
  let db: IDBDatabase;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new DraftStorageError(
      "Failed to open database",
      error,
      "DB_OPEN_FAILED"
    );
  }

  return new Promise<number>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(DRAFTS_STORE, "readwrite");
    } catch (error) {
      reject(new DraftStorageError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      reject(new DraftStorageError("Transaction error", tx.error));
    };

    const store = tx.objectStore(DRAFTS_STORE);
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      const count = countRequest.result;
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        resolve(count);
      };

      clearRequest.onerror = () => {
        reject(new DraftStorageError("Failed to clear drafts", clearRequest.error));
      };
    };

    countRequest.onerror = () => {
      reject(new DraftStorageError("Failed to count drafts", countRequest.error));
    };
  });
}

// ============================================================================
// Draft Status Management
// ============================================================================

/**
 * Update the status of a draft.
 * 
 * @param id - Draft ID
 * @param status - New status
 * @param errorMessage - Optional error message for failed status
 * @throws {DraftNotFoundError} If draft not found
 * @throws {DraftStorageError} For storage errors
 */
export async function updateDraftStatus(
  id: number,
  status: DraftStatus,
  errorMessage?: string
): Promise<void> {
  let db: IDBDatabase;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new DraftStorageError(
      "Failed to open database",
      error,
      "DB_OPEN_FAILED"
    );
  }

  return new Promise<void>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(DRAFTS_STORE, "readwrite");
    } catch (error) {
      reject(new DraftStorageError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      reject(new DraftStorageError("Transaction error", tx.error));
    };

    const store = tx.objectStore(DRAFTS_STORE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const draft = getRequest.result as Draft | undefined;

      if (!draft) {
        tx.abort();
        reject(new DraftNotFoundError(String(id)));
        return;
      }

      const updatedDraft: Draft = {
        ...draft,
        status,
        lastSyncAttempt: Date.now(),
        syncAttempts: (draft.syncAttempts || 0) + 1
      };

      if (errorMessage) {
        updatedDraft.errorMessage = errorMessage;
      }

      const putRequest = store.put(updatedDraft);

      putRequest.onsuccess = () => {
        resolve();
      };

      putRequest.onerror = () => {
        reject(new DraftStorageError("Failed to update draft status", putRequest.error));
      };
    };

    getRequest.onerror = () => {
      reject(new DraftStorageError("Failed to retrieve draft", getRequest.error));
    };
  });
}

/**
 * Mark a draft as synced and delete it from local storage.
 * 
 * @param id - Draft ID
 * @returns True if draft was marked as synced and deleted
 * @throws {DraftStorageError} For storage errors
 */
export async function markDraftAsSynced(id: number): Promise<boolean> {
  // Update status first (for audit trail if needed)
  try {
    await updateDraftStatus(id, "synced");
  } catch (error) {
    // Draft might not exist, continue to delete
    if (!(error instanceof DraftNotFoundError)) {
      throw error;
    }
  }

  // Delete the synced draft
  return deleteDraft(id);
}

/**
 * Increment sync attempts and update status if max attempts exceeded.
 * 
 * @param id - Draft ID
 * @param error - Error that caused the sync failure
 * @param options - Optional configuration
 * @returns Updated draft status
 * @throws {DraftStorageError} For storage errors
 */
export async function handleDraftSyncFailure(
  id: number,
  error: Error,
  options: DraftStorageOptions = {}
): Promise<DraftStatus> {
  const maxAttempts = options.maxSyncAttempts ?? DEFAULT_MAX_SYNC_ATTEMPTS;

  const draft = await getDraftById(id);

  if (!draft || draft.id === undefined) {
    throw new DraftNotFoundError(String(id));
  }

  const newSyncAttempts = (draft.syncAttempts || 0) + 1;

  if (newSyncAttempts >= maxAttempts) {
    // Max attempts exceeded, mark as failed
    await updateDraftStatus(
      id,
      "failed",
      `Max sync attempts (${maxAttempts}) exceeded. Last error: ${error.message}`
    );
    return "failed";
  } else {
    // Keep as pending for retry
    await updateDraftStatus(
      id,
      "pending",
      `Sync attempt ${newSyncAttempts} failed: ${error.message}`
    );
    return "pending";
  }
}

// ============================================================================
// Draft Cleanup & Maintenance
// ============================================================================

/**
 * Delete old drafts based on age.
 * 
 * @param maxAgeDays - Maximum age in days (default: 30)
 * @returns Number of drafts deleted
 * @throws {DraftStorageError} For storage errors
 */
export async function deleteOldDrafts(maxAgeDays: number = DEFAULT_MAX_AGE_DAYS): Promise<number> {
  let db: IDBDatabase;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new DraftStorageError(
      "Failed to open database",
      error,
      "DB_OPEN_FAILED"
    );
  }

  const cutoffTimestamp = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
  let deletedCount = 0;

  return new Promise<number>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(DRAFTS_STORE, "readwrite");
    } catch (error) {
      reject(new DraftStorageError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      reject(new DraftStorageError("Transaction error", tx.error));
    };

    const store = tx.objectStore(DRAFTS_STORE);
    const index = store.index("timestamp");
    const request = index.openCursor();

    request.onsuccess = () => {
      const cursor = request.result as IDBCursorWithValue | null;

      if (cursor) {
        const draft = cursor.value as Draft;

        if (draft.timestamp < cutoffTimestamp) {
          const deleteRequest = cursor.delete();
          
          deleteRequest.onsuccess = () => {
            deletedCount++;
            cursor.continue();
          };

          deleteRequest.onerror = () => {
            reject(new DraftStorageError("Failed to delete old draft", deleteRequest.error));
          };
        } else {
          // All remaining drafts are newer than cutoff
          resolve(deletedCount);
        }
      } else {
        resolve(deletedCount);
      }
    };

    request.onerror = () => {
      reject(new DraftStorageError("Failed to iterate drafts", request.error));
    };
  });
}

/**
 * Delete all synced drafts (already successfully submitted to server).
 * 
 * @returns Number of drafts deleted
 * @throws {DraftStorageError} For storage errors
 */
export async function deleteSyncedDrafts(): Promise<number> {
  let db: IDBDatabase;

  try {
    db = await openDatabase();
  } catch (error) {
    throw new DraftStorageError(
      "Failed to open database",
      error,
      "DB_OPEN_FAILED"
    );
  }

  let deletedCount = 0;

  return new Promise<number>((resolve, reject) => {
    let tx: IDBTransaction;

    try {
      tx = db.transaction(DRAFTS_STORE, "readwrite");
    } catch (error) {
      reject(new DraftStorageError("Failed to start transaction", error));
      return;
    }

    tx.onerror = () => {
      reject(new DraftStorageError("Transaction error", tx.error));
    };

    const store = tx.objectStore(DRAFTS_STORE);
    const index = store.index("status");
    const request = index.openCursor("synced");

    request.onsuccess = () => {
      const cursor = request.result as IDBCursorWithValue | null;

      if (cursor) {
        const deleteRequest = cursor.delete();

        deleteRequest.onsuccess = () => {
          deletedCount++;
          cursor.continue();
        };

        deleteRequest.onerror = () => {
          reject(new DraftStorageError("Failed to delete synced draft", deleteRequest.error));
        };
      } else {
        resolve(deletedCount);
      }
    };

    request.onerror = () => {
      reject(new DraftStorageError("Failed to iterate synced drafts", request.error));
    };
  });
}

/**
 * Get statistics about stored drafts.
 * 
 * @returns Draft statistics
 * @throws {DraftStorageError} For storage errors
 */
export async function getDraftStats(): Promise<DraftStats> {
  const drafts = await getAllDrafts();

  const stats: DraftStats = {
    totalDrafts: drafts.length,
    pendingDrafts: 0,
    syncingDrafts: 0,
    failedDrafts: 0,
    oldestDraftTimestamp: null,
    newestDraftTimestamp: null
  };

  for (const draft of drafts) {
    switch (draft.status) {
      case "pending":
        stats.pendingDrafts++;
        break;
      case "syncing":
        stats.syncingDrafts++;
        break;
      case "failed":
        stats.failedDrafts++;
        break;
    }

    if (stats.oldestDraftTimestamp === null || draft.timestamp < stats.oldestDraftTimestamp) {
      stats.oldestDraftTimestamp = draft.timestamp;
    }

    if (stats.newestDraftTimestamp === null || draft.timestamp > stats.newestDraftTimestamp) {
      stats.newestDraftTimestamp = draft.timestamp;
    }
  }

  return stats;
}

/**
 * Check if a draft exists for a given job ID.
 * 
 * @param jobId - Job ID to check
 * @returns True if draft exists
 */
export async function hasDraft(jobId: string): Promise<boolean> {
  const draft = await getDraft(jobId);
  return draft !== null;
}

// ============================================================================
// Service Worker Communication
// ============================================================================

/**
 * Send draft save request to service worker.
 * 
 * @param jobId - Job ID for the draft
 * @param data - Draft data
 * @returns Promise that resolves when draft is saved
 */
export function saveDraftViaServiceWorker(
  jobId: string,
  data: Record<string, unknown>
): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      // No service worker, save directly
      saveDraft(jobId, data).then(resolve).catch(reject);
      return;
    }

    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      const response = event.data;

      if (response.type === "DRAFT_SAVED") {
        resolve(response.id);
      } else if (response.type === "DRAFT_SAVE_ERROR") {
        reject(new DraftStorageError(response.error));
      }
    };

    navigator.serviceWorker.controller.postMessage(
      {
        type: "SAVE_DRAFT",
        jobId,
        data
      },
      [messageChannel.port2]
    );
  });
}

/**
 * Request draft retrieval from service worker.
 * 
 * @param jobId - Job ID for the draft
 * @returns Promise that resolves with the draft or null
 */
export function getDraftViaServiceWorker(jobId: string): Promise<Draft | null> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      // No service worker, get directly
      getDraft(jobId).then(resolve).catch(reject);
      return;
    }

    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      const response = event.data;

      if (response.type === "DRAFT_RETRIEVED") {
        resolve(response.draft);
      }
    };

    navigator.serviceWorker.controller.postMessage(
      {
        type: "GET_DRAFT",
        jobId
      },
      [messageChannel.port2]
    );
  });
}
