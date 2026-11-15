import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Olympus no se puede pedir desde el navegador, y hay tres motivos, no uno:
//
//  1. Filtra por User-Agent. A un cliente que no se identifique como navegador
//     le devuelve páginas señuelo (/cp/cp-1.jpg … /cp/cp-9.jpg) en vez de las
//     reales. Por eso los proxys CORS públicos (allorigins y compañía) no
//     valen: ponen su propio User-Agent de servidor.
//  2. olympusxyz.com responde 302 hacia otro dominio, que va rotando.
//  3. Ese dominio final no manda cabeceras CORS.
//
// Este proxy resuelve los tres: pone el User-Agent, sigue la redirección y
// deja la respuesta en el mismo origen que la página.
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const olympusProxy = {
  '/olympus-api': {
    target: 'https://olympusxyz.com',
    changeOrigin: true,
    followRedirects: true,
    rewrite: (path: string) => path.replace(/^\/olympus-api/, ''),
    headers: {
      Referer: 'https://olympusxyz.com/',
      'User-Agent': BROWSER_UA,
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  },
}

// https://vite.dev/config/
export default defineConfig({
  // Ruta relativa para que funcione servida desde cualquier subcarpeta.
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  // El proxy hace falta tanto en `npm run dev` como en `npm run preview`.
  server: { proxy: olympusProxy },
  preview: { proxy: olympusProxy },
})
