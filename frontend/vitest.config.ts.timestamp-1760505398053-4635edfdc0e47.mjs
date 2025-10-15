// vitest.config.ts
import { defineConfig } from "file:///Users/kevingeng/code/matchamap/node_modules/vite/dist/node/index.js";
import react from "file:///Users/kevingeng/code/matchamap/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { codecovVitePlugin } from "file:///Users/kevingeng/code/matchamap/node_modules/@codecov/vite-plugin/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/kevingeng/code/matchamap/frontend";
var vitest_config_default = defineConfig({
  plugins: [
    react(),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== void 0,
      bundleName: "<bundle project name>",
      uploadToken: process.env.CODECOV_TOKEN
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    // Output JUnit XML for Codecov test analytics
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: {
      junit: "./test-results/junit.xml"
    },
    // Handle YAML files as assets
    server: {
      deps: {
        inline: [/@testing-library/]
      }
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "dist/",
        "coverage/"
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  // Treat YAML files as assets
  assetsInclude: ["**/*.yaml", "**/*.yml"]
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9rZXZpbmdlbmcvY29kZS9tYXRjaGFtYXAvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9rZXZpbmdlbmcvY29kZS9tYXRjaGFtYXAvZnJvbnRlbmQvdml0ZXN0LmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMva2V2aW5nZW5nL2NvZGUvbWF0Y2hhbWFwL2Zyb250ZW5kL3ZpdGVzdC5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGNvZGVjb3ZWaXRlUGx1Z2luIH0gZnJvbSBcIkBjb2RlY292L3ZpdGUtcGx1Z2luXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gICAgcGx1Z2luczogW1xuICAgICAgICByZWFjdCgpLFxuICAgICAgICBjb2RlY292Vml0ZVBsdWdpbih7XG4gICAgICAgICAgICBlbmFibGVCdW5kbGVBbmFseXNpczogcHJvY2Vzcy5lbnYuQ09ERUNPVl9UT0tFTiAhPT0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgYnVuZGxlTmFtZTogXCI8YnVuZGxlIHByb2plY3QgbmFtZT5cIixcbiAgICAgICAgICAgIHVwbG9hZFRva2VuOiBwcm9jZXNzLmVudi5DT0RFQ09WX1RPS0VOLFxuICAgICAgICB9KSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgICAgYWxpYXM6IHtcbiAgICAgICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgdGVzdDoge1xuICAgICAgICBnbG9iYWxzOiB0cnVlLFxuICAgICAgICBlbnZpcm9ubWVudDogXCJqc2RvbVwiLFxuICAgICAgICBzZXR1cEZpbGVzOiBbXCIuL3NyYy90ZXN0L3NldHVwLnRzXCJdLFxuICAgICAgICBjc3M6IHRydWUsXG4gICAgICAgIC8vIE91dHB1dCBKVW5pdCBYTUwgZm9yIENvZGVjb3YgdGVzdCBhbmFseXRpY3NcbiAgICAgICAgcmVwb3J0ZXJzOiBwcm9jZXNzLmVudi5DSSA/IFtcImRlZmF1bHRcIiwgXCJqdW5pdFwiXSA6IFtcImRlZmF1bHRcIl0sXG4gICAgICAgIG91dHB1dEZpbGU6IHtcbiAgICAgICAgICAgIGp1bml0OiBcIi4vdGVzdC1yZXN1bHRzL2p1bml0LnhtbFwiLFxuICAgICAgICB9LFxuICAgICAgICAvLyBIYW5kbGUgWUFNTCBmaWxlcyBhcyBhc3NldHNcbiAgICAgICAgc2VydmVyOiB7XG4gICAgICAgICAgICBkZXBzOiB7XG4gICAgICAgICAgICAgICAgaW5saW5lOiBbL0B0ZXN0aW5nLWxpYnJhcnkvXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGNvdmVyYWdlOiB7XG4gICAgICAgICAgICBwcm92aWRlcjogXCJ2OFwiLFxuICAgICAgICAgICAgcmVwb3J0ZXI6IFtcInRleHRcIiwgXCJqc29uXCIsIFwiaHRtbFwiLCBcImxjb3ZcIl0sXG4gICAgICAgICAgICBleGNsdWRlOiBbXG4gICAgICAgICAgICAgICAgXCJub2RlX21vZHVsZXMvXCIsXG4gICAgICAgICAgICAgICAgXCJzcmMvdGVzdC9cIixcbiAgICAgICAgICAgICAgICBcIioqLyouZC50c1wiLFxuICAgICAgICAgICAgICAgIFwiKiovKi5jb25maWcuKlwiLFxuICAgICAgICAgICAgICAgIFwiZGlzdC9cIixcbiAgICAgICAgICAgICAgICBcImNvdmVyYWdlL1wiLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHRocmVzaG9sZHM6IHtcbiAgICAgICAgICAgICAgICBnbG9iYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgYnJhbmNoZXM6IDc1LFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbnM6IDgwLFxuICAgICAgICAgICAgICAgICAgICBsaW5lczogODAsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHM6IDgwLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgLy8gVHJlYXQgWUFNTCBmaWxlcyBhcyBhc3NldHNcbiAgICBhc3NldHNJbmNsdWRlOiBbXCIqKi8qLnlhbWxcIiwgXCIqKi8qLnltbFwiXSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx5QkFBeUI7QUFKbEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyx3QkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sa0JBQWtCO0FBQUEsTUFDZCxzQkFBc0IsUUFBUSxJQUFJLGtCQUFrQjtBQUFBLE1BQ3BELFlBQVk7QUFBQSxNQUNaLGFBQWEsUUFBUSxJQUFJO0FBQUEsSUFDN0IsQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNILEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN4QztBQUFBLEVBQ0o7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNGLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLFlBQVksQ0FBQyxxQkFBcUI7QUFBQSxJQUNsQyxLQUFLO0FBQUE7QUFBQSxJQUVMLFdBQVcsUUFBUSxJQUFJLEtBQUssQ0FBQyxXQUFXLE9BQU8sSUFBSSxDQUFDLFNBQVM7QUFBQSxJQUM3RCxZQUFZO0FBQUEsTUFDUixPQUFPO0FBQUEsSUFDWDtBQUFBO0FBQUEsSUFFQSxRQUFRO0FBQUEsTUFDSixNQUFNO0FBQUEsUUFDRixRQUFRLENBQUMsa0JBQWtCO0FBQUEsTUFDL0I7QUFBQSxJQUNKO0FBQUEsSUFDQSxVQUFVO0FBQUEsTUFDTixVQUFVO0FBQUEsTUFDVixVQUFVLENBQUMsUUFBUSxRQUFRLFFBQVEsTUFBTTtBQUFBLE1BQ3pDLFNBQVM7QUFBQSxRQUNMO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNKO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDUixRQUFRO0FBQUEsVUFDSixVQUFVO0FBQUEsVUFDVixXQUFXO0FBQUEsVUFDWCxPQUFPO0FBQUEsVUFDUCxZQUFZO0FBQUEsUUFDaEI7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFBQTtBQUFBLEVBRUEsZUFBZSxDQUFDLGFBQWEsVUFBVTtBQUMzQyxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
