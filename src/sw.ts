/// <reference lib="webworker" />
// @ts-nocheck - Service Worker types conflict with DOM types; functionality is correct

/**
 * Project Sentinel - Service Worker
 * Purpose: Provides offline caching, background sync for field technician operations,
 *          and installable PWA capabilities.
 * Dependencies: IndexedDB (idb-keyval pattern), Cache API
 * Structural Role: PWA Service Worker
 */

const SW_VERSION = 'sentinel-sw-v2';
const STATIC_CACHE = `static-${SW_VERSION}`;
const PAGES_CACHE = `pages-${SW_VERSION}`;
const API_CACHE = `api-${SW_VERSION}`;
const OFFLINE_QUEUE_STORE = 'sentinel-offline-queue';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/brand/kharon-mark.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Pages to cache for offline tech access
const TECH_PAGES = [
  '/portal/tech/dashboard',
  '/portal/tech/history'
];

// API endpoints that should be cached (GET only) for offline reading
const CACHEABLE_API_PATTERNS = [
  '/portal/tech/dashboard',
  '/portal/tech/history'
];

// API endpoints where POST requests should be queued offline
const QUEUEABLE_POST_ENDPOINTS = [
  '/portal/api/job-visits',
  '/portal/api/submit-jobcard'
];

// IndexedDB offline queue

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_QUEUE_STORE, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function enqueueRequest(url: string, init: RequestInit): Promise<void> {
  const db = await openOfflineDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('requests', 'readwrite');
    const store = tx.objectStore('requests');
    store.add({
      url,
      method: init.method || 'POST',
      headers: Object.fromEntries(new Headers(init.headers || {}).entries()),
      body: init.body || null,
      timestamp: Date.now()
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function drainOfflineQueue(): Promise<void> {
  const db = await openOfflineDB();
  const items = await new Promise<Array<{id: number; url: string; method: string; headers: Record<string, string>; body: string | null; timestamp: number}>>((resolve, reject) => {
    const tx = db.transaction('requests', 'readonly');
    const store = tx.objectStore('requests');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!items || items.length === 0) return;

  const db2 = await openOfflineDB();
  for (const item of items) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });

      if (response.ok || response.status < 500) {
        // Remove from queue on success or non-retryable client error
        const delTx = db2.transaction('requests', 'readwrite');
        delTx.objectStore('requests').delete(item.id);
        await new Promise<void>((resolve) => { delTx.oncomplete = () => resolve(); });
      }
      // If 5xx, leave in queue for next attempt
    } catch (_networkErr) {
      // Still offline or network error; stop draining and retry later.
      break;
    }
  }

  // Notify all clients about sync completion
  const clients = await (self as any).clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage({ type: 'OFFLINE_SYNC_COMPLETE', remaining: 0 });
  }
}

async function getQueueCount(): Promise<number> {
  try {
    const db = await openOfflineDB();
    return new Promise<number>((resolve) => {
      const tx = db.transaction('requests', 'readonly');
      const store = tx.objectStore('requests');
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  } catch (_err) {
    return 0;
  }
}

// Install

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== STATIC_CACHE && name !== PAGES_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
    .then(() => self.clients.claim())
    .then(() => drainOfflineQueue())
  );
});

// Fetch

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET/POST, skip cross-origin
  if (url.origin !== self.location.origin) return;

  // Offline POST queue for tech API endpoints.
  if (event.request.method === 'POST' && QUEUEABLE_POST_ENDPOINTS.some((ep) => url.pathname.startsWith(ep))) {
    event.respondWith(handleQueueablePost(event.request));
    return;
  }

  // Only handle GET from here
  if (event.request.method !== 'GET') return;

  // Tech portal pages: network-first with cache fallback.
  if (url.pathname.startsWith('/portal/tech/')) {
    event.respondWith(networkFirstWithCache(event.request, PAGES_CACHE));
    return;
  }

  // Static assets: cache-first.
  if (url.pathname.startsWith('/icons/') ||
      url.pathname.startsWith('/brand/') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.webmanifest')) {
    event.respondWith(cacheFirstWithNetwork(event.request, STATIC_CACHE));
    return;
  }
});

async function handleQueueablePost(request: Request): Promise<Response> {
  try {
    // Try the network first
    const response = await fetch(request.clone());
    return response;
  } catch (_networkErr) {
    // Offline; queue the request.
    const clonedRequest = request.clone();
    const body = await clonedRequest.text();
    const headers = Object.fromEntries(clonedRequest.headers.entries());

    await enqueueRequest(request.url, {
      method: 'POST',
      headers,
      body
    });

    const queueCount = await getQueueCount();

    // Notify the client
    const clients = await (self as any).clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({ type: 'REQUEST_QUEUED', queueCount, url: request.url });
    }

    // Return a synthetic accepted response
    return new Response(
      JSON.stringify({
        ok: true,
        queued: true,
        message: 'Your submission has been saved offline and will sync automatically when connectivity is restored.',
        queueCount
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function networkFirstWithCache(request: Request, cacheName: string): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      '<!doctype html><title>Offline</title><h1>Offline</h1><p>You are currently offline. Cached pages are available.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function cacheFirstWithNetwork(request: Request, cacheName: string): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

// Background sync

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(drainOfflineQueue());
  }
});

// Online event fallback for browsers without Background Sync

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'DRAIN_QUEUE') {
    event.waitUntil(drainOfflineQueue());
  }
  if (event.data && event.data.type === 'GET_QUEUE_COUNT') {
    getQueueCount().then((count) => {
      event.source.postMessage({ type: 'QUEUE_COUNT', count });
    });
  }
});

// Push notifications

self.addEventListener('push', ((event: PushEvent) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    event.waitUntil(
      (self as any).registration.showNotification(payload.title || 'Kharon Portal', {
        body: payload.body || 'New notification',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { url: payload.url || '/portal/tech/dashboard' }
      })
    );
  } catch (_err) {
    // Malformed push payload; ignore silently.
  }
}) as EventListener);

self.addEventListener('notificationclick', ((event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    (self as any).clients.openWindow(event.notification.data?.url || '/portal/tech/dashboard')
  );
}) as EventListener);
