import { Capacitor } from '@capacitor/core';

export const isCordova = () => false;
export const isCapacitor = () => Capacitor.isNativePlatform();
export const isMobile = () => Capacitor.isNativePlatform() || 'cordova' in window;

export async function openBrowser(url: string): Promise<void> {
  if (isCapacitor()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'location=yes,clearsessioncache=yes,clearcache=yes');
  }
}

export function setupAppUrlListener(callback: (url: string) => void): () => void {
  if (isCapacitor()) {
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appUrlOpen', (event: any) => {
        callback(event.url);
      });
    });
    return () => {
      // Note: removing listeners dynamically is tricky with dynamic imports
    };
  } else {
    // For web, we handle OAuth callback via redirect
    window.addEventListener('load', () => {
      if (window.location.search.includes('code=')) {
        callback(window.location.href);
      }
    });
    return () => {
      window.removeEventListener('load', () => {});
    };
  }
}

export function convertFileUrl(url: string): string {
  if (url.startsWith('file://')) {
    return url.replace('file://', 'http://');
  }
  return url;
}
