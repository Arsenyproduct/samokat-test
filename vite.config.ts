import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /<repo>/. The workflow passes the real
// repository name through BASE_PATH; the default matches the brief.
const base = process.env.BASE_PATH ?? '/samokat-test/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    rollupOptions: {
      // Test task 1 at the root, «3 по цене 2» at /promo/
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        promo: resolve(import.meta.dirname, 'promo/index.html'),
      },
    },
  },
});
