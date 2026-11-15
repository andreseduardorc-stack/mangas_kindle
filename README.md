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
desplegar uno aparte. En `worker/` hay uno listo para Cloudflare Workers, con su configuración
en `worker/wrangler.toml`:

```powershell
npx wrangler deploy -c worker/wrangler.toml
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

Hay dos filtros, y conviene saber qué frena cada uno porque no son lo mismo.

**1. Lista de orígenes.** El worker solo responde a los orígenes de su lista: el dominio de
Pages del proyecto y unos cuantos `localhost` para probar el build estático. A cualquier otra
web le devuelve **403**. La lista está en `ALLOWED_ORIGINS`, dentro de `worker/wrangler.toml`.

Esto lo aplica el navegador, así que frena a otras *páginas web*, pero no a `curl` ni a un
script: una petición sin cabecera `Origin` lo esquiva.

**2. Clave compartida.** Si el worker tiene `PROXY_KEY`, exige la cabecera `X-Proxy-Key` con
ese valor y devuelve **401** a quien no la mande. Esto sí frena a `curl` y a los robots que
barren `*.workers.dev`, que es el abuso realista.

```powershell
npx wrangler secret put PROXY_KEY -c worker/wrangler.toml
```

Y la app se compila con la misma clave, en `VITE_OLYMPUS_PROXY_KEY`. En el workflow va como
*secret* del repositorio con ese nombre. Si el worker no tiene `PROXY_KEY`, no se exige nada
y todo sigue funcionando igual.

> **La clave no es un secreto y no puede serlo.** La app es un sitio estático: la clave viaja
> dentro del JS que descarga cualquiera y se lee abriendo el inspector. Sirve contra el uso
> automático, no contra alguien que mire tu bundle.

**3. Límite por IP.** Para cuando alguien saque la clave del bundle. Son 300 peticiones por
minuto y por IP, configuradas en `worker/wrangler.toml`, y a partir de ahí devuelve **429**.

El número no es al azar. Medido sobre la app real, el peor caso legítimo —arranque en frío,
abrir una serie de 201 capítulos y leer uno— gasta **68 peticiones**: 60 del barrido del
catálogo, 7 de la lista de capítulos y 1 de las páginas. Con 300 caben tres o cuatro personas
detrás de la misma IP haciendo todo eso a la vez. Para cambiarlo hay que editar el `.toml` y
volver a desplegar: el límite se fija al crear el binding y no se puede leer de una variable.

> **Tampoco esto es una cuota estricta.** Cloudflare lo cuenta **por centro de datos**, así que
> quien reparta las peticiones entre regiones multiplica su cupo, y los contadores son
> aproximados: una ráfaga puede pasarse antes de que se sincronicen. Cloudflare además
> desaconseja usar la IP como llave porque hay muchas compartidas; aquí no hay alternativa,
> porque no existen usuarios ni sesiones de los que tirar. Para un límite estricto haría falta
> un Durable Object.

Los tres filtros van en ese orden —origen, clave, límite— para que un rechazo barato no le
gaste cuota a nadie. Y los tres responden **con** cabeceras CORS, incluso el 403 a un origen
no autorizado: sin ellas el navegador convierte la respuesta en un error opaco y la app solo
podría decir «no se pudo contactar», que manda a buscar el problema donde no está. Así el
lector dice cuál de los tres saltó («El proxy rechazó la clave…», «El proxy no autoriza a
este dominio…», «Demasiadas peticiones desde tu conexión…») y la lista de capítulos cae al
volcado empaquetado en lugar de quedarse vacía.

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
  wrangler.toml     su configuración: orígenes permitidos y límite por IP
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
