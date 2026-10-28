/**
 * Filter function for React Compiler sources.
 * Excludes stores, offline cache, PWA utilities, and utils from React compilation,
 * while allowing components and hooks to be compiled.
 *
 * @param {string} filename
 * @returns {boolean}
 */
const shouldCompileSource = (filename) => {
  if (!filename) return false
  const normalized = filename.replace(/\\/g, '/')
  if (
    /(^|\/)(stores|offline|pwa|utils)(\/|$)/.test(normalized) ||
    normalized === 'data.ts' ||
    normalized.endsWith('/data.ts')
  ) {
    return false
  }
  return true
}

/**
 * Shared React Compiler Babel plugin config for Vite (dev/build) and Vitest.
 * @see https://react.dev/learn/react-compiler
 */
export const reactCompilerBabelPlugins = [
  [
    'babel-plugin-react-compiler',
    {
      /** Compile every component/hook; use "annotation" for opt-in via "use memo". */
      compilationMode: 'all',
      target: '19',
      sources: shouldCompileSource,
    },
  ],
]
