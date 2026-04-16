import { defineConfig } from "tsup";

export default defineConfig([
  // Main library + CLI
  {
    entry: {
      index: "src/index.ts",
      cli: "src/cli.ts",
    },
    format: ["esm"],
    dts: false,
    sourcemap: true,
    clean: true,
    splitting: true,
    treeshake: true,
    target: "node20",
    outDir: "dist",
  },
  // Hook scripts — each is a standalone entry point
  {
    entry: {
      "hooks/session-start": "src/hooks/session-start.ts",
      "hooks/keyword-detector": "src/hooks/keyword-detector.ts",
      "hooks/pre-tool-use": "src/hooks/pre-tool-use.ts",
      "hooks/post-tool-use": "src/hooks/post-tool-use.ts",
      "hooks/subagent-stop": "src/hooks/subagent-stop.ts",
      "hooks/stop": "src/hooks/stop.ts",
    },
    format: ["esm"],
    sourcemap: true,
    splitting: false,
    treeshake: true,
    target: "node20",
    outDir: "dist",
    // Bundle dependencies so hooks work standalone
    noExternal: [/.*/],
    external: ["node:fs", "node:path", "node:url", "node:events", "node:buffer", "node:stream", "node:util", "node:crypto"],
  },
]);
