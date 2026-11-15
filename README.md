# Kindle Manga & Manhwa Reader (Español)

Página web para leer **mangas** y **manhwas** en español del catálogo de **Olympus
Scanlation** (`https://olympusxyz.com/`), con la interfaz, los menús, la estética de tinta
electrónica (E-Ink) y la ergonomía de un **Amazon Kindle Paperwhite / Oasis**.

Es una página web normal. **Ya no es una PWA instalable**: se quitaron el `manifest.json`, el
Service Worker, los iconos y las capturas para tiendas.

---

## Cómo se arranca

```powershell
npm install
npm run dev          # http://localhost:5173
```

Para verla desde el móvil en la misma red Wi-Fi:

```powershell
npm run dev -- --host
```

Y para probar la versión compilada:

```powershell
npm run build
npm run preview
```

---

## Por qué hace falta un proxy

Esta es la parte importante del proyecto, y la que se rompe si se toca sin saberlo.

**Olympus no se puede pedir desde el navegador.** Hay tres obstáculos, no uno:

1. **Filtra por User-Agent.** A un cliente que no se identifique como navegador le devuelve
   páginas señuelo (`/cp/cp-1.jpg` … `/cp/cp-9.jpg`) en lugar de las reales. Por eso los
   proxys CORS públicos tipo `allorigins` **no sirven**: mandan su propio User-Agent de
   servidor y reciben el señuelo.
2. **`olympusxyz.com` responde 302** hacia otro dominio, que va cambiando.
3. **Ese dominio final no manda cabeceras CORS**, así que el navegador bloquea la respuesta.

El proxy de `vite.config.ts` resuelve los tres: pone el User-Agent, sigue la redirección y
deja la respuesta en el mismo origen que la página. Está montado tanto en `npm run dev` como
en `npm run preview`, bajo la ruta `/olympus-api`.

**Si la página se sirve sin ese proxy, no carga capítulos nuevos**: se queda con lo que trae
empaquetado y avisa en pantalla.

### Las páginas no están en etiquetas `<img>`

Las URLs reales de las páginas viven dentro del payload de Nuxt (`window.__NUXT__`) del HTML
del capítulo, con las barras escapadas como `/`. Eso lo desenreda
`extractPagesFromChapterHtml()` en `src/services/olympusService.ts`. Buscar `<img>` no
devuelve nada útil.

### Los slugs caducan

Olympus **rota los slugs de sus series cada pocos días**: `academia-de-la-ascension-20261107-…`
pasa a `academia-de-la-ascension-20261114-…`, y el viejo responde 404. Los ids numéricos de
serie, en cambio, no cambian.

Por eso la app refresca el catálogo en vivo al arrancar (`ensureFreshOlympusCatalog()`): barre
las ~60 páginas de `/api/series` en unos 4 segundos, lo guarda en `localStorage` durante 12 h
y usa ese mapa `id → slug actual`. **Sin ese refresco, una de cada cuatro series del volcado
empaquetado está muerta.**

---

## Publicarla en internet

Un hospedaje estático (GitHub Pages, Netlify Drop…) no puede hacer de proxy, así que hay que
desplegar uno aparte. En `worker/olympus-proxy.js` hay uno listo para Cloudflare Workers:

```powershell
npx wrangler deploy worker/olympus-proxy.js --name olympus-proxy --compatibility-date 2026-11-14
```

Y luego se compila la app apuntando ahí:

```powershell
$env:VITE_OLYMPUS_PROXY = "https://olympus-proxy.<tu-cuenta>.workers.dev/olympus-api"
npm run build
```

El workflow de `.github/workflows/deploy.yml` lee esa misma variable del repositorio
(*Settings → Secrets and variables → Actions → Variables*, con el nombre
`VITE_OLYMPUS_PROXY`). Si no está puesta, el sitio se publica igual pero solo mostrará los
capítulos que vienen empaquetados.

### Quién puede usar el proxy

El worker solo responde a los orígenes de su lista: el dominio de Pages del proyecto y unos
cuantos `localhost` para probar el build estático. A cualquier otra web le devuelve **403**.
La lista se cambia sin tocar el código, con una variable del worker:

```powershell
npx wrangler deploy worker/olympus-proxy.js --name olympus-proxy `
  --compatibility-date 2026-11-14 `
  --var ALLOWED_ORIGINS:"https://midominio.com,https://otro.com"
```

**Esto no es una cerradura, es un cartel de «no pasar».** CORS lo aplica el navegador, así
que impide que otra *página web* use el proxy, pero no impide que alguien lo llame con `curl`
o desde un servidor: una petición sin cabecera `Origin` pasa igual. Para cerrarlo de verdad
haría falta una clave compartida.

---

## Qué trae empaquetado y para qué

| Archivo | Tamaño | Para qué sirve hoy |
|---|---|---|
| `src/data/olympusAllSeries.json` | 218 KB | Catálogo de arranque, hasta que llega el refresco en vivo |
| `src/data/olympusSeriesChapters.json` | 1,4 MB | Lista de capítulos de reserva si Olympus no responde (40 por serie como mucho) |
| `src/data/olympusPreloadedPages.json` | 3,1 MB | Caché de páginas de algunos capítulos. **Se carga aparte y solo al abrir un capítulo**, para no pagarlo en cada visita |

Nada de eso es la fuente de verdad: lo bueno viene de la API. Son red de seguridad.

---

## Estructura

```
src/
  components/      vistas y lector (KindleReader es el grueso)
  services/
    olympusService.ts   todo el trato con Olympus: catálogo, capítulos y páginas
    storage.ts          localStorage (biblioteca, marcadores, ajustes)
    localFileManager.ts importación de CBZ
    mangaDexApi.ts      fuente alternativa
  data/            volcados de Olympus (ver tabla de arriba)
worker/
  olympus-proxy.js  proxy para despliegues estáticos
```

---

## Comandos

```powershell
npm run dev       # servidor de desarrollo, con el proxy montado
npm run build     # comprueba tipos y compila a dist/
npm run preview   # sirve dist/, también con el proxy
npm run lint      # oxlint
```

---

Proyecto personal, sin relación con Olympus Scanlation.
