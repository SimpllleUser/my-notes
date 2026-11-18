import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import svgLoader from 'vite-svg-loader'
import { VitePWA } from 'vite-plugin-pwa'


import { cloudflare } from "@cloudflare/vite-plugin";


const icon = (size: number, purpose?: string) => ({
  src: `/ios/${size}.png`,
  sizes: `${size}x${size}`,
  type: 'image/png',
  ...(purpose ? { purpose } : {}),
})

const pwa = VitePWA({
  registerType: 'prompt',
  // Без цього маніфест і service worker не віддаються на localhost, і Chrome не пропонує встановлення.
  devOptions: { enabled: true, type: 'module', navigateFallback: 'index.html' },
  includeAssets: ['favicon.ico', 'ios/*.png'],
  manifest: {
    name: 'My Notes',
    short_name: 'Notes',
    description: 'Особисті нотатки',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [icon(192), icon(512), icon(512, 'maskable')],
  },
  workbox: {
    navigateFallback: '/index.html',
    // У precache — лише оболонка застосунку; важкі lazy-чанки (мови редактора тощо)
    // кешуються при першому використанні.
    globPatterns: ['index.html', 'assets/index-*.{js,css}', '*.{svg,ico}', 'ios/{180,192,512}.png'],
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
        handler: 'CacheFirst',
        options: { cacheName: 'assets', expiration: { maxEntries: 150 } },
      },
    ],
    cleanupOutdatedCaches: true,
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), svgLoader(), vueDevTools(), pwa, cloudflare()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})