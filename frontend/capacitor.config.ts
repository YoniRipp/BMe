import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bme.app',
  appName: 'BMe',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
  },
  server: {
    // Uncomment for local development with live reload:
    // url: 'http://YOUR_LOCAL_IP:5173',
    // cleartext: true,
  },
};

export default config;
