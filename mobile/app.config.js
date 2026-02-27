export default {
  name: 'BeMe',
  slug: 'beme',
  version: '1.0.0',
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  },
};
