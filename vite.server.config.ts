import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  publicDir: false,
  resolve: {
    alias: {
      '@shared': `${root}shared`,
    },
  },
  build: {
    ssr: 'server/app.ts',
    outDir: 'api/_server.generated',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'app.js',
      },
    },
  },
})
