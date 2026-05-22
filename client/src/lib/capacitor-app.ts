import { App } from '@capacitor/app';

export function setupAppUrlListener(callback: (url: string) => void): () => void {
  App.addListener('appUrlOpen', (event: { url: string }) => {
    callback(event.url);
  });

  return () => {
    App.removeAllListeners();
  };
}

export async function getLaunchUrl(): Promise<{ url: string } | null> {
  try {
    const result = await App.getLaunchUrl();
    return result.url ? { url: result.url } : null;
  } catch {
    return null;
  }
}
