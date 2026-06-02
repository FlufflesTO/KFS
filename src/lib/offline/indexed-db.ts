/**
 * Project Sentinel - IndexedDB Wrapper
 * Purpose: Provides a generic, promise-based wrapper for IndexedDB operations.
 * Dependencies: None (native IndexedDB API)
 * Structural Role: Base persistence layer for offline operations.
 */

export class KharonDBError extends Error {
  public override readonly cause?: unknown;
  public readonly code: string;
  public override name = "KharonDBError";

  constructor(message: string, cause?: unknown, code: string = "DB_ERROR") {
    super(message);
    this.cause = cause;
    this.code = code;
  }
}

export interface StoreConfig {
  name: string;
  keyPath?: string | string[];
  autoIncrement?: boolean;
  indexes?: Array<{
    name: string;
    keyPath: string | string[];
    unique?: boolean;
  }>;
}

/**
 * Robust IndexedDB wrapper with Promise API and multi-store support.
 */
export class KharonDB {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(private readonly name: string, private readonly version: number) {}

  /**
   * Open the database and initialize stores if needed.
   */
  async open(configs: StoreConfig[]): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onerror = () => {
        this.dbPromise = null;
        reject(new KharonDBError("Failed to open database", request.error, "DB_OPEN_FAILED"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        configs.forEach((config) => {
          if (!db.objectStoreNames.contains(config.name)) {
            const store = db.createObjectStore(config.name, {
              keyPath: config.keyPath || "id",
              autoIncrement: config.autoIncrement ?? true,
            });

            if (config.indexes) {
              config.indexes.forEach((idx) => {
                store.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false });
              });
            }
          }
        });
      };
    });

    return this.dbPromise;
  }

  /**
   * Get a single item by its key.
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.ensureDB();
    return new Promise<T | undefined>((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new KharonDBError(`Get failed for store ${storeName}`, request.error));
      } catch (error) {
        reject(new KharonDBError(`Transaction failed for store ${storeName}`, error));
      }
    });
  }

  /**
   * Put (add or update) an item in the store.
   */
  async put<T>(storeName: string, item: T): Promise<IDBValidKey> {
    const db = await this.ensureDB();
    return new Promise<IDBValidKey>((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          if (request.error?.name === "QuotaExceededError") {
            reject(new KharonDBError("Storage quota exceeded", request.error, "QUOTA_EXCEEDED"));
          } else {
            reject(new KharonDBError(`Put failed for store ${storeName}`, request.error));
          }
        };
      } catch (error) {
        reject(new KharonDBError(`Transaction failed for store ${storeName}`, error));
      }
    });
  }

  /**
   * Delete an item by its key.
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.ensureDB();
    return new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new KharonDBError(`Delete failed for store ${storeName}`, request.error));
      } catch (error) {
        reject(new KharonDBError(`Transaction failed for store ${storeName}`, error));
      }
    });
  }

  /**
   * Clear all items from a store.
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new KharonDBError(`Clear failed for store ${storeName}`, request.error));
      } catch (error) {
        reject(new KharonDBError(`Transaction failed for store ${storeName}`, error));
      }
    });
  }

  /**
   * Get all items from a store.
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDB();
    return new Promise<T[]>((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new KharonDBError(`GetAll failed for store ${storeName}`, request.error));
      } catch (error) {
        reject(new KharonDBError(`Transaction failed for store ${storeName}`, error));
      }
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      if (this.dbPromise) {
        return this.dbPromise;
      }
      throw new KharonDBError("Database not open", undefined, "DB_NOT_OPEN");
    }
    return this.db;
  }
}
