import { isCapacitor } from './capacitor';

let appListenerCleanup: (() => void) | null = null;

export function setupAppUrlListener(callback: (url: string) => void): () => void {
  if (!isCapacitor()) {
    // For web, we handle OAuth callback via redirect
    const handler = () => {
      if (window.location.search.includes('code=')) {
        callback(window.location.href);
      }
    };
    window.addEventListener('load', handler);
    return () => window.removeEventListener('load', handler);
  }

  // For native, use dynamic import to load Capacitor App module
  import('./capacitor-app').then((module) => {
    appListenerCleanup = module.setupAppUrlListener(callback);
  });

  return () => {
    if (appListenerCleanup) {
      appListenerCleanup();
      appListenerCleanup = null;
    }
  };
}

export async function getLaunchUrl(): Promise<{ url: string } | null> {
  if (!isCapacitor()) {
    return null;
  }

  const module = await import('./capacitor-app');
  return module.getLaunchUrl();
}

    };
    window.addEventListener('load', handler);
    return () => window.removeEventListener('load', handler);
  }

  // For native, use dynamic import to load Capacitor App module
  import('./capacitor-app').then((module) => {
    appListenerCleanup = module.setupAppUrlListener(callback);
  });

  return () => {
    if (appListenerCleanup) {
      appListenerCleanup();
      appListenerCleanup = null;
    }
  };
}

export async function getLaunchUrl(): Promise<{ url: string } | null> {
  if (!isCapacitor()) {
    return null;
  }

  const module = await import('./capacitor-app');
  return module.getLaunchUrl();
}
