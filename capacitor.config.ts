import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.findmyfuel',
  appName: 'Find My Fuel',
  webDir: 'dist/public',
  server: {
    // Allow OAuth redirects to custom scheme
    cleartext: true,
    url: 'http://localhost:3000'
  },
  plugins: {
    Browser: {
      // Optional: custom toolbar color, etc.
    },
    App: {
      launchAutoHide: 'never'
    }
  }
};

export default config;
