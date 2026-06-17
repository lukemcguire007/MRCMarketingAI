import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Optionally injects the API URL from VITE_API_URL at build time.
// If unset, the app falls back to same-origin "/api/generate" (the included
// serverless function on Vercel). No need to set anything for a standard deploy.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL || ""),
    },
  };
});
