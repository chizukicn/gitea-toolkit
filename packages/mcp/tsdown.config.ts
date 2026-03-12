import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  format: ["cjs", "esm"],
  entry: {
    mcp: "./src/mcp.ts",
  },
  exports: true,
});
