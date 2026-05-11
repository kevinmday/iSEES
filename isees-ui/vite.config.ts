// ============================================================
// vite.config.ts — DEV PROXY (FIXED ROUTE COLLISION)
// FULL DROP-IN REPLACEMENT
// ============================================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {

      // --------------------------------------------------------
      // 🔥 API REPORT ENDPOINT
      // (frontend /report route now safe)
      // --------------------------------------------------------
      '/api/report': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },

      // --------------------------------------------------------
      // CLUSTERS
      // --------------------------------------------------------
      '/clusters': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },

      // --------------------------------------------------------
      // RUN (manual trigger)
      // --------------------------------------------------------
      '/run': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    }
  }
})