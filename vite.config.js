import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const BRAND_KEYS = ['football1', 'football2']

function getBrandKeyFromMode(mode) {
  const key = (mode || '').toLowerCase()
  return BRAND_KEYS.includes(key) ? key : 'football1'
}

export default defineConfig(({ mode }) => {
  const brand = getBrandKeyFromMode(mode)

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@brand': resolve(__dirname, `src/brands/${brand}`),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/abstracts" as *;`,
        },
      },
    },
    server: {
      host: true,
      port: 5173,
      strictPort: false,
      proxy: {
        '/football': {
          target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
        },
        '/opentdb': {
          target: 'https://opentdb.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/opentdb/, ''),
        },
      },
    },
  }
})
