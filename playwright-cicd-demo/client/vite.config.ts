import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    // Proxy: wszystkie /api/* przekazywane do serwera Express na :3001
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  preview: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
