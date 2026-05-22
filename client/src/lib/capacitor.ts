import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

export const isCordova = () => false;
export const isCapacitor = () => Capacitor.isNativePlatform();
export const isMobile = () => Capacitor.isNativePlatform() || 'cordova' in window;

export async function openBrowser(url: string): Promise<void> {
  if (isCapacitor()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'location=yes,clearsessioncache=yes,clearcache=yes');
  }
}

export function setupAppUrlListener(callback: (url: string) => void): () => void {
  if (isCapacitor()) {
    const { App } = require('@capacitor/app');
    App.addListener('appUrlOpen', (event: any) => {
      callback(event.url);
    });
    return () => {
      App.removeAllListeners();
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
