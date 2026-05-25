/**
 * Kharon PWA Registration Module
 * 
 * Registers the service worker and provides helper functions for:
 * - Offline job data caching
 * - Visit logging in offline mode
 * - Signature capture storage
 * - Photo evidence queuing
 * - Sync status monitoring
 * 
 * Usage: Import in technician dashboard and job detail pages
 */

let swRegistration = null;
let messageChannel = null;

/**
 * Register the service worker with feature detection
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Worker not supported');
    return false;
  }

  if (!('indexedDB' in window)) {
    console.warn('[PWA] IndexedDB not supported');
    return false;
  }

  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/portal/',
      type: 'module'
    });

    console.log('[PWA] Service Worker registered:', swRegistration.scope);

    // Wait for activation
    if (swRegistration.active) {
      console.log('[PWA] Service Worker already active');
    } else if (swRegistration.installing) {
      console.log('[PWA] Service Worker installing...');
      swRegistration.installing.addEventListener('statechange', (e) => {
        if (e.target.state === 'activated') {
          console.log('[PWA] Service Worker activated');
        }
      });
    }

    return true;
  } catch (error) {
    console.error('[PWA] Registration failed:', error);
    return false;
  }
}

/**
 * Get a MessageChannel for two-way communication with SW
 */
function getMessageChannel() {
  if (!messageChannel) {
    messageChannel = new MessageChannel();
  }
  return messageChannel;
}

/**
 * Cache job data for offline access
 * Call this when technician loads their dashboard
 */
export async function cacheJobData(jobs, sites, systems) {
  if (!swRegistration?.active) {
    console.warn('[PWA] Service Worker not active, cannot cache data');
    return false;
  }

  return new Promise((resolve) => {
    const channel = getMessageChannel();
    
    channel.port1.onmessage = (event) => {
      console.log('[PWA] Data cached successfully');
      resolve(true);
    };

    swRegistration.active.postMessage(
      {
        type: 'CACHE_JOB_DATA',
        jobs: jobs || [],
        sites: sites || [],
        systems: systems || []
      },
      [channel.port2]
    );

    // Timeout after 5 seconds
    setTimeout(() => {
      console.warn('[PWA] Cache operation timed out');
      resolve(false);
    }, 5000);
  });
}

/**
 * Save a visit log for offline sync
 * Returns the offline visit ID for tracking
 */
export async function saveOfflineVisit(visitData) {
  if (!swRegistration?.active) {
    throw new Error('Service Worker not active');
  }

  return new Promise((resolve, reject) => {
    const channel = getMessageChannel();
    
    channel.port1.onmessage = (event) => {
      if (event.data.visitId) {
        console.log('[PWA] Visit saved offline:', event.data.visitId);
        resolve({
          visitId: event.data.visitId,
          queued: event.data.queued,
          isOffline: !navigator.onLine
        });
      } else {
        reject(new Error('Failed to save visit'));
      }
    };

    channel.port1.onerror = () => {
      reject(new Error('Message channel error'));
    };

    swRegistration.active.postMessage(
      {
        type: 'SAVE_OFFLINE_VISIT',
        visit: {
          ...visitData,
          isEmergency: visitData.isEmergency || false
        }
      },
      [channel.port2]
    );

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Save visit operation timed out'));
    }, 10000);
  });
}

/**
 * Save a signature capture for offline sync
 */
export async function saveSignature(visitId, signatureBase64) {
  if (!swRegistration?.active) {
    throw new Error('Service Worker not active');
  }

  return new Promise((resolve, reject) => {
    const channel = getMessageChannel();
    
    channel.port1.onmessage = () => {
      console.log('[PWA] Signature saved offline');
      resolve(true);
    };

    swRegistration.active.postMessage(
      {
        type: 'SAVE_SIGNATURE',
        visitId,
        signatureBase64
      },
      [channel.port2]
    );

    setTimeout(() => reject(new Error('Save signature timed out')), 5000);
  });
}

/**
 * Save a photo for offline upload
 */
export async function savePhoto(jobId, dataUrl, filename, contentType, caption = '') {
  if (!swRegistration?.active) {
    throw new Error('Service Worker not active');
  }

  return new Promise((resolve, reject) => {
    const channel = getMessageChannel();
    
    channel.port1.onmessage = (event) => {
      if (event.data.photoId) {
        console.log('[PWA] Photo saved offline:', event.data.photoId);
        resolve({
          photoId: event.data.photoId,
          queued: event.data.queued
        });
      } else {
        reject(new Error('Failed to save photo'));
      }
    };

    swRegistration.active.postMessage(
      {
        type: 'SAVE_PHOTO',
        jobId,
        dataUrl,
        filename,
        contentType,
        caption
      },
      [channel.port2]
    );

    setTimeout(() => reject(new Error('Save photo timed out')), 10000);
  });
}

/**
 * Get all cached jobs for offline viewing
 */
export async function getOfflineJobs() {
  if (!swRegistration?.active) {
    return { jobs: [], sites: [], systems: [] };
  }

  return new Promise((resolve) => {
    const channel = getMessageChannel();
    
    channel.port1.onmessage = (event) => {
      resolve(event.data || { jobs: [], sites: [], systems: [] });
    };

    swRegistration.active.postMessage(
      { type: 'GET_OFFLINE_JOBS' },
      [channel.port2]
    );

    setTimeout(() => resolve({ jobs: [], sites: [], systems: [] }), 5000);
  });
}

/**
 * Get pending sync items count
 */
export async function getPendingSyncCount() {
  if (!swRegistration?.active) {
    return { queue: 0, visits: 0, signatures: 0, photos: 0 };
  }

  return new Promise((resolve) => {
    const channel = getMessageChannel();
    
    channel.port1.onmessage = (event) => {
      const data = event.data || {};
      resolve({
        queue: data.queue?.length || 0,
        visits: data.visits?.length || 0,
        signatures: data.signatures?.length || 0,
        photos: data.photos?.length || 0
      });
    };

    swRegistration.active.postMessage(
      { type: 'GET_PENDING_SYNC' },
      [channel.port2]
    );

    setTimeout(() => resolve({ queue: 0, visits: 0, signatures: 0, photos: 0 }), 3000);
  });
}

/**
 * Check online status with improved detection
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Listen for connectivity changes
 */
export function onConnectivityChange(callback) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Request background sync (if supported)
 */
export async function requestSync() {
  if (!swRegistration || !('sync' in navigator)) {
    console.warn('[PWA] Background Sync not supported');
    return false;
  }

  try {
    await navigator.sync.register('kharon-sync');
    console.log('[PWA] Background sync requested');
    return true;
  } catch (error) {
    console.error('[PWA] Background sync failed:', error);
    return false;
  }
}

/**
 * Get PWA installation status
 */
export function getPWAStatus() {
  return {
    isServiceWorkerSupported: 'serviceWorker' in navigator,
    isIndexedDBSupported: 'indexedDB' in window,
    isBackgroundSyncSupported: 'sync' in navigator,
    isInstalled: window.matchMedia('(display-mode: standalone)').matches,
    isOnline: navigator.onLine
  };
}

export default {
  registerServiceWorker,
  cacheJobData,
  saveOfflineVisit,
  saveSignature,
  savePhoto,
  getOfflineJobs,
  getPendingSyncCount,
  isOnline,
  onConnectivityChange,
  requestSync,
  getPWAStatus
};
