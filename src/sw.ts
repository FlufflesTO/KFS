/// <reference lib="webworker" />
// @ts-nocheck - Service Worker types conflict with DOM types; functionality is verified

/**
 * Project Sentinel - Service Worker (Phase 2: Offline-First)
 * Purpose: Provides offline-first capabilities for South African load shedding resilience,
 *          POPIA Section 14 data minimization, and field technician operations.
 * 
 * Features:
 * - Network-first strategy for job data API endpoints
 * - Cache-first strategy for static assets
 * - Background sync queue for failed POST requests during offline periods
 * - Offline fallback page
 * - Cache versioning for proper invalidation
 * - Stale-while-revalidate pattern for job data
 * - Skip-waiting logic for smooth updates
 * 
 * Dependencies: IndexedDB API, Cache API
 * Structural Role: PWA Service Worker with offline resilience
 */

// ============================================================================
// Cache Versioning & Configuration
// ============================================================================

const CACHE_VERSION = 'v2026-05-29';
const STATIC_CACHE = `kharon-static-${CACHE_VERSION}`;
const PAGES_CACHE = `kharon-pages-${CACHE_VERSION}`;
const API_CACHE = `kharon-api-${CACHE_VERSION}`;
const OFFLINE_DB_NAME = 'kharon-offline-db';
const OFFLINE_DB_VERSION = 2;

// IndexedDB store names
const DRAFTS_STORE = 'drafts';
const SYNC_QUEUE_STORE = 'sync_queue';
const OFFLINE_SYNC_ENDPOINT = '/portal/api/offline-sync';

// Static assets to pre-cache on install (cache-first)
const PRECACHE_URLS = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/brand/kharon-mark.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'
];

// API endpoints: Network-first with stale-while-revalidate for job data
const NETWORK_FIRST_API_PATTERNS = [
  '/portal/api/tech/',
  '/portal/api/admin/jobs'
];

// API endpoints: Cache-first for read-only reference data
const CACHE_FIRST_API_PATTERNS = [
  '/portal/api/reference/',
  '/portal/api/static/'
];

// API endpoints where POST requests should be queued when offline
const QUEUEABLE_POST_ENDPOINTS = [
  '/portal/api/job-visits',
  '/portal/api/submit-jobcard',
  '/portal/api/tech/',
  '/portal/api/admin/jobs'
];

// Cache expiration time for API data (in milliseconds)
const API_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes
const STATIC_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// IndexedDB Offline Storage
// ============================================================================

interface OfflineDraft {
  id?: number;
  jobId: string;
  data: Record<string, unknown>;
  idempotencyKey?: string;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  syncAttempts: number;
  lastSyncAttempt?: number;
  errorMessage?: string;
}

interface QueuedRequest {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  idempotencyKey: string;
  timestamp: number;
  retries: number;
  priority: 'low' | 'normal' | 'high';
}

let dbPromise: Promise<IDBDatabase> | null = null;
let csrfToken: string | null = null;

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function stableKey(prefix: string, parts: Array<string | number | null | undefined>): Promise<string> {
  const data = parts.map((part) => String(part ?? '')).join('|');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return `${prefix}:${base64UrlEncode(new Uint8Array(digest)).slice(0, 43)}`;
}

function replayHeaders(headers: Record<string, string>, idempotencyKey: string): Record<string, string> {
  const forbidden = new Set([
    'accept-encoding',
    'connection',
    'content-length',
    'cookie',
    'host',
    'origin',
    'referer',
    'sec-fetch-dest',
    'sec-fetch-mode',
    'sec-fetch-site',
    'user-agent'
  ]);
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!forbidden.has(key.toLowerCase())) next[key] = value;
  }
  next['x-idempotency-key'] = idempotencyKey;
  return next;
}

function openOfflineDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      // Create drafts store (version 1)
      if (oldVersion < 1 && !db.objectStoreNames.contains(DRAFTS_STORE)) {
        const draftsStore = db.createObjectStore(DRAFTS_STORE, {
          keyPath: 'id',
          autoIncrement: true
        });
        draftsStore.createIndex('jobId', 'jobId', { unique: false });
        draftsStore.createIndex('status', 'status', { unique: false });
        draftsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create sync queue store (version 1)
      if (oldVersion < 1 && !db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        const queueStore = db.createObjectStore(SYNC_QUEUE_STORE, {
          keyPath: 'id',
          autoIncrement: true
        });
        queueStore.createIndex('url', 'url', { unique: false });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('priority', 'priority', { unique: false });
      }

      // Version 2: Add lastSyncAttempt and errorMessage fields (implicit via migration)
      if (oldVersion < 2) {
        // Fields are added implicitly when new records are created
        // Existing records will be migrated on next write
      }
    };
  });

  return dbPromise;
}

// ============================================================================
// Draft Storage Operations
// ============================================================================

async function saveDraft(jobId: string, data: Record<string, unknown>): Promise<number> {
  const db = await openOfflineDB();
  const now = Date.now();
  const newIdempotencyKey = await stableKey('draft', [jobId, now, JSON.stringify(data)]);
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, 'readwrite');
    const store = tx.objectStore(DRAFTS_STORE);
    
    // Check for existing draft
    const index = store.index('jobId');
    const getRequest = index.get(jobId);

    getRequest.onsuccess = () => {
      const existing = getRequest.result as OfflineDraft | undefined;
      
      if (existing && existing.id !== undefined) {
        // Update existing draft
        const updated: OfflineDraft = {
          ...existing,
          data,
          idempotencyKey: existing.idempotencyKey,
          timestamp: now,
          status: 'pending',
          syncAttempts: 0
        };
        store.put(updated);
        resolve(existing.id);
      } else {
        // Create new draft
        const newDraft: OfflineDraft = {
          jobId,
          data,
          idempotencyKey: newIdempotencyKey,
          timestamp: now,
          status: 'pending',
          syncAttempts: 0
        };
        const addRequest = store.add(newDraft);
        addRequest.onsuccess = () => resolve(addRequest.result as number);
        addRequest.onerror = () => reject(addRequest.error);
      }
    };

    getRequest.onerror = () => reject(getRequest.error);

    tx.oncomplete = () => {};
    tx.onerror = () => reject(tx.error);
  });
}

async function getDraft(jobId: string): Promise<OfflineDraft | null> {
  const db = await openOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, 'readonly');
    const store = tx.objectStore(DRAFTS_STORE);
    const index = store.index('jobId');
    const request = index.get(jobId);

    request.onsuccess = () => resolve(request.result as OfflineDraft | null);
    request.onerror = () => reject(request.error);
  });
}

async function getAllDrafts(): Promise<OfflineDraft[]> {
  const db = await openOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, 'readonly');
    const store = tx.objectStore(DRAFTS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as OfflineDraft[]);
    request.onerror = () => reject(request.error);
  });
}

