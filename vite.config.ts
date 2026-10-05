import { defineConfig } from 'vitest/config';

// `vite` serves the demo; `vite build` builds the library (ADR-020). The demo build is added in step 6.3.
export default defineConfig({
  build: {
    // One ES module plus the default theme as a separate CSS file.
    lib: {
      entry: 'src/lib/buildEntry.ts',
      formats: ['es'],
      fileName: 'badfennec-todo',
      cssFileName: 'badfennec-todo',
    },
    copyPublicDir: false,
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
});
