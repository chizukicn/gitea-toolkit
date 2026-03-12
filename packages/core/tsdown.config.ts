import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  format: ["cjs", "esm"],
  entry: {
    index: "./src/index.ts",
  },
  exports: true,
});
