import { Browser } from '@capacitor/browser';

export async function openBrowser(url: string): Promise<void> {
  await Browser.open({ url });
}

export async function closeBrowser(): Promise<void> {
  await Browser.close();
}
