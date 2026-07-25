import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Reachable over the tailnet, where the Host header is a MagicDNS name rather
  // than localhost. Scoped to `.ts.net` so it stays tailnet-only.
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.ts.net'],
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['.ts.net'],
  },
})
