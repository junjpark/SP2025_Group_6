/* eslint-env node */
/* eslint no-undef: 0 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Default to local FastAPI dev server; allow override via VITE_PROXY_TARGET for Docker
const target = process.env.VITE_PROXY_TARGET || 'http://localhost:8000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true, 
    },
    proxy: {
      // Use a dedicated /api namespace to avoid colliding with frontend asset paths
      '/api': {
        target,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
