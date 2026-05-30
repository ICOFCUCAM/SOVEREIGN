import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The Dispatch console is a standalone SPA (separate deployable from the
// Sovereign website and from dispatch-api). In dev it proxies /v1 to the API so
// the browser talks same-origin; in production VITE_DISPATCH_API_URL points at
// the deployed API and the proxy is unused.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/v1": {
        target: process.env.VITE_DISPATCH_API_URL || "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  build: { outDir: "dist", sourcemap: false },
});
