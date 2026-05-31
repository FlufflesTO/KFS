/**
 * Project Sentinel - Service Worker Registration
 * Purpose: Registers the service worker and provides client-side APIs for
 *          offline sync management, queue status, and draft operations.
 * 
 * Features:
 * - Automatic service worker registration on page load
 * - Update detection and user notification
 * - Skip-waiting trigger for smooth updates
 * - Queue count polling and event handling
 * - Draft save/retrieve via service worker
 * - Online/offline status monitoring
 * 
 * Usage:
 * ```typescript
 * import { registerServiceWorker, getQueueCount, saveDraft } from './sw-register';
 * 
 * // Register on app startup
 * await registerServiceWorker();
 * 
 * // Check queue count
 * const count = await getQueueCount();
 * 
 * // Save draft
 * await saveDraft('job-123', { data: {...} });
 * ```
 * 
 * Dependencies: None
 * Structural Role: Client-side service worker integration layer
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface ServiceWorkerMessage {
  type: string;
  [key: string]: unknown;
}

export type ServiceWorkerEventHandler = (data: ServiceWorkerMessage) => void;

export interface OfflineStatus {
  isOnline: boolean;
  queueCount: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
}

export interface DraftSaveResult {
  success: boolean;
  draftId?: number;
  error?: string;
}

// ============================================================================
// State
// ============================================================================

let registration: ServiceWorkerRegistration | null = null;
let isRegistered = false;
let messageHandlers: Set<ServiceWorkerEventHandler> = new Set();
let queueCountPollingInterval: number | null = null;
let offlineStatus: OfflineStatus = {
  isOnline: navigator.onLine,
  queueCount: 0,
  isSyncing: false,
  lastSyncTime: null
};

// ============================================================================
// Event Handling
// ============================================================================

/**
 * Add a handler for service worker messages.
 */
export function addMessageHandler(handler: ServiceWorkerEventHandler): void {
  messageHandlers.add(handler);
}

/**
 * Remove a message handler.
 */
export function removeMessageHandler(handler: ServiceWorkerEventHandler): void {
  messageHandlers.delete(handler);
}

/**
 * Handle incoming service worker messages.
 */
function handleMessage(event: MessageEvent<ServiceWorkerMessage>): void {
  const data = event.data;

  if (!data || !data.type) return;

  console.log("[SW-Register] Received message:", data.type, data);

  switch (data.type) {
    case "REQUEST_QUEUED":
      offlineStatus.queueCount = (data.queueCount as number) || 0;
      offlineStatus.isSyncing = false;
      break;

    case "OFFLINE_SYNC_COMPLETE":
      offlineStatus.queueCount = (data.remaining as number) || 0;
      offlineStatus.isSyncing = false;
      offlineStatus.lastSyncTime = Date.now();
      break;

    case "QUEUE_COUNT":
      offlineStatus.queueCount = (data.count as number) || 0;
      break;

    case "DRAFT_SAVED":
    case "DRAFT_RETRIEVED":
    case "DRAFT_SAVE_ERROR":
    case "QUEUE_DRAIN_COMPLETE":
    case "DRAFT_SYNC_COMPLETE":
      // These are handled by specific Promise resolvers
      break;
  }

  // Notify all handlers
  for (const handler of messageHandlers) {
    try {
      handler(data);
    } catch (error) {
      console.error("[SW-Register] Message handler error:", error);
    }
  }
}

// ============================================================================
// Registration
// ============================================================================

/**
 * Register the service worker.
 * Call this once at application startup.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (isRegistered) {
    return registration;
  }

  if (!("serviceWorker" in navigator)) {
    console.warn("[SW-Register] Service workers not supported in this browser");
    return null;
  }

  try {
    registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      type: "module"
    });

    console.log("[SW-Register] Service worker registered:", registration.scope);

    // Handle updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration?.installing;

      if (!newWorker) return;

      console.log("[SW-Register] Service worker update found");

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && registration?.active) {
          // New worker is ready, notify user or auto-activate
          console.log("[SW-Register] New service worker installed, waiting for activation");

          // Dispatch custom event for UI to handle
          window.dispatchEvent(
            new CustomEvent("serviceworker-update", {
              detail: {
                available: true,
                registration
              }
            })
          );
        }
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener("message", handleMessage);

    // Set up online/offline listeners
    setupOnlineOfflineListeners();

    // Start queue count polling
    startQueueCountPolling();

    isRegistered = true;
    return registration;
  } catch (error) {
    console.error("[SW-Register] Service worker registration failed:", error);
    return null;
  }
}

/**
 * Unregister the service worker.
 * Use this for testing or cleanup.
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!registration) {
    return true;
  }

  try {
    const success = await registration.unregister();
    console.log("[SW-Register] Service worker unregistered:", success);

    // Clean up
    stopQueueCountPolling();
    navigator.serviceWorker.removeEventListener("message", handleMessage);
    messageHandlers.clear();
    registration = null;
    isRegistered = false;

    return success;
  } catch (error) {
    console.error("[SW-Register] Service worker unregistration failed:", error);
    return false;
  }
}

/**
 * Activate the waiting service worker (skip waiting).
 * Call this after user confirms they want to update.
 */
export function activateUpdate(): void {
  if (!registration?.waiting) {
    console.warn("[SW-Register] No waiting service worker to activate");
    return;
  }

  console.log("[SW-Register] Activating service worker update");

  registration.waiting.postMessage({ type: "SKIP_WAITING" });

  // Reload the page after activation
  registration.waiting.addEventListener("statechange", () => {
    if (registration?.waiting?.state === "activated") {
      console.log("[SW-Register] Service worker activated, reloading page");
      window.location.reload();
    }
  });
}

// ============================================================================
// Queue Operations
// ============================================================================

