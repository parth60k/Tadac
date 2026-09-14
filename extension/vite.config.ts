import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import fs from 'fs';
import path from 'path';

const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'manifest.json'), 'utf-8'));

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  server: {
    port: 5174,
    strictPort: true,
    hmr: {
      port: 5174,
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: 'index.html',
      },
    }
  }
});
