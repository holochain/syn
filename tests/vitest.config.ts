import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    threads: false,
    testTimeout: 60 * 1000 * 5, // 5  mins
  },
});
