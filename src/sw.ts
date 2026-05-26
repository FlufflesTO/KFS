/// <reference lib="webworker" />


// Define cache names
const CACHE_NAME = 'kharon-v1';
const STATIC_CACHE_NAME = 'static-v1';
const IMAGES_CACHE_NAME = 'images-v1';

// Define files to cache
const STATIC_FILES = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/logo.svg',
  '/kharon-portal-fetch.js',
  '/assets/css/main.css', // Assuming this is your main CSS
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_FILES);
      }),
      self.skipWaiting() // Activate worker immediately
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME && name !== IMAGES_CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      self.clients.claim() // Take control of all clients
    ])
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Don't cache certain types of requests
  if (event.request.destination === 'xmlhttprequest' || 
      event.request.destination === 'websocket' ||
      event.request.url.includes('/api/') ||
      event.request.url.includes('/portal/api/')) {
    // Handle API requests differently - try network first, fallback to cached data if available
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(event.request.clone())
          .then((networkResponse) => {
            // Update cache with fresh response
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => {
            // Try to serve from cache if network fails
            return cache.match(event.request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If no cached version, return offline page
              return caches.match('/offline');
            });
          });
      })
    );
    return;
  }

  // For static assets, try cache first then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        // Update cache in the background
        fetch(event.request.clone()).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
        });
        return response;
      }

      // Otherwise, try network
      return fetch(event.request.clone())
        .then((networkResponse) => {
          // If request is successful, cache a copy
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fails and it's an image, try image cache
          if (event.request.destination === 'image') {
            return caches.match('/placeholder-image.jpg').then((placeholder) => {
              return placeholder || new Response('', { status: 408, statusText: 'Request timeout' });
            });
          }
          
          // For other requests, return offline page
          return caches.match('/offline').then((offlineResponse) => {
            return offlineResponse || new Response('Offline', { status: 200 });
          });
        });
    })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle sync events for offline data
  if (event.data && event.data.type === 'SYNC_JOBS') {
    event.waitUntil(syncOfflineJobs());
  }
});

// Sync offline jobs when back online
async function syncOfflineJobs() {
  try {
    // In a real implementation, this would sync any queued offline job data
    console.log('Syncing offline job data...');
    
    // Get offline job queue from IndexedDB or localStorage
    // const offlineJobs = await getOfflineJobs();
    
    // For each offline job, send to server
    // for (const job of offlineJobs) {
    //   try {
    //     await fetch('/portal/api/submit-jobcard', {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify(job)
    //     });
    //     
    //     // Remove from offline queue after successful sync
    //     await removeFromOfflineQueue(job.id);
    //   } catch (error) {
    //     console.error('Failed to sync job:', job.id, error);
    //   }
    // }
  } catch (error) {
    console.error('Error syncing offline jobs:', error);
  }
}

// Background sync for critical data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-jobs') {
    event.waitUntil(syncOfflineJobs());
  }
});

// Handle push notifications if implemented
self.addEventListener('push', (event) => {
  if (event.data) {
    const payload = event.data.json();
    
    const options = {
      body: payload.body || 'New notification',
      icon: '/logo.svg',
      badge: '/badge.png',
      data: {
        url: payload.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(payload.title || 'Kharon Notification', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url)
  );
});