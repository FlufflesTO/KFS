/**
 * Kharon PWA Service Worker - Offline-First Field Service Engine
 * 
 * Features:
 * - IndexedDB caching for jobcards, sites, systems
 * - Offline visit logging with GPS
 * - Signature capture storage
 * - Automatic sync when connectivity returns
 * - Background sync queue for pending operations
 * 
 * South African Context: Designed for basement server rooms, remote industrial sites
 * with zero connectivity (Load Shedding areas, poor signal zones)
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `kharon-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `kharon-dynamic-${CACHE_VERSION}`;
const DB_NAME = 'kharon-offline-db';
const DB_VERSION = 1;

// IndexedDB Schema
const STORES = {
  JOBS: 'jobs',
  SITES: 'sites',
  SYSTEMS: 'systems',
  VISITS: 'visits',
  SIGNATURES: 'signatures',
  PHOTOS: 'photos',
  SYNC_QUEUE: 'syncQueue'
};

// ============================================================================
// INDEXEDDB HELPERS
// ============================================================================

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Jobs store - cache assigned jobs for offline viewing
      if (!db.objectStoreNames.contains(STORES.JOBS)) {
        const jobStore = db.createObjectStore(STORES.JOBS, { keyPath: 'id' });
        jobStore.createIndex('technician_id', 'assigned_technician_id', { unique: false });
        jobStore.createIndex('scheduled_date', 'scheduled_date', { unique: false });
        jobStore.createIndex('status', 'status', { unique: false });
      }
      
      // Sites store - cache site information
      if (!db.objectStoreNames.contains(STORES.SITES)) {
        const siteStore = db.createObjectStore(STORES.SITES, { keyPath: 'id' });
        siteStore.createIndex('owner_company_name', 'owner_company_name', { unique: false });
      }
      
      // Systems store - cache system details
      if (!db.objectStoreNames.contains(STORES.SYSTEMS)) {
        const systemStore = db.createObjectStore(STORES.SYSTEMS, { keyPath: 'id' });
        systemStore.createIndex('site_id', 'site_id', { unique: false });
        systemStore.createIndex('system_type', 'system_type', { unique: false });
      }
      
      // Visits store - offline visit logs (pending sync)
      if (!db.objectStoreNames.contains(STORES.VISITS)) {
        const visitStore = db.createObjectStore(STORES.VISITS, { keyPath: 'id' });
        visitStore.createIndex('job_id', 'job_id', { unique: false });
        visitStore.createIndex('synced', 'synced', { unique: false });
        visitStore.createIndex('created_at', 'created_at', { unique: false });
      }
      
      // Signatures store - offline signature captures
      if (!db.objectStoreNames.contains(STORES.SIGNATURES)) {
        const sigStore = db.createObjectStore(STORES.SIGNATURES, { keyPath: 'visitId' });
        sigStore.createIndex('synced', 'synced', { unique: false });
      }
      
      // Photos store - offline evidence photos (with size limits)
      if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
        const photoStore = db.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
        photoStore.createIndex('job_id', 'job_id', { unique: false });
        photoStore.createIndex('synced', 'synced', { unique: false });
      }
      
      // Sync queue - tracks pending API operations
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('type', 'type', { unique: false });
        queueStore.createIndex('priority', 'priority', { unique: false });
        queueStore.createIndex('created_at', 'created_at', { unique: false });
      }
    };
  });
}

async function dbOperation(storeName, mode, callback) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], mode);
    const store = transaction.objectStore(storeName);
    const request = callback(store);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbGetAll(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function addToSyncQueue(operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const request = store.add({
      ...operation,
      created_at: new Date().toISOString(),
      attempts: 0,
      last_attempt: null
    });
    
    request.onsuccess = () => {
      console.log('[SW] Added to sync queue:', operation.type);
      resolve(request.result);
      // Try to sync immediately if online
      if (navigator.onLine) {
        self.registration.sync.register('kharon-sync').catch(console.error);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

async function cacheStaticAssets() {
  const cache = await caches.open(STATIC_CACHE);
  const assets = [
    '/',
    '/offline.html',
    '/brand/kharon-mark.svg',
    '/favicon.svg'
  ];
  
  try {
    await cache.addAll(assets);
    console.log('[SW] Static assets cached');
  } catch (error) {
    console.error('[SW] Failed to cache static assets:', error);
  }
}

async function fetchWithCache(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Network failed, return offline fallback
    return new Response('Offline - Data not available in cache', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// ============================================================================
// DATA SYNCHRONIZATION
// ============================================================================

async function syncPendingVisits() {
  const visits = await dbGetAll(STORES.VISITS);
  const unsyncedVisits = visits.filter(v => !v.synced);
  
  for (const visit of unsyncedVisits) {
    try {
      const response = await fetch('/portal/api/job-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: visit.data
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Update visit with server ID
        await dbOperation(STORES.VISITS, 'readwrite', (store) => {
          const updated = { ...visit, id: result.visitId || visit.id, synced: true };
          return store.put(updated);
        });
        console.log('[SW] Synced visit:', visit.id);
      }
    } catch (error) {
      console.error('[SW] Failed to sync visit:', visit.id, error);
    }
  }
}

async function syncPendingSignatures() {
  const signatures = await dbGetAll(STORES.SIGNATURES);
  const unsynced = signatures.filter(s => !s.synced);
  
  for (const sig of unsynced) {
    try {
      const response = await fetch('/portal/api/job-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_signature',
          visitId: sig.visitId,
          signatureBase64: sig.signatureBase64
        })
      });
      
      if (response.ok) {
        await dbOperation(STORES.SIGNATURES, 'readwrite', (store) => {
          return store.put({ ...sig, synced: true });
        });
        console.log('[SW] Synced signature for visit:', sig.visitId);
      }
    } catch (error) {
      console.error('[SW] Failed to sync signature:', sig.visitId, error);
    }
  }
}

async function syncPendingPhotos() {
  const photos = await dbGetAll(STORES.PHOTOS);
  const unsynced = photos.filter(p => !p.synced);
  
  for (const photo of unsynced) {
    try {
      const formData = new FormData();
      formData.append('jobId', photo.job_id);
      formData.append('evidenceType', 'Photo');
      formData.append('caption', photo.caption || '');
      formData.append('file', photo.blob, photo.filename);
      
      const response = await fetch('/portal/api/file/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        await dbOperation(STORES.PHOTOS, 'readwrite', (store) => {
          return store.put({ ...photo, synced: true });
        });
        console.log('[SW] Synced photo:', photo.id);
      }
    } catch (error) {
      console.error('[SW] Failed to sync photo:', photo.id, error);
    }
  }
}

async function performSync() {
  console.log('[SW] Starting sync process...');
  
  try {
    await syncPendingVisits();
    await syncPendingSignatures();
    await syncPendingPhotos();
    console.log('[SW] Sync completed');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Re-throw for Background Sync retry
  }
}

// ============================================================================
// SERVICE WORKER EVENT HANDLERS
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    Promise.all([
      cacheStaticAssets(),
      openDatabase()
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => {
          return key !== STATIC_CACHE && key !== DYNAMIC_CACHE;
        }).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // API requests - network first, then cache
  if (url.pathname.startsWith('/portal/api/')) {
    event.respondWith(fetchWithCache(request));
    return;
  }
  
  // Static assets - cache first
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script') {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
  
  // HTML pages - network first with cache fallback
  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
      }
      return response;
    }).catch(() => {
      return caches.match(request).then((cached) => {
        return cached || caches.match('/offline.html');
      });
    })
  );
});

self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'kharon-sync') {
    event.waitUntil(performSync());
  }
});

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'CACHE_JOB_DATA') {
    event.waitUntil(
      (async () => {
        const db = await openDatabase();
        
        // Cache jobs
        if (event.data.jobs) {
          const tx = db.transaction([STORES.JOBS], 'readwrite');
          const store = tx.objectStore(STORES.JOBS);
          for (const job of event.data.jobs) {
            store.put(job);
          }
        }
        
        // Cache sites
        if (event.data.sites) {
          const tx = db.transaction([STORES.SITES], 'readwrite');
          const store = tx.objectStore(STORES.SITES);
          for (const site of event.data.sites) {
            store.put(site);
          }
        }
        
        // Cache systems
        if (event.data.systems) {
          const tx = db.transaction([STORES.SYSTEMS], 'readwrite');
          const store = tx.objectStore(STORES.SYSTEMS);
          for (const system of event.data.systems) {
            store.put(system);
          }
        }
        
        console.log('[SW] Cached job data for offline access');
      })()
    );
  }
  
  if (event.data && event.data.type === 'SAVE_OFFLINE_VISIT') {
    event.waitUntil(
      (async () => {
        const visitData = event.data.visit;
        const visitId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await dbOperation(STORES.VISITS, 'readwrite', (store) => {
          return store.put({
            id: visitId,
            job_id: visitData.jobId,
            technician_id: visitData.technicianId,
            visit_date: visitData.visitDate,
            arrival_time: visitData.arrivalTime,
            departure_time: visitData.departureTime,
            gps_latitude: visitData.gpsLatitude,
            gps_longitude: visitData.gpsLongitude,
            customer_name: visitData.customerName,
            customer_title: visitData.customerTitle,
            notes: visitData.notes,
            visit_status: visitData.visitStatus,
            unable_reason: visitData.unableReason,
            data: visitData,
            synced: false,
            created_at: new Date().toISOString()
          });
        });
        
        await addToSyncQueue({
          type: 'CREATE_VISIT',
          priority: visitData.isEmergency ? 'high' : 'normal',
          payload: visitData
        });
        
        return { visitId, queued: true };
      })()
    );
  }
  
  if (event.data && event.data.type === 'SAVE_SIGNATURE') {
    event.waitUntil(
      (async () => {
        await dbOperation(STORES.SIGNATURES, 'readwrite', (store) => {
          return store.put({
            visitId: event.data.visitId,
            signatureBase64: event.data.signatureBase64,
            synced: false,
            created_at: new Date().toISOString()
          });
        });
        
        await addToSyncQueue({
          type: 'UPDATE_SIGNATURE',
          priority: 'high',
          payload: {
            visitId: event.data.visitId,
            signatureBase64: event.data.signatureBase64
          }
        });
      })()
    );
  }
  
  if (event.data && event.data.type === 'SAVE_PHOTO') {
    event.waitUntil(
      (async () => {
        const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const blob = await fetch(event.data.dataUrl).then(r => r.blob());
        
        await dbOperation(STORES.PHOTOS, 'readwrite', (store) => {
          return store.put({
            id: photoId,
            job_id: event.data.jobId,
            blob: blob,
            filename: event.data.filename,
            content_type: event.data.contentType,
            file_size_bytes: blob.size,
            caption: event.data.caption,
            synced: false,
            created_at: new Date().toISOString()
          });
        });
        
        await addToSyncQueue({
          type: 'UPLOAD_PHOTO',
          priority: 'normal',
          payload: {
            jobId: event.data.jobId,
            photoId: photoId
          }
        });
        
        return { photoId, queued: true };
      })()
    );
  }
  
  if (event.data && event.data.type === 'GET_OFFLINE_JOBS') {
    event.waitUntil(
      (async () => {
        const jobs = await dbGetAll(STORES.JOBS);
        const sites = await dbGetAll(STORES.SITES);
        const systems = await dbGetAll(STORES.SYSTEMS);
        
        event.ports[0].postMessage({
          jobs,
          sites,
          systems
        });
      })()
    );
  }
  
  if (event.data && event.data.type === 'GET_PENDING_SYNC') {
    event.waitUntil(
      (async () => {
        const queue = await dbGetAll(STORES.SYNC_QUEUE);
        const visits = await dbGetAll(STORES.VISITS);
        const signatures = await dbGetAll(STORES.SIGNATURES);
        const photos = await dbGetAll(STORES.PHOTOS);
        
        event.ports[0].postMessage({
          queue,
          visits: visits.filter(v => !v.synced),
          signatures: signatures.filter(s => !s.synced),
          photos: photos.filter(p => !p.synced)
        });
      })()
    );
  }
});

console.log('[SW] Service Worker loaded');
