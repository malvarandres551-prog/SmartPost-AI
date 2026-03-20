import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3005',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['axios'],
        },
      },
    },
  },
});
