import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/experiment-ai/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('katex') || id.includes('remark') || id.includes('rehype') || id.includes('micromark') || id.includes('unist') || id.includes('vfile') || id.includes('unified')) {
              return 'vendor-math-markdown';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