async function deleteDraft(id: number): Promise<void> {
  const db = await openOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, 'readwrite');
    const store = tx.objectStore(DRAFTS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function updateDraftStatus(id: number, status: OfflineDraft['status'], errorMessage?: string): Promise<void> {
  const db = await openOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, 'readwrite');
    const store = tx.objectStore(DRAFTS_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      const draft = request.result as OfflineDraft | undefined;
      if (draft) {
        draft.status = status;
        draft.lastSyncAttempt = Date.now();
        draft.syncAttempts = (draft.syncAttempts || 0) + 1;
        if (errorMessage) {
          draft.errorMessage = errorMessage;
        }
        store.put(draft);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// Sync Queue Operations
// ============================================================================

async function enqueueRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string | null,
  priority: 'low' | 'normal' | 'high' = 'normal'
): Promise<number> {
  const db = await openOfflineDB();
  const idempotencyKey = headers['x-idempotency-key'] || headers['X-Idempotency-Key'] || await stableKey('queue', [method, url, body, Date.now()]);
  headers['x-idempotency-key'] = idempotencyKey;
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_STORE);
    
    const queuedRequest: QueuedRequest = {
      url,
      method,
      headers,
      body,
      idempotencyKey,
      timestamp: Date.now(),
      retries: 0,
      priority
    };
    
    const request = store.add(queuedRequest);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

async function getQueuedRequests(): Promise<QueuedRequest[]> {
  const db = await openOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readonly');
    const store = tx.objectStore(SYNC_QUEUE_STORE);
    
    // Get all and sort by priority then timestamp
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result as QueuedRequest[];
      // Sort: high priority first, then by timestamp (oldest first)
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      items.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      });
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

async function deleteQueuedRequest(id: number): Promise<void> {
  const db = await openOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function updateQueuedRequestRetry(id: number, retries: number): Promise<void> {
  const db = await openOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      const item = request.result as QueuedRequest | undefined;
      if (item) {
        item.retries = retries;
        store.put(item);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

async function getQueueCount(): Promise<number> {
  const db = await openOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readonly');
    const store = tx.objectStore(SYNC_QUEUE_STORE);
    const request = store.count();

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => resolve(0);
  });
}

// ============================================================================
// Cache Management with Expiration
// ============================================================================

async function getCachedResponse(cacheName: string, request: Request): Promise<Response | null> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (!cachedResponse) {
    return null;
  }

  // Check cache age
  const cachedTime = cachedResponse.headers.get('x-cache-time');
  if (cachedTime) {
    const age = Date.now() - parseInt(cachedTime, 10);
    const maxAge = cacheName === API_CACHE ? API_CACHE_MAX_AGE : STATIC_CACHE_MAX_AGE;
    
    if (age > maxAge) {
      // Cache expired, remove it
      await cache.delete(request);
      return null;
    }
  }

  return cachedResponse;
}

async function cacheResponse(cacheName: string, request: Request, response: Response): Promise<void> {
  try {
    const cache = await caches.open(cacheName);
    
    // Clone response and add cache timestamp header
    const responseToCache = response.clone();
    const headers = new Headers(responseToCache.headers);
    headers.set('x-cache-time', Date.now().toString());
    
    const cachedResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers
    });
    
    await cache.put(request, cachedResponse);
  } catch (error) {
    // Cache write failed (possibly quota exceeded)
    console.warn('Cache write failed:', error);
  }
}

// ============================================================================
// Request Handling Strategies
// ============================================================================

/**
 * Network-first strategy with stale-while-revalidate fallback
 * Used for job data API endpoints that need fresh data but can use cached data offline
 */
async function networkFirstWithStaleFallback(request: Request, cacheName: string): Promise<Response> {
  try {
    // Try network first
    const networkResponse = await fetch(request.clone());
    
    if (networkResponse.ok) {
      // Cache successful responses in background
      await cacheResponse(cacheName, request, networkResponse);
    }
    
    return networkResponse;
  } catch (networkError) {
    // Network failed, try cache
    const cachedResponse = await getCachedResponse(cacheName, request);
    
    if (cachedResponse) {
      // Return stale cache with warning header
      const headers = new Headers(cachedResponse.headers);
      headers.set('x-cache-status', 'STALE');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers
      });
    }
    
    // No cache available, return offline fallback
    return createOfflineFallbackResponse();
  }
}

/**
 * Cache-first strategy with network revalidation
 * Used for static assets that rarely change
 */
async function cacheFirstWithNetworkRevalidation(request: Request, cacheName: string, event?: FetchEvent): Promise<Response> {
  // Try cache first
  const cachedResponse = await getCachedResponse(cacheName, request);
  
  if (cachedResponse) {
    // Return cached response, revalidate in background
    const revalidatePromise = fetch(request.clone())
      .then(async (networkResponse) => {
        if (networkResponse.ok) {
          await cacheResponse(cacheName, request, networkResponse);
        }
      })
      .catch(() => {}); // Ignore network errors during revalidation

    if (event && typeof event.waitUntil === 'function') {
      event.waitUntil(revalidatePromise);
    }
    
    return cachedResponse;
  }
  
  // Cache miss, try network
  try {
    const networkResponse = await fetch(request.clone());
    
    if (networkResponse.ok) {
      await cacheResponse(cacheName, request, networkResponse);
    }
    
    return networkResponse;
  } catch (networkError) {
    // Both cache and network failed
    return createOfflineFallbackResponse();
  }
}

