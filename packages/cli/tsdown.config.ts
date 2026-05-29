import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  format: ["cjs", "esm"],
  entry: {
    cli: "./src/cli.ts",
  },
  exports: {
    bin: {
      tea: "./src/cli.ts"
    }
  },
});
