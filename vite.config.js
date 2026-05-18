import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const brand = env.VITE_BRAND || 'football1'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@brand': resolve(__dirname, `src/brands/${brand}`),
      },
    },
    define: {
      __DEFAULT_BRAND__: JSON.stringify(brand),
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/abstracts" as *;`,
        },
      },
    },
  }
})