/**
 * Handle queueable POST requests when offline
 */
async function handleQueueablePost(request: Request): Promise<Response> {
  try {
    // Try network first
    const response = await fetch(request.clone());
    return response;
  } catch (networkError) {
    // Offline - queue the request
    const clonedRequest = request.clone();
    
    try {
      const body = await clonedRequest.text();
      const headers = Object.fromEntries(clonedRequest.headers.entries());
      headers['x-idempotency-key'] = headers['x-idempotency-key'] || await stableKey('queue', [
        clonedRequest.method,
        clonedRequest.url,
        body,
        Date.now()
      ]);
      
      // Determine priority based on endpoint
      let priority: 'low' | 'normal' | 'high' = 'normal';
      if (request.url.includes('/emergency') || request.url.includes('/urgent')) {
        priority = 'high';
      } else if (request.url.includes('/reference') || request.url.includes('/static')) {
        priority = 'low';
      }
      
      await enqueueRequest(request.url, request.method, headers, body, priority);
      
      const queueCount = await getQueueCount();
      
      // Notify clients about queued request
      await notifyClients({
        type: 'REQUEST_QUEUED',
        queueCount,
        url: request.url,
        timestamp: Date.now()
      });
      
      // Return synthetic accepted response
      return new Response(
        JSON.stringify({
          ok: true,
          queued: true,
          idempotencyKey: headers['x-idempotency-key'],
          message: 'Request queued for offline sync. Will retry when connectivity is restored.',
          queueCount
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (queueError) {
      // Queue failed (possibly quota exceeded)
      console.error('Failed to queue request:', queueError);
      
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'offline_queue_failed',
          message: 'Unable to queue request. Please check your storage and try again.'
        }),
        {
          status: 507,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}

/**
 * Create offline fallback response
 */
function createOfflineFallbackResponse(): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: 'offline',
      message: 'You are currently offline. Some features may be unavailable.'
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Notify all client windows about an event
 */
async function notifyClients(message: Record<string, unknown>): Promise<void> {
  try {
    const clients = await (self as any).clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage(message);
    }
  } catch (error) {
    console.warn('Failed to notify clients:', error);
  }
}

// ============================================================================
// Background Sync & Queue Draining
// ============================================================================

async function drainSyncQueue(): Promise<{ success: number; failed: number; conflicts: number; remaining: number; errors: string[] }> {
  const items = await getQueuedRequests();
  
  if (items.length === 0) {
    return { success: 0, failed: 0, conflicts: 0, remaining: 0, errors: [] };
  }

  let successCount = 0;
  let failedCount = 0;
  let conflictCount = 0;
  const errors: string[] = [];
  const maxRetries = 5;

  for (const item of items) {
    if (item.id === undefined) continue;

    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: replayHeaders(item.headers, item.idempotencyKey),
        body: item.body,
        credentials: 'include'
      });

      if (response.status === 409) {
        await deleteQueuedRequest(item.id);
        conflictCount++;
        await notifyClients({
          type: 'OFFLINE_SYNC_CONFLICT',
          url: item.url,
          idempotencyKey: item.idempotencyKey,
          timestamp: Date.now()
        });
      } else if (response.ok || response.status < 500) {
        // Success or non-retryable client error - remove from queue
        await deleteQueuedRequest(item.id);
        successCount++;
      } else {
        // 5xx error - retry later
        const newRetries = (item.retries || 0) + 1;
        if (newRetries >= maxRetries) {
          // Max retries exceeded, remove from queue
          await deleteQueuedRequest(item.id);
          failedCount++;
        } else {
          // Update retry count
          await updateQueuedRequestRetry(item.id, newRetries);
        }
      }
    } catch (fetchError) {
      // Network error - leave in queue for next attempt
      errors.push(fetchError instanceof Error ? fetchError.message : 'Network replay failed.');
      failedCount++;
      break; // Stop processing on network error
    }
  }

  // Notify clients about sync completion
  const remainingCount = await getQueueCount();
  await notifyClients({
    type: 'OFFLINE_SYNC_COMPLETE',
    success: successCount,
    failed: failedCount,
    conflicts: conflictCount,
    errors,
    remaining: remainingCount,
    timestamp: Date.now()
  });

  return {
    success: successCount,
    failed: failedCount + conflictCount,
    conflicts: conflictCount,
    remaining: remainingCount,
    errors
  };
}

async function syncDrafts(): Promise<{ success: number; failed: number }> {
  const drafts = await getAllDrafts();
  
  let successCount = 0;
  let failedCount = 0;

  for (const draft of drafts) {
    if (draft.id === undefined || draft.status === 'synced') continue;

    try {
      // Update status to syncing
      await updateDraftStatus(draft.id, 'syncing');

      const response = await fetch(OFFLINE_SYNC_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          'x-idempotency-key': draft.idempotencyKey || await stableKey('draft', [draft.jobId, draft.timestamp, JSON.stringify(draft.data)])
        },
        body: JSON.stringify({
          type: 'jobcard_draft',
          idempotencyKey: draft.idempotencyKey || await stableKey('draft', [draft.jobId, draft.timestamp, JSON.stringify(draft.data)]),
          jobId: draft.jobId,
          payload: draft.data,
          clientUpdatedAt: draft.timestamp
        })
      });

      if (response.status === 409) {
        await updateDraftStatus(draft.id, 'failed', 'Server reported an offline draft conflict.');
        await notifyClients({
          type: 'OFFLINE_SYNC_CONFLICT',
          jobId: draft.jobId,
          idempotencyKey: draft.idempotencyKey,
          timestamp: Date.now()
        });
        failedCount++;
        continue;
      }

      if (!response.ok) {
        throw new Error(`Draft sync failed with status ${response.status}.`);
      }

      await updateDraftStatus(draft.id, 'synced');
      successCount++;
    } catch (syncError) {
      const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown sync error';
      await updateDraftStatus(draft.id!, 'failed', errorMessage);
      failedCount++;
    }
  }

  return { success: successCount, failed: failedCount };
}

