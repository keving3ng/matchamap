import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import yaml from '@rollup/plugin-yaml'
import { codecovVitePlugin } from '@codecov/vite-plugin'
import fs from 'fs'

// Only load SSL certs if they exist (for local dev)
const httpsConfig = fs.existsSync('./localhost+2-key.pem') && fs.existsSync('./localhost+2.pem')
  ? {
    key: fs.readFileSync('./localhost+2-key.pem'),
    cert: fs.readFileSync('./localhost+2.pem')
  }
  : undefined

export default defineConfig({
  plugins: [
    react(),
    yaml(),
    // Put the Codecov vite plugin after all other plugins
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: 'matchamap-frontend',
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router'],
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