import { OLYMPUS_CHAPTERS } from '../data/olympusMangaData';
import allSeriesData from '../data/olympusAllSeries.json';
import rawSeriesChapters from '../data/olympusSeriesChapters.json';
import type { Manga, Chapter } from '../types';

// ---------------------------------------------------------------------------
// Cómo se habla con Olympus
//
// Nunca directamente desde el navegador: el sitio filtra por User-Agent, su
// dominio redirige a otro que va rotando, y ese otro no manda CORS. Todo pasa
// por el proxy que monta Vite (ver vite.config.ts). En un despliegue estático
// hay que apuntar VITE_OLYMPUS_PROXY a un proxy propio; si no, la app se queda
// con lo que trae empaquetado.
// ---------------------------------------------------------------------------

const PROXY: string = (import.meta.env.VITE_OLYMPUS_PROXY || '/olympus-api').replace(/\/+$/, '');

/** El catálogo en vivo se refresca como mucho una vez cada 12 h. */
const CATALOG_TTL_MS = 12 * 60 * 60 * 1000;
const CATALOG_CACHE_KEY = 'olympus.catalog.v4';
/** Las páginas se cachean por id de serie, que es estable; el slug no lo es. */
const PAGES_CACHE_PREFIX = 'olympus.pages.v1.';

const REQUEST_TIMEOUT_MS = 15000;

export interface RawOlympusSeriesItem {
  id: number;
  name: string;
  slug: string;
  cover: string;
  type: string;
}

interface ChapterMetadata {
  name: string;
  id: number;
  date: string;
}

interface SeriesChaptersEntry {
  total: number;
  chapters: ChapterMetadata[];
}

/** Falla la red, el proxy o el propio Olympus: distinto de "este capítulo no tiene páginas". */
export class OlympusUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OlympusUnavailableError';
  }
}

const bundledSeries = allSeriesData as RawOlympusSeriesItem[];
const seriesChaptersData = rawSeriesChapters as Record<string, SeriesChaptersEntry>;

// Las páginas precargadas son 3 MB de JSON y, desde que la carga en vivo
// funciona, solo sirven de caché para arrancar rápido en algunas series. No
// tiene sentido descargarlas en cada visita: se traen aparte y solo cuando
// alguien abre un capítulo.
let preloadedPagesData: Record<string, string[]> | null = null;
let preloadedPagesPromise: Promise<Record<string, string[]>> | null = null;

