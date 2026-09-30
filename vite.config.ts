import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
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

