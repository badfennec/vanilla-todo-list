import { defineConfig } from 'vitest/config';

// Dev server and demo build use the defaults. Library mode is configured in step 6.2.
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
});