function ensurePreloadedPages(): Promise<Record<string, string[]>> {
  if (preloadedPagesData) return Promise.resolve(preloadedPagesData);
  preloadedPagesPromise ??= import('../data/olympusPreloadedPages.json')
    .then((mod) => {
      preloadedPagesData = mod.default as Record<string, string[]>;
      return preloadedPagesData;
    })
    .catch(() => {
      preloadedPagesData = {};
      return preloadedPagesData;
    });
  return preloadedPagesPromise;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

async function proxyFetch(path: string, accept: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${PROXY}${path}`, {
      signal: controller.signal,
      headers: { Accept: accept },
    });
  } catch (err) {
    throw new OlympusUnavailableError(
      `No se pudo contactar con Olympus a través del proxy (${PROXY}): ${(err as Error).message}`
    );
  } finally {
    clearTimeout(timer);
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await proxyFetch(path, 'application/json');
  if (!res.ok) throw new OlympusUnavailableError(`Olympus respondió ${res.status} a ${path}`);
  return (await res.json()) as T;
}

/** Lanza `limit` trabajadores sobre la lista y conserva el orden de entrada. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    let i = next++;
    while (i < items.length) {
      results[i] = await fn(items[i]);
      i = next++;
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Cuota llena o almacenamiento bloqueado: la app sigue, solo pierde caché.
  }
}

// ---------------------------------------------------------------------------
// Catálogo
//
// Olympus rota los slugs: de las 897 series empaquetadas el 7-nov, 210 ya
// apuntan a un slug muerto (404). El id de serie, en cambio, no cambia. Así que
// el volcado sirve para pintar la pantalla al instante, y por detrás se refresca
// el catálogo en vivo para recuperar los slugs actuales.
// ---------------------------------------------------------------------------

interface CatalogCache {
  fetchedAt: number;
  series: RawOlympusSeriesItem[];
}

let liveSeriesById: Map<number, RawOlympusSeriesItem> | null = null;
let catalogRefresh: Promise<RawOlympusSeriesItem[] | null> | null = null;
let hydrated: CatalogCache | null = null;
let hydrationTried = false;
let lastFailedRefresh = 0;
const FAILED_REFRESH_COOLDOWN_MS = 60_000;

/** Lee la copia guardada. Solo toca localStorage una vez por sesión. */
function hydrateLiveCatalog(): CatalogCache | null {
  if (hydrationTried) return hydrated;
  hydrationTried = true;

  const raw = readLocal(CATALOG_CACHE_KEY);
  if (!raw) return null;
  try {
    const cache = JSON.parse(raw) as CatalogCache;
    if (!Array.isArray(cache.series) || cache.series.length === 0) return null;
    liveSeriesById = new Map(cache.series.map((s) => [s.id, s]));
    hydrated = cache;
    return cache;
  } catch {
    return null;
  }
}

async function fetchCatalogPage(page: number): Promise<RawOlympusSeriesItem[]> {
  const json = await getJson<{
    data: { series: { data: RawOlympusSeriesItem[]; last_page: number } };
  }>(`/api/series?page=${page}&type=comic`);
  return json.data.series.data;
}

/** Barre las ~60 páginas del listado (unos 4 s) y guarda el resultado. */
export function refreshOlympusCatalog(): Promise<RawOlympusSeriesItem[] | null> {
  if (catalogRefresh) return catalogRefresh;

  catalogRefresh = (async () => {
    try {
      const first = await getJson<{
        data: { series: { data: RawOlympusSeriesItem[]; last_page: number } };
      }>('/api/series?page=1&type=comic');

      const lastPage = first.data.series.last_page || 1;
      const rest = Array.from({ length: Math.max(0, lastPage - 1) }, (_, i) => i + 2);
      const pages = await mapWithConcurrency(rest, 8, (p) => fetchCatalogPage(p).catch(() => []));

      // Nos quedamos solo con lo que se usa: el listado crudo trae cover_srcset
      // y contadores de visitas que no pinta nadie y triplican el tamaño.
      const series = [...first.data.series.data, ...pages.flat()].map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        cover: s.cover,
        type: s.type,
      }));

      if (series.length === 0) {
        lastFailedRefresh = Date.now();
        return null;
      }

      liveSeriesById = new Map(series.map((s) => [s.id, s]));
      hydrated = { fetchedAt: Date.now(), series };
      hydrationTried = true;
      writeLocal(CATALOG_CACHE_KEY, JSON.stringify(hydrated));
      return series;
    } catch {
      lastFailedRefresh = Date.now();
      return null;
    } finally {
      catalogRefresh = null;
    }
  })();

  return catalogRefresh;
}

/**
 * Carga la copia guardada del catálogo y, si está vieja, la refresca por
 * detrás. Se llama al arrancar la app: sin esto, los slugs rotados solo se
 * arreglarían al entrar en «Descubrir».
 */
export function ensureFreshOlympusCatalog(): Promise<RawOlympusSeriesItem[] | null> {
  const cache = hydrateLiveCatalog();
  if (cache && Date.now() - cache.fetchedAt <= CATALOG_TTL_MS) {
    return Promise.resolve(cache.series);
  }
  // Si Olympus no responde, no se reintenta el barrido en cada clic: sin este
  // freno, cada capítulo que se abriera lanzaría 60 peticiones condenadas.
  if (Date.now() - lastFailedRefresh < FAILED_REFRESH_COOLDOWN_MS) {
    return Promise.resolve(cache?.series ?? null);
  }
  return refreshOlympusCatalog();
}

/** El slug que hay que usar hoy para esta serie, no el que se empaquetó. */
function currentSlugFor(series: RawOlympusSeriesItem | undefined): string | undefined {
  if (!series) return undefined;
  return liveSeriesById?.get(series.id)?.slug || series.slug;
}

// Busca la serie por slug empaquetado, por id de manga o por id numérico.
export function findSeriesInfo(mangaId: string, slug?: string): RawOlympusSeriesItem | undefined {
  const cleanSlug = slug || mangaId.replace('olympus-', '');
  return bundledSeries.find(
    (s) => s.slug === cleanSlug || `olympus-${s.slug}` === mangaId || String(s.id) === cleanSlug
  );
}

// Transform raw Olympus series item into our Manga type
export function mapOlympusItemToManga(item: RawOlympusSeriesItem): Manga {
  const isManhwa = item.type === 'comic';
  const chInfo = seriesChaptersData[String(item.id)];
  const chaptersTotal = chInfo ? chInfo.total || chInfo.chapters.length : 1;

  return {
    id: `olympus-${item.slug}`,
    title: item.name.trim(),
    altTitle: 'Olympus Scanlation',
    author: 'Olympus Scans',
    artist: 'Olympus',
    coverUrl: item.cover || 'https://media.imagesolymp.xyz/comics/covers/default.webp',
    description: 'Serie de Olympus Scanlation en español. Abre la ficha para ver la sinopsis real y los capítulos.',
    status: 'ongoing',
    type: isManhwa ? 'manhwa' : 'manga',
    genres: ['Olympus', isManhwa ? 'Manhwa Webtoon' : 'Manga', 'En Español'],
    chaptersCount: chaptersTotal,
    source: 'olympus',
    defaultReadingMode: 'webtoon-vertical',
    inLibrary: false,
    addedAt: Date.now(),
    olympusSlug: item.slug,
  };
}

/**
 * Catálogo completo. Devuelve de inmediato lo empaquetado (o la última copia
 * en vivo) y, si esa copia está vieja, refresca por detrás y avisa por
 * `onRefreshed` para que la vista se repinte con los datos frescos.
 */
export async function getFullOlympusCatalog(
  onRefreshed?: (mangas: Manga[]) => void
): Promise<Manga[]> {
  const cache = hydrateLiveCatalog();
  const immediate = (cache?.series.length ? cache.series : bundledSeries).map(mapOlympusItemToManga);

  const stale = !cache || Date.now() - cache.fetchedAt > CATALOG_TTL_MS;
  if (stale) {
    void refreshOlympusCatalog().then((series) => {
      if (series && onRefreshed) onRefreshed(series.map(mapOlympusItemToManga));
    });
  }

  return immediate;
}

// ---------------------------------------------------------------------------
// Ficha de la serie
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, Manga['status']> = {
  'activo': 'ongoing',
  'en emisión': 'ongoing',
  'finalizado': 'completed',
  'completado': 'completed',
  'pausado': 'hiatus',
  'abandonado': 'hiatus',
};

interface SeriesDetailResponse {
  data: {
    summary: string | null;
    status?: { name: string };
    genres?: { name: string }[];
    cover?: string;
    chapter_count?: number;
  };
}

export async function fetchOlympusSeriesDetails(slug: string): Promise<Partial<Manga> | null> {
  await ensureFreshOlympusCatalog();

  const series = findSeriesInfo(slug, slug);
  const effectiveSlug = currentSlugFor(series) || slug;

  try {
    const json = await getJson<SeriesDetailResponse>(`/api/series/${encodeURIComponent(effectiveSlug)}`);
    const d = json.data;
    const genres = (d.genres || []).map((g) => g.name.trim()).filter(Boolean);

    return {
      description: d.summary?.trim() || 'Olympus no publica sinopsis para esta serie.',
      status: STATUS_MAP[(d.status?.name || '').trim().toLowerCase()] || 'ongoing',
      chaptersCount: d.chapter_count ?? undefined,
      coverUrl: d.cover || undefined,
      genres: genres.length > 0 ? genres : undefined,
    };
  } catch {
    // Sin conexión con Olympus nos quedamos con lo que sabemos del volcado.
    if (!series) return null;
    const chInfo = seriesChaptersData[String(series.id)];
    return {
      description: `Serie de Olympus Scanlation: ${series.name.trim()}. No se pudo conectar con Olympus para traer la sinopsis.`,
      status: 'ongoing',
      chaptersCount: chInfo ? chInfo.total || chInfo.chapters.length : undefined,
      coverUrl: series.cover || undefined,
    };
  }
}

// ---------------------------------------------------------------------------
// Lista de capítulos
// ---------------------------------------------------------------------------

const chaptersMemo = new Map<string, Chapter[]>();

function buildChapter(mangaId: string, number: string, date: string, pages: string[]): Chapter {
  return {
    id: `${mangaId}-ch-${number}`,
    mangaId,
    chapterNumber: number,
    title: `Capítulo ${number}`,
    language: 'es',
    pagesCount: pages.length,
    pages,
    publishDate: date,
    scanlationGroup: 'Olympus Scanlation',
  };
}

/** Páginas que ya tenemos sin pedir nada a la red. */
function knownPages(seriesId: string | null, bundleSlug: string, chapterNumber: string): string[] {
  const clean = String(parseFloat(chapterNumber) || chapterNumber);
  const candidates = [
    seriesId ? `series_${seriesId}_ch_${chapterNumber}` : '',
    seriesId ? `series_${seriesId}_ch_${clean}` : '',
    `olympus-${bundleSlug}_ch_${chapterNumber}`,
    `olympus-${bundleSlug}_ch_${clean}`,
  ].filter(Boolean);

  for (const key of candidates) {
    const hit = preloadedPagesData?.[key];
    if (hit && hit.length > 0) return hit;
  }

  if (seriesId) {
    const cached = readLocal(`${PAGES_CACHE_PREFIX}${seriesId}.${clean}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
      } catch {
        // caché corrupta: se ignora
      }
    }
  }

  return [];
}

