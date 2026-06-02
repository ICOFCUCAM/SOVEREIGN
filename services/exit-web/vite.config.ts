import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ExitOS console — standalone SPA. Separate deployable from the Sovereign
// website. In dev it proxies /v1 to the eventual exit-api so the browser talks
// same-origin; in production VITE_EXIT_API_URL is baked at build time.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      "/v1": {
        target: process.env.VITE_EXIT_API_URL || "http://127.0.0.1:8788",
        changeOrigin: true,
      },
    },
  },
  build: { outDir: "dist", sourcemap: false },
});
