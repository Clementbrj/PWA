import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Met à jour automatiquement le SW
      devOptions: {
        enabled: true, // Active le PWA en mode dev
      },
      manifest: {
        name: "Mon Application React",
        short_name: "AppReact",
        description: "Une application React avec Vite et un Service Worker",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
