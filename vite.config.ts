import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:8787' },
  },
  resolve: {
    alias: {
      '@': `${root}src`,
      '@shared': `${root}shared`,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replaceAll('\\', '/')
          if (!moduleId.includes('/node_modules/')) return
          if (moduleId.includes('/react-router')) return 'router-vendor'
          if (moduleId.includes('/@supabase/')) return 'supabase-vendor'
          if (moduleId.includes('/@tanstack/')) return 'query-vendor'
          if (moduleId.includes('/react/') || moduleId.includes('/react-dom/') || moduleId.includes('/scheduler/')) return 'react-vendor'
          return 'vendor'
        },
      },
    },
  },
})
