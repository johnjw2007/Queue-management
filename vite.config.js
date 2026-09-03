import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // face-api.js tries to import Node.js `fs` which doesn't exist in the browser.
      // This stubs it out so the browser build succeeds.
      fs: 'node:fs',
    }
  },
  optimizeDeps: {
    exclude: ['face-api.js']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
})