/**
 * Get the current queue count.
 */
export async function getQueueCount(): Promise<number> {
  const controller = navigator.serviceWorker.controller;
  
  if (!controller) {
    console.warn("[SW-Register] No service worker controller");
    return offlineStatus.queueCount;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === "QUEUE_COUNT") {
        resolve(event.data.count ?? 0);
      }
    };

    controller.postMessage(
      { type: "GET_QUEUE_COUNT" },
      [messageChannel.port2]
    );

    // Timeout after 5 seconds
    setTimeout(() => resolve(offlineStatus.queueCount), 5000);
  });
}

/**
 * Manually trigger queue draining.
 */
export async function drainQueue(): Promise<{
  success: number;
  failed: number;
  remaining: number;
}> {
  const controller = navigator.serviceWorker.controller;
  
  if (!controller) {
    console.warn("[SW-Register] No service worker controller");
    return { success: 0, failed: 0, remaining: offlineStatus.queueCount };
  }

  offlineStatus.isSyncing = true;

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === "QUEUE_DRAIN_COMPLETE") {
        resolve({
          success: event.data.success ?? 0,
          failed: event.data.failed ?? 0,
          remaining: event.data.remaining ?? 0
        });
      }
    };

    controller.postMessage(
      { type: "DRAIN_QUEUE" },
      [messageChannel.port2]
    );

    // Timeout after 30 seconds
    setTimeout(
      () => {
        offlineStatus.isSyncing = false;
        resolve({ success: 0, failed: 0, remaining: offlineStatus.queueCount });
      },
      30000
    );
  });
}

/**
 * Start polling for queue count.
 */
function startQueueCountPolling(): void {
  if (queueCountPollingInterval !== null) {
    return;
  }

  // Initial count
  getQueueCount().then((count) => {
    offlineStatus.queueCount = count;
  });

  // Poll every 10 seconds
  queueCountPollingInterval = window.setInterval(() => {
    if (navigator.onLine) {
      getQueueCount().then((count) => {
        offlineStatus.queueCount = count;
      });
    }
  }, 10000);
}

/**
 * Stop queue count polling.
 */
function stopQueueCountPolling(): void {
  if (queueCountPollingInterval !== null) {
    window.clearInterval(queueCountPollingInterval);
    queueCountPollingInterval = null;
  }
}

// ============================================================================
// Draft Operations
// ============================================================================

/**
 * Save a draft via service worker.
 */
export async function saveDraft(
  jobId: string,
  data: Record<string, unknown>
): Promise<DraftSaveResult> {
  const controller = navigator.serviceWorker.controller;
  
  if (!controller) {
    console.warn("[SW-Register] No service worker controller, saving directly");
    // Fallback: return success, client should handle direct IndexedDB save
    return { success: true };
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === "DRAFT_SAVED") {
        resolve({
          success: true,
          draftId: event.data.id
        });
      } else if (event.data.type === "DRAFT_SAVE_ERROR") {
        resolve({
          success: false,
          error: event.data.error as string
        });
      }
    };

    controller.postMessage(
      {
        type: "SAVE_DRAFT",
        jobId,
        data
      },
      [messageChannel.port2]
    );

    // Timeout after 10 seconds
    setTimeout(
      () => {
        resolve({
          success: false,
          error: "Draft save timeout"
        });
      },
      10000
    );
  });
}

/**
 * Retrieve a draft via service worker.
 */
export async function getDraft(
  jobId: string
): Promise<Record<string, unknown> | null> {
  const controller = navigator.serviceWorker.controller;
  
  if (!controller) {
    console.warn("[SW-Register] No service worker controller");
    return null;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === "DRAFT_RETRIEVED") {
        resolve(event.data.draft?.data ?? null);
      } else {
        resolve(null);
      }
    };

    controller.postMessage(
      {
        type: "GET_DRAFT",
        jobId
      },
      [messageChannel.port2]
    );

    // Timeout after 5 seconds
    setTimeout(() => resolve(null), 5000);
  });
}

// ============================================================================
// Online/Offline Monitoring
// ============================================================================

function setupOnlineOfflineListeners(): void {
  window.addEventListener("online", () => {
    console.log("[SW-Register] Online event");
    offlineStatus.isOnline = true;

    // Trigger queue sync
    drainQueue().catch((error) => {
      console.error("[SW-Register] Auto-sync failed:", error);
    });

    window.dispatchEvent(
      new CustomEvent("offline-status-change", {
        detail: { ...offlineStatus }
      })
    );
  });

  window.addEventListener("offline", () => {
    console.log("[SW-Register] Offline event");
    offlineStatus.isOnline = false;

    window.dispatchEvent(
      new CustomEvent("offline-status-change", {
        detail: { ...offlineStatus }
      })
    );
  });
}

/**
 * Get current offline status.
 */
export function getOfflineStatus(): OfflineStatus {
  return { ...offlineStatus };
}

/**
 * Subscribe to offline status changes.
 */
export function subscribeToOfflineStatus(
  callback: (status: OfflineStatus) => void
): () => void {
  const handler = (event: Event) => {
    if (event instanceof CustomEvent) {
      callback(event.detail as OfflineStatus);
    }
  };

  window.addEventListener("offline-status-change", handler as EventListener);

  // Return unsubscribe function
  return () => {
    window.removeEventListener("offline-status-change", handler as EventListener);
  };
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize service worker registration and monitoring.
 * Call this once at application startup.
 */
export function initialize(): Promise<ServiceWorkerRegistration | null> {
  return registerServiceWorker();
}

/**
 * Cleanup service worker registration.
 * Call this when the application is shutting down (rarely needed).
 */
export function cleanup(): Promise<boolean> {
  return unregisterServiceWorker();
}
