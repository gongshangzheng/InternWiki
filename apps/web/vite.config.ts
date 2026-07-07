import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { projectTasksPlugin } from './plugins/project-tasks.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BASE = '/InternWiki/'

export default defineConfig({
  base: BASE,
  plugins: [react(), tailwindcss(), projectTasksPlugin(BASE)],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5180,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@fullcalendar')) return 'vendor-fullcalendar'
          if (id.includes('react-syntax-highlighter') || id.includes('refractor') || id.includes('prismjs')) return 'vendor-syntax-highlighter'
          if (id.includes('react-markdown') || id.includes('remark-gfm') || id.includes('rehype-raw') || id.includes('micromark') || id.includes('unified')) return 'vendor-markdown'
        },
      },
    },
  },
})
