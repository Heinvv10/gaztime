import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/pos/',
  plugins: [react()],
  server: {
    proxy: { '/api': { target: 'http://localhost:3333', changeOrigin: true } },
    port: 3004,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
