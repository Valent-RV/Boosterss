import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/login": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      },
      "/register": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      },
      "/company": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      },
      "/forgot-password": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      },
      "/reset-password": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      },
      "/requests": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      },
      "/responses": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      }
    }
  }
});
