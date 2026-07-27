import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api/reports": {
          target: "http://localhost:8083",
          changeOrigin: true,
          secure: false,
        },
        "/api": {
          target: "http://localhost:8082",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: true,
      port: 4173, 
      proxy: {
        "/api/reports": {
          target: "http://ticket-report-service:8083",
          changeOrigin: true,
          secure: false,
        },
        "/api": {
          target: "http://ticket-booking-service:8082",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
