import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development, requests to /api and /socket.io are forwarded to the backend on port 5000.
export default defineConfig({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 2500 },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    proxy: {
      "/api": "http://localhost:5000",
      "/socket.io": { target: "http://localhost:5000", ws: true },
    },
  },
});
