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
    },
  ],
]
