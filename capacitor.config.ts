import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thrivewellbeing.app',
  appName: 'Thrive Wellbeing',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
