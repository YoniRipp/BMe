/** @type {import('vitest').UserConfig} */
export default {
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.js', '**/node_modules/**'],
    },
  },
};
