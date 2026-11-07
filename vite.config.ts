import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

const __dirname = dirname(fileURLToPath(import.meta.url));

// The version Chrome shows for the extension, and the day it was built:
// both appear in the page footer.
const { version } = JSON.parse(
  readFileSync(resolve(__dirname, 'public/manifest.json'), 'utf8')
) as { version: string };
const buildDate = new Date().toISOString().slice(0, 10);

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths: the build is loaded as a Chrome extension page
  // (chrome-extension://<id>/index.html), not served from a web root.
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  plugins: [
    react(),
    svgr({
      include: '**/*.svg?react',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
});
