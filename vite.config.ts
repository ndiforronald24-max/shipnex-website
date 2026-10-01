import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Mirror the production nginx routing (nginx.prod.conf proxies /api/ to the
    // backend on the same origin). This lets the app use the relative '/api'
    // base URL in development too, so it behaves identically in both places and
    // no longer depends on VITE_API_URL being exported. Without this, a plain
    // `npm run dev` sends every request to the Vite server and gets a 404.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    watch: {
      // The Vite root is the repository root, so by default the dev server
      // watches backend/ as well - including bin/ and obj/. Any .NET build then
      // rewrites files MSBuild still holds open, and chokidar dies with
      // "EBUSY: resource busy or locked", taking the whole dev server with it.
      // The frontend has no dependency on any of these paths.
      ignored: [
        '**/backend/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/logs/**',
        '**/uploads/**',
        '**/brand-source/**',
        '**/docs/**',
      ],
    },
  },
})

