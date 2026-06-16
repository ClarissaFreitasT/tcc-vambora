import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/roteiros': 'http://localhost:3000',
      '/usuarios': 'http://localhost:3000',
      '/dias': 'http://localhost:3000',
      '/itens': 'http://localhost:3000'
    }
  }
})