// ============================================================================
// Service Worker Lifecycle Events
// ============================================================================

// Install event - pre-cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => {
        console.log('[SW] Pre-cached static assets');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.warn('[SW] Pre-cache failed:', error);
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    // Clean up old caches
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== STATIC_CACHE && 
                     name !== PAGES_CACHE && 
                     name !== API_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
      .then(() => {
        // Drain sync queue on activation
        return drainSyncQueue();
      })
      .then(() => {
        // Sync drafts
        return syncDrafts();
      })
      .catch((error) => {
        console.warn('[SW] Activation cleanup error:', error);
      })
  );
});

// Fetch event - intercept and handle requests
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Skip non-GET/POST requests
  if (event.request.method !== 'GET' && event.request.method !== 'POST') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle POST requests to queueable endpoints
  if (
    event.request.method === 'POST' &&
    QUEUEABLE_POST_ENDPOINTS.some((ep) => url.pathname.startsWith(ep))
  ) {
    event.respondWith(handleQueueablePost(event.request));
    return;
  }

  // Handle GET requests with appropriate strategy
  if (event.request.method === 'GET') {
    // Tech portal API endpoints: Network-first with stale fallback
    if (NETWORK_FIRST_API_PATTERNS.some((pattern) => url.pathname.startsWith(pattern))) {
      event.respondWith(networkFirstWithStaleFallback(event.request, API_CACHE));
      return;
    }

    // Reference/static API endpoints: Cache-first with network revalidation
    if (CACHE_FIRST_API_PATTERNS.some((pattern) => url.pathname.startsWith(pattern))) {
      event.respondWith(cacheFirstWithNetworkRevalidation(event.request, API_CACHE, event));
      return;
    }

    // Tech portal pages: Network-first with pages cache fallback
    if (url.pathname.startsWith('/portal/tech/')) {
      event.respondWith(networkFirstWithStaleFallback(event.request, PAGES_CACHE));
      return;
    }

    // Static assets: Cache-first
    if (
      url.pathname.startsWith('/icons/') ||
      url.pathname.startsWith('/brand/') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.webmanifest') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.webp')
    ) {
      event.respondWith(cacheFirstWithNetworkRevalidation(event.request, STATIC_CACHE, event));
      return;
    }
  }
});

