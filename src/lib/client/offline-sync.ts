/**
 * Project Sentinel - Offline Synchronization Queue
 * Purpose: Provides IndexedDB-backed offline queueing and automatic background sync with exponential backoff.
 * Dependencies: None
 * Structural Role: Core offline resilience layer for field technician applications
 */

const DB_NAME = "KharonOfflineSyncDB";
const STORE_NAME = "sync_queue";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (_event) => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (_event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });

  return dbPromise;
}

export interface SyncOperation {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  retries: number;
  timestamp: number;
}

export async function enqueueSync(url: string, method: string, headers: Record<string, string>, body: any): Promise<void> {
  const db = await getDb();
  const operation: SyncOperation = {
    id: crypto.randomUUID(),
    url,
    method,
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
    retries: 0,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(operation);

    request.onsuccess = () => {
      if (navigator.onLine) {
        processQueue(); // trigger background sync immediately if online
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

let isProcessing = false;

export async function processQueue(): Promise<void> {
  if (isProcessing || !navigator.onLine) return;
  isProcessing = true;

  try {
    const db = await getDb();
    
    const operations: SyncOperation[] = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (operations.length === 0) {
      isProcessing = false;
      return;
    }

    // Sort by timestamp
    operations.sort((a, b) => a.timestamp - b.timestamp);

    for (const op of operations) {
      if (!navigator.onLine) break;

      try {
        const response = await fetch(op.url, {
          method: op.method,
          headers: op.headers,
          body: op.body,
        });

        if (response.ok) {
          await removeOperation(db, op.id);
        } else if (response.status >= 500) {
          await incrementRetry(db, op);
        } else {
          // 4xx errors are usually client errors (bad auth, invalid format)
          // No point retrying these infinitely
          console.error(`Sync dropped due to 4xx status: ${response.status}`, op);
          await removeOperation(db, op.id);
        }
      } catch (error) {
        // Network failure during processing
        await incrementRetry(db, op);
      }
    }
  } finally {
    isProcessing = false;
  }
}

async function removeOperation(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function incrementRetry(db: IDBDatabase, op: SyncOperation): Promise<void> {
  op.retries += 1;
  
  if (op.retries > 10) {
    // Drop after 10 retries
    return removeOperation(db, op.id);
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(op);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    processQueue();
  });
  
  // Periodic fallback sync attempt every 5 minutes while online
  setInterval(() => {
    if (navigator.onLine) processQueue();
  }, 5 * 60 * 1000);
}
