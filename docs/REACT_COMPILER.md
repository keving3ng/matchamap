# React Compiler

MatchaMap uses the [React Compiler](https://react.dev/learn/react-compiler) (Babel plugin) so components and hooks follow the Rules of React and get automatic memoization where the compiler can prove it is safe.

## Where it is configured

| Piece | Location |
|--------|----------|
| Babel plugin + options (`compilationMode`, `target`) | `frontend/babel-react-compiler.js` |
| Vite dev & production builds | `frontend/vite.config.js` → `@vitejs/plugin-react` `babel.plugins` |
| Vitest | **No compiler** — `frontend/vitest.config.ts` uses default React plugin (compiled code needs a live renderer; test setup runs before any React tree) |
| ESLint rule (compiler violations) | `frontend/eslint.config.js` → `react-compiler/react-compiler` |

## Rollout modes

`compilationMode` in `babel-react-compiler.js` controls scope:

- **`all`** (current): Every function component and hook in compiled files is a candidate. Matches production rollout in the PR plan.
- **`annotation`**: Only files that opt in with the `"use memo"` directive at the top are compiled—useful for incremental adoption or debugging a single file.

Existing manual `useMemo`, `useCallback`, and `React.memo` remain valid; the compiler composes with them.

## When to change the plan

- Switch to **`annotation`** temporarily if a specific file miscompiles; add `"use memo"` only where safe, file bugs upstream, or opt that file out via compiler options/docs.
- Re-run `npm run bundle:check` after changing compiler or React versions; the compile-time plugin should not materially grow the runtime bundle.

## References

- [React Compiler docs](https://react.dev/learn/react-compiler)
- [babel-plugin-react-compiler](https://www.npmjs.com/package/babel-plugin-react-compiler)