interface ChapterListResponse {
  data: { name: string; id: number; published_at: string }[];
  meta: { last_page: number; total: number };
}

/** Lo que trae el volcado: como mucho 40 capítulos y solo de algunas series. */
function bundledChapters(mangaId: string, series: RawOlympusSeriesItem | undefined): Chapter[] {
  if (!series) return OLYMPUS_CHAPTERS[mangaId] || [];
  const info = seriesChaptersData[String(series.id)];
  if (!info?.chapters?.length) return OLYMPUS_CHAPTERS[mangaId] || [];

  return info.chapters
    .map((ch) =>
      buildChapter(
        mangaId,
        String(ch.name),
        ch.date || '2024-01-01',
        knownPages(String(series.id), series.slug, String(ch.name))
      )
    )
    .sort((a, b) => (parseFloat(a.chapterNumber) || 0) - (parseFloat(b.chapterNumber) || 0));
}

/**
 * Lista completa de capítulos, en vivo. Antes esto devolvía los 40 del volcado
 * más cientos de capítulos inventados con `pages: []`: por eso se veía la
 * estructura entera y luego no cargaba nada. Ahora, o son capítulos reales de
 * la API, o son los del volcado, pero no se inventa ninguno.
 */
export async function fetchOlympusChapters(mangaId: string, slug?: string): Promise<Chapter[]> {
  const memo = chaptersMemo.get(mangaId);
  if (memo) return memo;

  // El catálogo se espera a propósito: pedir capítulos con un slug caducado
  // devuelve 404 y nos dejaría sin lista. La primera vez cuesta unos segundos;
  // después sale de la copia guardada.
  await Promise.all([ensurePreloadedPages(), ensureFreshOlympusCatalog()]);

  const series = findSeriesInfo(mangaId, slug);
  const seriesId = series ? String(series.id) : null;
  const bundleSlug = series?.slug || slug || mangaId.replace('olympus-', '');
  const liveSlug = currentSlugFor(series) || bundleSlug;

  const query = (page: number) =>
    `/api/series/${encodeURIComponent(liveSlug)}/chapters?page=${page}&direction=asc&type=comic`;

  try {
    const first = await getJson<ChapterListResponse>(query(1));
    const lastPage = first.meta?.last_page || 1;
    const rest = Array.from({ length: Math.max(0, lastPage - 1) }, (_, i) => i + 2);
    const more = await mapWithConcurrency(rest, 6, (p) =>
      getJson<ChapterListResponse>(query(p))
        .then((r) => r.data)
        .catch(() => [])
    );

    const chapters = [...first.data, ...more.flat()]
      .map((ch) =>
        buildChapter(
          mangaId,
          String(ch.name),
          (ch.published_at || '').slice(0, 10) || '2024-01-01',
          knownPages(seriesId, bundleSlug, String(ch.name))
        )
      )
      .sort((a, b) => (parseFloat(a.chapterNumber) || 0) - (parseFloat(b.chapterNumber) || 0));

    if (chapters.length > 0) {
      chaptersMemo.set(mangaId, chapters);
      return chapters;
    }
  } catch {
    // Se cae al volcado justo debajo.
  }

  const fallback = bundledChapters(mangaId, series);
  if (fallback.length > 0) chaptersMemo.set(mangaId, fallback);
  return fallback;
}

