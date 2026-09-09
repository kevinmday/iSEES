import { defineConfig } from "vite";
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig({
  root: __dirname,
  base: "./",
  plugins: [{ name: "copy-extension-manifest", writeBundle: () => copyFileSync(resolve(__dirname, "manifest.json"), resolve(__dirname, "dist", "manifest.json")) }],
  build: { outDir: "dist", emptyOutDir: true, rollupOptions: { input: "popup.html" } },
});
