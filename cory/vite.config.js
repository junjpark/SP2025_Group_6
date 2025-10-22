import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const target = process.env.VITE_PROXY_TARGET || 'http://backend:8000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
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
