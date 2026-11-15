/**
 * Proxy de Olympus para desplegar la app como página pública.
 *
 * En local no hace falta: `npm run dev` y `npm run preview` ya montan el mismo
 * proxy (ver vite.config.ts). Esto es solo para cuando la app se sirve como
 * sitio estático (GitHub Pages, Netlify…), donde no hay servidor que haga de
 * intermediario.
 *
 * Hace tres cosas, que son las tres que el navegador no puede hacer solo:
 *   1. Manda un User-Agent de navegador. Sin él, Olympus devuelve páginas
 *      señuelo (/cp/cp-1.jpg) en vez de las reales.
 *   2. Sigue la redirección 302 de olympusxyz.com al dominio que toque hoy.
 *   3. Añade las cabeceras CORS que Olympus no manda.
 *
 * Desplegar (Cloudflare Workers, plan gratuito):
 *   npx wrangler deploy worker/olympus-proxy.js --name olympus-proxy \
 *     --compatibility-date 2026-11-14
 *
 * Y luego compilar la app apuntando ahí:
 *   VITE_OLYMPUS_PROXY=https://olympus-proxy.<tu-cuenta>.workers.dev/olympus-api npm run build
 */

const ORIGIN = 'https://olympusxyz.com';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Quién puede llamar a este worker desde un navegador.
 *
 * Se puede cambiar sin tocar el código, con una variable del worker:
 *   npx wrangler deploy ... --var ALLOWED_ORIGINS:"https://midominio.com"
 * Varios orígenes van separados por comas.
 *
 * OJO con lo que esto protege y lo que no: CORS lo aplica el navegador, así
 * que esto impide que *otra página web* use el proxy, pero no impide que
 * alguien lo llame con curl o desde un servidor. Es un cartel de "no pasar",
 * no una cerradura. Para una cerradura de verdad haría falta una clave.
 */
const DEFAULT_ALLOWED_ORIGINS = [
  'https://andreseduardorc-stack.github.io',
  // Para probar en local el build estático apuntando a este worker.
  'http://localhost:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5300',
];

function allowedOrigins(env) {
  const raw = env?.ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    Vary: 'Origin',
  };
}

export default {
  async fetch(request, env) {
    // Sin cabecera Origin no es una petición de otra web: no hay nada que
    // autorizar y tampoco hace falta responder con CORS.
    const origin = request.headers.get('Origin');
    const permitidos = allowedOrigins(env);
    const cors = origin ? (permitidos.includes(origin) ? corsHeaders(origin) : null) : {};

    if (origin && !cors) {
      return new Response(`Origen no autorizado: ${origin}`, { status: 403 });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'GET') {
      return new Response('Solo GET', { status: 405, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/olympus-api/, '') || '/';
    const upstream = await fetch(`${ORIGIN}${path}${url.search}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        Referer: `${ORIGIN}/`,
        'Accept-Language': 'es-ES,es;q=0.9',
        Accept: request.headers.get('Accept') || '*/*',
      },
      redirect: 'follow',
    });

    const headers = new Headers(cors);
    const type = upstream.headers.get('Content-Type');
    if (type) headers.set('Content-Type', type);
    // El catálogo y los capítulos cambian poco; un minuto de caché de borde
    // quita casi todas las peticiones repetidas.
    headers.set('Cache-Control', 'public, max-age=60');

    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