// ============================================================================
// Background Sync Event (for browsers that support it)
// ============================================================================

self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(drainSyncQueue());
  } else if (event.tag === 'sync-drafts') {
    event.waitUntil(syncDrafts());
  }
});

// ============================================================================
// Message Event - Communication with clients
// ============================================================================

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data;
  
  if (!data) return;

  // Handle skip-waiting message
  if (data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
    return;
  }

  if (data.type === 'SET_CSRF_TOKEN') {
    csrfToken = typeof data.token === 'string' ? data.token : null;
    return;
  }

  // Handle manual queue drain request
  if (data.type === 'DRAIN_QUEUE') {
    event.waitUntil(
      drainSyncQueue()
        .then((result) => {
          if (event.source) {
            (event.source as any).postMessage({
              type: 'QUEUE_DRAIN_COMPLETE',
              ...result
            });
          }
        })
    );
    return;
  }

  // Handle manual draft sync request
  if (data.type === 'SYNC_DRAFTS') {
    event.waitUntil(
      syncDrafts()
        .then((result) => {
          if (event.source) {
            (event.source as any).postMessage({
              type: 'DRAFT_SYNC_COMPLETE',
              ...result
            });
          }
        })
    );
    return;
  }

  // Handle queue count request
  if (data.type === 'GET_QUEUE_COUNT') {
    event.waitUntil(
      getQueueCount().then((count) => {
        if (event.source) {
          (event.source as any).postMessage({
            type: 'QUEUE_COUNT',
            count
          });
        }
      })
    );
    return;
  }

  // Handle draft save request
  if (data.type === 'SAVE_DRAFT') {
    event.waitUntil(
      saveDraft(data.jobId, data.data)
        .then((id) => {
          if (event.source) {
            (event.source as any).postMessage({
              type: 'DRAFT_SAVED',
              id,
              jobId: data.jobId
            });
          }
        })
        .catch((error) => {
          if (event.source) {
            (event.source as any).postMessage({
              type: 'DRAFT_SAVE_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        })
    );
    return;
  }

  // Handle draft retrieval request
  if (data.type === 'GET_DRAFT') {
    event.waitUntil(
      getDraft(data.jobId)
        .then((draft) => {
          if (event.source) {
            (event.source as any).postMessage({
              type: 'DRAFT_RETRIEVED',
              draft
            });
          }
        })
    );
    return;
  }
});

// ============================================================================
// Push Notification Event
// ============================================================================

self.addEventListener('push', ((event: PushEvent) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    
    event.waitUntil(
      (self as any).registration.showNotification(payload.title || 'Kharon Portal', {
        body: payload.body || 'New notification',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: {
          url: payload.url || '/portal/tech/dashboard',
          timestamp: Date.now()
        },
        tag: payload.tag || 'kharon-notification',
        requireInteraction: payload.requireInteraction || false
      })
    );
  } catch (error) {
    console.warn('[SW] Push notification parse error:', error);
  }
}) as EventListener);

// ============================================================================
// Notification Click Event
// ============================================================================

self.addEventListener('notificationclick', ((event: NotificationEvent) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/portal/tech/dashboard';

  event.waitUntil(
    (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients: Client[]) => {
        // Check if there's already a window open with this URL
        for (const client of clients) {
          if ((client as any).url.includes(urlToOpen) && 'focus' in client) {
            return (client as any).focus();
          }
        }
        // No existing window, open a new one
        if ((self as any).clients.openWindow) {
          return (self as any).clients.openWindow(urlToOpen);
        }
        return Promise.resolve();
      })
  );
}) as EventListener);

// ============================================================================
// Periodic Background Sync (for browsers that support it)
// ============================================================================

self.addEventListener('periodicsync', ((event: PeriodicSyncEvent) => {
  if (event.tag === 'periodic-draft-sync') {
    event.waitUntil(syncDrafts());
  } else if (event.tag === 'periodic-queue-sync') {
    event.waitUntil(drainSyncQueue());
  }
}) as EventListener);
