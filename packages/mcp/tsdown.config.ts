import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  format: ["cjs", "esm"],
  entry: {
    mcp: "./src/mcp.ts",
  },
  exports: {
    bin: {
      "gitea-mcp": "./src/mcp.ts"
    }
  }
});
