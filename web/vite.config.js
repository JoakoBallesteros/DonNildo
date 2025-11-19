// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',   // clave para que otros dispositivos puedan entrar
    port: 5173,        // default explicito
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/v1':  { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
})