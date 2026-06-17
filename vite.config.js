import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Injects window.__API_URL__ from VITE_API_URL at build time (optional).
// If you don't set VITE_API_URL, the app falls back to same-origin "/api/generate".
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    define: {
      "window.__API_URL__": JSON.stringify(env.VITE_API_URL || ""),
    },
  };
});
