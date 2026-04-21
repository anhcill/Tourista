'use client';

import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          console.log('[SW] Registered:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                console.log('[SW] New version available!');
                dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          });
        } catch (error) {
          console.error('[SW] Registration failed:', error);
        }
      });
    }
  }, []);
}
