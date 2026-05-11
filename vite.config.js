import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/login": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/register": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/company": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/requests": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/responses": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  }
});
