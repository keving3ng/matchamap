import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import yaml from '@rollup/plugin-yaml'
import { codecovVitePlugin } from '@codecov/vite-plugin'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import process from 'node:process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Only load SSL certs if they exist (for local dev)
const httpsConfig = fs.existsSync('./localhost+2-key.pem') && fs.existsSync('./localhost+2.pem')
  ? {
    key: fs.readFileSync('./localhost+2-key.pem'),
    cert: fs.readFileSync('./localhost+2.pem')
  }
  : undefined

export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
    yaml(),

    // Gzip compression for production
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),

    // Brotli compression for production (better than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),

    // Bundle analyzer (only in build mode with ANALYZE=true)
    process.env.ANALYZE === 'true' && visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // or 'sunburst', 'network'
    }),

    // Put the Codecov vite plugin after all other plugins
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: 'matchamap-frontend',
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,

    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },

    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          vendor: ['react', 'react-dom'],

          // Router (already split)
          router: ['react-router', 'react-router-dom'],

          // Maps (heavy dependency)
          maps: ['leaflet'],

          // State management
          state: ['zustand'],

          // Utils
          utils: ['dompurify'],
        },

        // Better chunk naming for cache busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    },

    // Chunk size warning threshold
    chunkSizeWarningLimit: 500, // warn if any chunk exceeds 500KB
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
}))