import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // manifest.json géré manuellement dans public/
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        // Les skins (~3 Mo pour 6 PNG) n'ont rien à faire dans le precache :
        // chaque utilisateur n'affiche qu'un skin. Cache à l'usage ci-dessous.
        globIgnores: ['**/avatars/**'],
        runtimeCaching: [
          {
            // Avatars + photos d'exercices : cache au premier affichage,
            // servis depuis le cache ensuite (y compris hors-ligne à la salle)
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/avatars/') || url.pathname.startsWith('/exercises/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'kwest-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
  },
})
