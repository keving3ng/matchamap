import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reactCompilerBabelPlugins } from './babel-react-compiler.js'
import tailwindcss from '@tailwindcss/vite'
import yaml from '@rollup/plugin-yaml'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import process from 'node:process'
import { shellWorker } from './scripts/pwa-shell.js'

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
    react({
      babel: {
        plugins: reactCompilerBabelPlugins,
      },
    }),
    tailwindcss(),
    yaml(),
    shellWorker(),

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

  ].filter(Boolean),

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: 'dist',
    manifest: true,
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
        manualChunks(id) {
          const normalized = id.replaceAll('\\', '/')
          if (id.includes('preload-helper') || id.includes('commonjsHelpers')) return 'vendor'
          if (normalized.includes('/node_modules/')) {
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(normalized)) return 'vendor'
            if (/\/node_modules\/(react-router|react-router-dom)\//.test(normalized)) return 'router'
            if (/\/node_modules\/leaflet\//.test(normalized) && !normalized.endsWith('.css')) return 'maps'
            if (/\/node_modules\/zustand\//.test(normalized)) return 'state'
            if (/\/node_modules\/dompurify\//.test(normalized)) return 'utils'
            if (/\/node_modules\/lucide-react\/dist\/esm\/(createLucideIcon|Icon|defaultAttributes|shared|icons\/(map-pin|instagram|calendar|user|info|menu|arrow-left|log-in|log-out|mail|settings|triangle-alert))/.test(normalized)) return 'icons'
          }
          if (normalized.endsWith('/src/constants/copy.ts')) return 'copy'
          if (
            normalized.endsWith('/src/pwa/install.ts') ||
            normalized.endsWith('/src/components/ui/Button.tsx')
          ) {
            return 'pwa-ui'
          }
          if (
            normalized.endsWith('/src/utils/api.ts') ||
            normalized.endsWith('/src/stores/dataStore.ts') ||
            normalized.endsWith('/src/stores/cityStore.ts') ||
            normalized.endsWith('/src/config/cities.yaml') ||
            normalized.includes('/src/offline/')
          ) {
            return 'data'
          }
          if (
            normalized.endsWith('/src/hooks/useFeatureToggle.ts') ||
            normalized.endsWith('/src/hooks/useAppFeatures.ts') ||
            normalized.endsWith('/src/stores/adminStore.ts') ||
            normalized.endsWith('/src/config/features.yaml')
          ) {
            return 'features'
          }
          if (
            normalized.endsWith('/src/stores/uiStore.ts') ||
            normalized.endsWith('/src/stores/visitedCafesStore.ts') ||
            normalized.endsWith('/src/stores/locationStore.ts') ||
            normalized.endsWith('/src/utils/cityMapping.ts') ||
            normalized.endsWith('/src/utils/distance.ts')
          ) {
            return 'core'
          }
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
