/**
 * Project Sentinel - Offline Status Indicator
 * Purpose: Visual indicator for field technicians when operating offline
 * Dependencies: None (vanilla TypeScript)
 * Structural Role: Reusable offline/online status component
 * 
 * Usage:
 *   import { initOfflineIndicator } from '../lib/components/OfflineIndicator';
 *   initOfflineIndicator();
 */

interface OfflineIndicatorOptions {
  containerSelector?: string;
  showOnLoad?: boolean;
  onStatusChange?: (isOnline: boolean) => void;
}

const DEFAULT_OPTIONS: OfflineIndicatorOptions = {
  containerSelector: '#offline-indicator',
  showOnLoad: true,
  onStatusChange: undefined
};

/**
 * Initialize the offline status indicator.
 * Shows a visual banner when the app is offline.
 */
export function initOfflineIndicator(options: OfflineIndicatorOptions = {}): void {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const isOnline = navigator.onLine;
  
  if (config.showOnLoad && !isOnline) {
    showOfflineBanner(config.containerSelector);
  }
  
  window.addEventListener('online', () => {
    hideOfflineBanner(config.containerSelector);
    config.onStatusChange?.(true);
  });
  
  window.addEventListener('offline', () => {
    showOfflineBanner(config.containerSelector);
    config.onStatusChange?.(false);
  });
}

/**
 * Show the offline banner.
 */
function showOfflineBanner(containerSelector?: string): void {
  if (containerSelector) {
    const container = document.querySelector<HTMLElement>(containerSelector);
    if (container) {
      container.classList.remove('hidden');
      container.setAttribute('aria-hidden', 'false');
      return;
    }
  }
  
  // Auto-create banner if no container found
  let banner = document.querySelector<HTMLElement>('[data-offline-banner]');
  if (!banner) {
    banner = document.createElement('div');
    banner.setAttribute('data-offline-banner', '');
    banner.className = 'fixed top-0 left-0 right-0 bg-amber-600 text-white px-4 py-2 text-center text-sm font-semibold z-50 shadow-lg';
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
      <span class="inline-flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.828-2.828m2.828 2.828L21 21M15.556 3a9 9 0 010 12.728m0 0l-2.828-2.828m2.828 2.828L21 21m-6-6l-2.828-2.828m2.828 2.828L21 21"/>
        </svg>
        You are offline - Changes will sync when connection is restored
      </span>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
  }
}

/**
 * Hide the offline banner.
 */
function hideOfflineBanner(containerSelector?: string): void {
  if (containerSelector) {
    const container = document.querySelector<HTMLElement>(containerSelector);
    if (container) {
      container.classList.add('hidden');
      container.setAttribute('aria-hidden', 'true');
      return;
    }
  }
  
  // Hide auto-created banner
  const banner = document.querySelector<HTMLElement>('[data-offline-banner]');
  if (banner) {
    banner.classList.add('hidden');
    banner.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Get current online status.
 */
export function isCurrentlyOnline(): boolean {
  return navigator.onLine;
}

/**
 * Get current offline status.
 */
export function isCurrentlyOffline(): boolean {
  return !navigator.onLine;
}
