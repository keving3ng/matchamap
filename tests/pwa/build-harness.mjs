import { build, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { reactCompilerBabelPlugins } from '../../frontend/babel-react-compiler.js'
const root = resolve('frontend')
const env = loadEnv('production', root)
await build({ root, configFile: false, plugins: [react({ babel: { plugins: reactCompilerBabelPlugins } })],
  define: { 'process.env.NODE_ENV': JSON.stringify('production'), 'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL) },
  build: { outDir: '/private/tmp/map5-evidence/harness', emptyOutDir: true, minify: 'terser',
    lib: { entry: resolve('tests/pwa/harness.ts'), formats: ['es'], fileName: () => 'harness.js' },
  },
})
