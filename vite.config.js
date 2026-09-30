import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/produz-facil/',
  optimizeDeps: {
    include: ['recharts'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
        },
      },
    },
  },
})
