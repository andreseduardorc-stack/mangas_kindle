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
 * Desplegar (Cloudflare Workers, plan gratuito). La configuración está en
 * worker/wrangler.toml, así que no hacen falta banderas:
 *   npx wrangler deploy -c worker/wrangler.toml
 *   npx wrangler secret put PROXY_KEY -c worker/wrangler.toml   (opcional)
 *
 * Y luego compilar la app apuntando ahí:
 *   VITE_OLYMPUS_PROXY=https://olympus-proxy.<tu-cuenta>.workers.dev/olympus-api
 *   VITE_OLYMPUS_PROXY_KEY=<la misma clave>
 *
 * TRES FILTROS, Y CADA UNO FRENA UNA COSA DISTINTA
 *
 *   1. ALLOWED_ORIGINS -> 403. Lo aplica el navegador, así que frena a otras
 *      páginas web, pero no a curl ni a un script.
 *   2. PROXY_KEY -> 401. Esta sí frena a curl y a los robots que barren
 *      *.workers.dev. Pero NO es un secreto y no puede serlo: la app es un
 *      sitio estático, la clave viaja en el JS que descarga cualquiera y se
 *      lee abriendo el inspector.
 *   3. RATE_LIMITER -> 429. El último recurso, para cuando alguien saca la
 *      clave del bundle. Limita por IP.
 *
 * Lo que el límite por IP NO es, para no confiarse:
 *   - No es global. Cloudflare lo cuenta por centro de datos, así que quien
 *     reparta las peticiones entre varias regiones multiplica su cupo.
 *   - Es aproximado. Los contadores se sincronizan por detrás, y una ráfaga
 *     puede pasarse del límite antes de que se enteren.
 *   - La propia documentación de Cloudflare desaconseja usar la IP como
 *     llave, porque hay muchas compartidas. Aquí no hay alternativa: no hay
 *     usuarios ni sesiones de los que tirar. Por eso el límite va holgado, y
 *     el peor caso de un falso positivo es que la app tire del volcado
 *     empaquetado y lo diga en pantalla.
 *
 * Para un límite estricto de verdad haría falta un Durable Object.
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
    // X-Proxy-Key no es una cabecera de las que el navegador deja pasar sin
    // preguntar, así que cada petición dispara antes un OPTIONS. El Max-Age
    // hace que ese permiso se guarde y no se pague en cada llamada: sin él,
    // el barrido del catálogo pasaría de 60 peticiones a 120.
    'Access-Control-Allow-Headers': 'Accept, Content-Type, X-Proxy-Key',
    'Access-Control-Max-Age': '86400',
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
      // El 403 se devuelve CON cabeceras CORS, aunque el origen no esté en la
      // lista. Parece contradictorio y no lo es: sin ellas el navegador
      // convierte la respuesta en un error opaco y la app solo puede decir
      // "no se pudo contactar", que manda a buscar el problema donde no está.
      // Aquí no se filtra nada: el cuerpo es un "no" y nada más.
      return new Response(`Origen no autorizado: ${origin}`, {
        status: 403,
        headers: corsHeaders(origin),
      });
    }

    // El preflight va antes que la clave: el navegador nunca manda cabeceras
    // propias en un OPTIONS, así que exigirla aquí bloquearía todo.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'GET') {
      return new Response('Solo GET', { status: 405, headers: cors });
    }

    // La clave compartida, si está configurada. Lee la advertencia de arriba
    // sobre lo que esto frena y lo que no.
    if (env?.PROXY_KEY && request.headers.get('X-Proxy-Key') !== env.PROXY_KEY) {
      return new Response('Clave de proxy incorrecta o ausente', {
        status: 401,
        headers: cors,
      });
    }

    // Límite por IP. Va el último de los tres filtros a propósito: rechazar
    // por origen o por clave no debe gastarle cuota a nadie.
    if (env?.RATE_LIMITER) {
      const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) {
        return new Response('Demasiadas peticiones desde esta IP. Prueba en un minuto.', {
          status: 429,
          headers: { ...cors, 'Retry-After': '60' },
        });
      }
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
