import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import yaml from '@rollup/plugin-yaml'
import { codecovVitePlugin } from '@codecov/vite-plugin'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

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
    
    // PWA configuration
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/unpkg\.com\/leaflet/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'leaflet-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
      },
      manifest: {
        name: 'MatchaMap Toronto',
        short_name: 'MatchaMap',
        description: 'A curated, map-based guide to matcha cafes in Toronto',
        theme_color: '#7cb342',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['food', 'travel', 'lifestyle'],
        lang: 'en',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Find Cafes',
            short_name: 'Map',
            description: 'Find matcha cafes near you',
            url: '/?view=map',
            icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'My Passport',
            short_name: 'Passport',
            description: 'View your visited cafes',
            url: '/?view=passport',
            icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    }),
    
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
})