/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import yaml from "@rollup/plugin-yaml";
import path from "path";

/** CI: quiet console + compact reporter; local: full output. Override with VITEST_VERBOSE=1 or VITEST_LOG_LEVEL=normal|quiet|verbose */
function resolveVitestLogOptions() {
    const isCI = process.env.CI === "true";
    const verboseFlag =
        process.env.VITEST_VERBOSE === "1" ||
        process.env.VITEST_VERBOSE === "true";
    const logLevel = process.env.VITEST_LOG_LEVEL;
    const forceNormal = logLevel === "normal";
    const forceQuiet = logLevel === "quiet";
    const forceVerbose = logLevel === "verbose" || verboseFlag;

    const silent: boolean | "passed-only" =
        forceVerbose || forceNormal
            ? false
            : isCI || forceQuiet
              ? "passed-only"
              : false;

    const terminalReporter = forceVerbose
        ? "verbose"
        : isCI && !forceNormal
          ? "dot"
          : "default";

    return { silent, terminalReporter, isCI };
}

const logOpts = resolveVitestLogOptions();

export default defineConfig({
    plugins: [
        react(),
        yaml(),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        css: true,
        silent: logOpts.silent,
        reporters: logOpts.isCI
            ? [logOpts.terminalReporter, "junit"]
            : [logOpts.terminalReporter],
        outputFile: {
            junit: "./test-results/junit.xml",
        },
        // Migration from v1→v2: Hook execution order changed to serial
        // If tests need parallel hooks, set: sequence: { hooks: 'parallel' }
        // Handle YAML files as assets
        server: {
            deps: {
                inline: [/@testing-library/],
            },
        },
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html", "lcov"],
            // Migration from v2→v3: coverage.all is now enabled by default
            // Migration from v1→v2: coverage.ignoreEmptyLines is now true by default
            exclude: [
                "node_modules/",
                "src/test/",
                "**/*.d.ts",
                "**/*.config.*",
                "dist/",
                "coverage/",
            ],
            thresholds: {
                global: {
                    branches: 75,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
            },
        },
    },
    // Treat YAML files as assets
    assetsInclude: ["**/*.yaml", "**/*.yml"],
});
