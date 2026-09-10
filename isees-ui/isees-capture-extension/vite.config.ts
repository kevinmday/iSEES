import { defineConfig } from "vite";
import { cpSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig({
  root: __dirname,
  base: "./",
  plugins: [{ name: "copy-extension-runtime-files", writeBundle: () => {
    copyFileSync(resolve(__dirname, "manifest.json"), resolve(__dirname, "dist", "manifest.json"));
    cpSync(resolve(__dirname, "icons"), resolve(__dirname, "dist", "icons"), { recursive: true });
  } }],
  build: { outDir: "dist", emptyOutDir: true, rollupOptions: { input: "popup.html" } },
});