// ---------------------------------------------------------------------------
// Páginas de un capítulo
// ---------------------------------------------------------------------------

/**
 * Las URLs reales de las páginas no están en etiquetas `<img>`: viven dentro
 * del payload de Nuxt (`window.__NUXT__`), con las barras escapadas como
 * `/`. Las portadas de "series recomendadas" sí salen como imágenes
 * normales, y se descartan por la ruta `/comics/covers/`.
 */
export function extractPagesFromChapterHtml(html: string): string[] {
  const unescaped = html.replace(/\\u002F/gi, '/');
  const re = /https:\/\/media\.imagesolymp\.xyz\/comics\/[^"'\s\\]+\.(?:webp|jpe?g|png)/gi;

  const seen = new Set<string>();
  const pages: string[] = [];
  for (const match of unescaped.matchAll(re)) {
    const url = match[0];
    if (/\/comics\/covers\//i.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    pages.push(url);
  }
  return pages;
}

export async function fetchOlympusChapterPages(
  mangaId: string,
  chapterNumber: string,
  slug?: string
): Promise<string[]> {
  await ensurePreloadedPages();

  const series = findSeriesInfo(mangaId, slug);
  const seriesId = series ? String(series.id) : null;
  const bundleSlug = series?.slug || slug || mangaId.replace('olympus-', '');
  const clean = String(parseFloat(chapterNumber) || chapterNumber);

  // 1. Lo que ya tenemos: volcado, capítulos curados o caché local.
  const known = knownPages(seriesId, bundleSlug, chapterNumber);
  if (known.length > 0) return known;

  const curated = OLYMPUS_CHAPTERS[mangaId]?.find(
    (c) => String(c.chapterNumber) === String(chapterNumber) || String(c.chapterNumber) === clean
  );
  if (curated?.pages?.length) return curated.pages;

  // 2. En vivo, a través del proxy. El slug se resuelve ahora, no antes: hace
  //    falta el catálogo fresco porque Olympus los rota.
  await ensureFreshOlympusCatalog();
  const liveSlug = currentSlugFor(series) || bundleSlug;

  const res = await proxyFetch(
    `/series/comic-${encodeURIComponent(liveSlug)}/capitulo/${encodeURIComponent(chapterNumber)}`,
    'text/html'
  );

  if (res.status === 404) return [];
  if (!res.ok) {
    throw new OlympusUnavailableError(
      `Olympus respondió ${res.status} al pedir el capítulo ${chapterNumber}.`
    );
  }

  const pages = extractPagesFromChapterHtml(await res.text());

  if (pages.length > 0 && seriesId) {
    writeLocal(`${PAGES_CACHE_PREFIX}${seriesId}.${clean}`, JSON.stringify(pages));
  }

  return pages;
}
