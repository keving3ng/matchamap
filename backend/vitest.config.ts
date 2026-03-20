import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

/** CI: quiet console + compact reporter; local: full output. Override with VITEST_VERBOSE=1 or VITEST_LOG_LEVEL=normal|quiet|verbose */
function resolveVitestLogOptions() {
  const isCI = process.env.CI === 'true'
  const verboseFlag =
    process.env.VITEST_VERBOSE === '1' ||
    process.env.VITEST_VERBOSE === 'true'
  const logLevel = process.env.VITEST_LOG_LEVEL
  const forceNormal = logLevel === 'normal'
  const forceQuiet = logLevel === 'quiet'
  const forceVerbose = logLevel === 'verbose' || verboseFlag

  const silent: boolean | 'passed-only' =
    forceVerbose || forceNormal
      ? false
      : isCI || forceQuiet
        ? 'passed-only'
        : false

  const terminalReporter = forceVerbose
    ? 'verbose'
    : isCI && !forceNormal
      ? 'dot'
      : 'default'

  return { silent, terminalReporter, isCI }
}

const logOpts = resolveVitestLogOptions()

export default defineWorkersConfig({
  test: {
    silent: logOpts.silent,
    reporters: [logOpts.terminalReporter],
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          // Test environment bindings (required for tests to pass)
          bindings: {
            JWT_SECRET: 'dev-secret-change-in-production-use-wrangler-secret',
            GOOGLE_PLACES_API_KEY: 'test-google-places-api-key',
          },
        },
        // Use single worker mode to fix CI compatibility issue with snapshot client
        // Error: "this.snapshotClient.startCurrentRun is not a function"
        // This is a known issue with @cloudflare/vitest-pool-workers@0.10.x + Vitest 2.1.x
        singleWorker: true,
        isolate: false,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'drizzle/**',
        'scripts/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/__tests__/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
