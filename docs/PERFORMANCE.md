# Performance documentation

**Targets and daily patterns** (bundle budget, LCP, lazy routes, copy constants) live in the root [`CLAUDE.md`](../CLAUDE.md). This page links deeper references only.

| Topic | Document |
|--------|----------|
| React Compiler (Vite, ESLint) | [`REACT_COMPILER.md`](./REACT_COMPILER.md) |
| React rendering patterns (legacy manual memo guidance may overlap compiler) | [`react-performance-guide.md`](./react-performance-guide.md) |
| Optimization runbook | [`performance-optimization-runbook.md`](./performance-optimization-runbook.md) |
| Performance testing procedures | [`performance-testing-procedures.md`](./performance-testing-procedures.md) |

**Prefer:** Compiler-first memoization per `REACT_COMPILER.md` and `CONTRIBUTING.md`; use the runbook when investigating regressions or CI perf gates.
