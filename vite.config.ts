import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Use relative base path so it works in any subpath (like https://<user>.github.io/<repo>/)
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/olympus-api': {
        target: 'https://olympusxyz.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/olympus-api/, ''),
        headers: {
          'Referer': 'https://olympusxyz.com/',
          'Origin': 'https://olympusxyz.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
    },
  },
})
