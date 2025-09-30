import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Only load SSL certs if they exist (for local dev)
const httpsConfig = fs.existsSync('./localhost+2-key.pem') && fs.existsSync('./localhost+2.pem')
  ? {
      key: fs.readFileSync('./localhost+2-key.pem'),
      cert: fs.readFileSync('./localhost+2.pem')
    }
  : undefined

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          maps: ['leaflet']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    https: httpsConfig
  },
  preview: {
    port: 4173
  }
})