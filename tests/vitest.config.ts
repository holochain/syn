import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/lib/*.test.ts'],
    // include: ['src/lib/bloat.test.ts'],
    reporters: 'verbose', // More detailed logs
    silent: false,        // Show all console logs
    threads: false,    
    testTimeout: 60 * 1000 * 3, // 3  mins
  },
});
