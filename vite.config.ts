// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // This tells Vite where to find your HTML pages
        main: resolve(__dirname, 'index.html'),
        cortex: resolve(__dirname, 'src/cortex.html'),
      },
    },
  },
})