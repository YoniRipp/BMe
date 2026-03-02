import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.beme.app',
  appName: 'BeMe',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  server: {
    androidScheme: 'https',
    // Uncomment for local development with live reload:
    // url: 'http://YOUR_LOCAL_IP:5173',
    // cleartext: true,
  },
};

export default config;
