import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the static build works from any path (e.g. GitHub Pages).
  base: './',
  build: {
    // three.js alone is ~500 kB minified; split it out instead of warning.
    chunkSizeWarningLimit: 700,
  },
});
