import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const src = path.resolve(__dirname, "src");

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      "@": src,
      "@shared": path.resolve(src, "shared"),
      "@features": path.resolve(src, "features")
    }
  }
});
