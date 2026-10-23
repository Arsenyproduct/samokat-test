import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /<repo>/. The workflow passes the real
// repository name through BASE_PATH; the default matches the brief.
const base = process.env.BASE_PATH ?? '/samokat-test/';

export default defineConfig({
  base,
  plugins: [react()],
});
