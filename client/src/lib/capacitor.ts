import { Capacitor } from '@capacitor/core';

export const isCordova = () => false;
export const isCapacitor = () => Capacitor.isNativePlatform();
export const isMobile = () => Capacitor.isNativePlatform() || 'cordova' in window;
