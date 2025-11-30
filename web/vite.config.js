// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // 👇 permite que entre el dominio de Railway
    allowedHosts: ['web-production-01dfc.up.railway.app'],
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/v1':  { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    // 👇 igual que arriba (preview es lo que se usa en prod)
    allowedHosts: ['web-production-01dfc.up.railway.app'],
  },
})
