/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import yaml from "@rollup/plugin-yaml";
import path from "path";

export default defineConfig({
    plugins: [
        // No React Compiler here: compiled output uses react-compiler-runtime and
        // must run under a React renderer; global test setup runs before any tree.
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
        // Output JUnit XML for CI
        reporters: process.env.CI ? ["default", "junit"] : ["default"],
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
