import { isCapacitor } from './capacitor';

let browserOpenPromise: Promise<void> | null = null;
let browserClosePromise: Promise<void> | null = null;

export async function openBrowser(url: string): Promise<void> {
  if (!isCapacitor()) {
    window.open(url, '_blank', 'location=yes,clearsessioncache=yes,clearcache=yes');
    return;
  }

  // Dynamic import happens in the implementation file
  const module = await import('./capacitor-browser');
  await module.openBrowser(url);
}

export async function closeBrowser(): Promise<void> {
  if (!isCapacitor()) {
    return;
  }

  const module = await import('./capacitor-browser');
  await module.closeBrowser();
}
