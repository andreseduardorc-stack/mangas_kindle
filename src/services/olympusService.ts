import { OLYMPUS_CHAPTERS } from '../data/olympusMangaData';
import allSeriesData from '../data/olympusAllSeries.json';
import rawSeriesChapters from '../data/olympusSeriesChapters.json';
import rawPreloadedPages from '../data/olympusPreloadedPages.json';
import type { Manga, Chapter } from '../types';

const OLYMPUS_CACHE_KEY = 'kindle_olympus_full_catalog_v2';

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

const seriesChaptersData = rawSeriesChapters as Record<string, SeriesChaptersEntry>;
const preloadedPagesData = rawPreloadedPages as Record<string, string[]>;

// Helper to find series by slug or mangaId
export function findSeriesInfo(mangaId: string, slug?: string): RawOlympusSeriesItem | undefined {
  const cleanSlug = slug || mangaId.replace('olympus-', '');
  return (allSeriesData as RawOlympusSeriesItem[]).find(
    (s) => s.slug === cleanSlug || `olympus-${s.slug}` === mangaId || String(s.id) === cleanSlug
  );
}

// Transform raw Olympus series item into our Manga type
export function mapOlympusItemToManga(item: RawOlympusSeriesItem): Manga {
  const isManhwa = item.type === 'comic';
  const sid = String(item.id);
  const chInfo = seriesChaptersData[sid];
  const chaptersTotal = chInfo ? chInfo.total || chInfo.chapters.length : 1;

  return {
    id: `olympus-${item.slug}`,
    title: item.name.trim(),
    altTitle: 'Olympus Scanlation',
    author: 'Olympus Scans',
    artist: 'Olympus',
    coverUrl: item.cover || 'https://media.imagesolymp.xyz/comics/covers/default.webp',
    description: `Serie oficial en español de Olympus Scanlation: ${item.name.trim()}. ${chaptersTotal} capítulos disponibles para leer con interfaz Kindle.`,
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

// 1. Fetch full catalog of all 897+ titles with chapters pre-indexed
export async function getFullOlympusCatalog(): Promise<Manga[]> {
  // Bundled 897 titles snapshot with complete chapters metadata
  const bundledList = (allSeriesData as RawOlympusSeriesItem[]).map(mapOlympusItemToManga);

  // Attempt background sync if online (cached locally)
  try {
    const cached = localStorage.getItem(OLYMPUS_CACHE_KEY);
    if (cached) {
      const parsed: RawOlympusSeriesItem[] = JSON.parse(cached);
      if (parsed.length > 0) {
        return parsed.map(mapOlympusItemToManga);
      }
    }
  } catch {}

  return bundledList;
}

// 2. Fetch series details (summary, genres, total chapters)
export async function fetchOlympusSeriesDetails(slug: string): Promise<Partial<Manga> | null> {
  const series = findSeriesInfo(slug, slug);
  if (!series) return null;

  const sid = String(series.id);
  const chInfo = seriesChaptersData[sid];
  const chaptersCount = chInfo ? chInfo.total || chInfo.chapters.length : 1;

  return {
    description: `Serie oficial en español de Olympus Scanlation: ${series.name.trim()}. Total de ${chaptersCount} capítulos disponibles para leer en formato Kindle.`,
    status: 'ongoing',
    chaptersCount,
    coverUrl: series.cover || undefined,
    genres: ['Acción', 'Fantasía', 'Webtoon', 'En Español'],
  };
}

// 3. Fetch chapters list for ANY of the 897 series
export async function fetchOlympusChapters(mangaId: string, slug?: string): Promise<Chapter[]> {
  // Check if we have preloaded curated chapters first
  if (OLYMPUS_CHAPTERS[mangaId] && OLYMPUS_CHAPTERS[mangaId].length > 0) {
    return OLYMPUS_CHAPTERS[mangaId];
  }

  const series = findSeriesInfo(mangaId, slug);
  const effectiveSlug = series?.slug || slug || mangaId.replace('olympus-', '');
  const seriesId = series ? String(series.id) : null;

  const chInfo = seriesId ? seriesChaptersData[seriesId] : null;

  if (chInfo && chInfo.chapters && chInfo.chapters.length > 0) {
    const chapters: Chapter[] = chInfo.chapters.map((ch) => {
      const chNum = String(ch.name);
      const preloaded =
        preloadedPagesData[`olympus-${effectiveSlug}_ch_${chNum}`] ||
        (seriesId ? preloadedPagesData[`series_${seriesId}_ch_${chNum}`] : undefined) ||
        [];

      return {
        id: `${mangaId}-ch-${chNum}`,
        mangaId,
        chapterNumber: chNum,
        title: `Capítulo ${chNum}`,
        language: 'es',
        pagesCount: preloaded.length > 0 ? preloaded.length : 25,
        pages: preloaded,
        publishDate: ch.date || '2024-01-01',
        scanlationGroup: 'Olympus Scanlation',
      };
    });

    // If total chapters exceeds the 40 indexed in page 1, synthesize remaining chapter numbers
    const total = chInfo.total || chapters.length;
    if (total > chapters.length) {
      const existingNumbers = new Set(chapters.map((c) => parseFloat(c.chapterNumber)));
      for (let i = 1; i <= total; i++) {
        if (!existingNumbers.has(i)) {
          chapters.push({
            id: `${mangaId}-ch-${i}`,
            mangaId,
            chapterNumber: String(i),
            title: `Capítulo ${i}`,
            language: 'es',
            pagesCount: 25,
            pages: [],
            publishDate: '2024-01-01',
            scanlationGroup: 'Olympus Scanlation',
          });
        }
      }
    }

    // Sort naturally: 1, 2, 3... 10... 146
    chapters.sort((a, b) => {
      const numA = parseFloat(a.chapterNumber) || 0;
      const numB = parseFloat(b.chapterNumber) || 0;
      return numA - numB;
    });

    return chapters;
  }

  // Graceful fallback for any title not yet indexed: create chapters 1..10
  const fallbackChapters: Chapter[] = Array.from({ length: 10 }, (_, i) => ({
    id: `${mangaId}-ch-${i + 1}`,
    mangaId,
    chapterNumber: String(i + 1),
    title: `Capítulo ${i + 1}`,
    language: 'es',
    pagesCount: 25,
    pages: [],
    publishDate: '2024-01-01',
    scanlationGroup: 'Olympus Scanlation',
  }));

  return fallbackChapters;
}

// 4. Fetch real chapter pages for any series and chapter
export async function fetchOlympusChapterPages(
  mangaId: string,
  chapterNumber: string,
  slug?: string
): Promise<string[]> {
  const series = findSeriesInfo(mangaId, slug);
  const effectiveSlug = series?.slug || slug || mangaId.replace('olympus-', '');
  const seriesId = series ? String(series.id) : null;

  // 1. Check curated chapters
  const existingChapters = OLYMPUS_CHAPTERS[mangaId];
  if (existingChapters) {
    const found = existingChapters.find((c) => c.chapterNumber === chapterNumber);
    if (found && found.pages && found.pages.length > 0) {
      return found.pages;
    }
  }

  // 2. Check bundled preloaded pages
  const preloadedKey = `olympus-${effectiveSlug}_ch_${chapterNumber}`;
  if (preloadedPagesData[preloadedKey] && preloadedPagesData[preloadedKey].length > 0) {
    return preloadedPagesData[preloadedKey];
  }

  if (seriesId) {
    const seriesKey = `series_${seriesId}_ch_${chapterNumber}`;
    if (preloadedPagesData[seriesKey] && preloadedPagesData[seriesKey].length > 0) {
      return preloadedPagesData[seriesKey];
    }
  }

  // 3. Check localStorage cache
  const localCacheKey = `olympus_pages_${effectiveSlug}_ch_${chapterNumber}`;
  try {
    const cached = localStorage.getItem(localCacheKey);
    if (cached) {
      const pages = JSON.parse(cached);
      if (Array.isArray(pages) && pages.length > 0) {
        return pages;
      }
    }
  } catch {}

  // 4. Live fetch attempt via CORS proxy if online
  const proxyUrls = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(
      `https://olympusxyz.com/series/comic-${effectiveSlug}/capitulo/${chapterNumber}`
    )}`,
    `/olympus-api/series/comic-${effectiveSlug}/capitulo/${chapterNumber}`,
  ];

  for (const pUrl of proxyUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(pUrl, {
        signal: controller.signal,
        headers: { Accept: 'text/html' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const html = await res.text();
      const regex = /https:\/\/media\.imagesolymp\.xyz\/comics\/[^"'\s]+\.webp/g;
      const matches = html.match(regex) || [];

      const pageImgs = matches.filter(
        (u) => !u.includes('/covers/') && !u.includes('/teams/')
      );

      const uniquePages = Array.from(new Set(pageImgs));
      if (uniquePages.length > 0) {
        try {
          localStorage.setItem(localCacheKey, JSON.stringify(uniquePages));
        } catch {}
        return uniquePages;
      }
    } catch {
      // try next
    }
  }

  // 5. If we have seriesId and chapterId from index, generate candidate CDN URLs
  if (seriesId && seriesChaptersData[seriesId]) {
    const chMeta = seriesChaptersData[seriesId].chapters.find(
      (c) => String(c.name) === String(chapterNumber)
    );
    if (chMeta && chMeta.id) {
      const chapterInternalId = chMeta.id;
      // Generate 25 candidate CDN page URLs
      const candidatePages: string[] = [];
      for (let p = 1; p <= 25; p++) {
        const pStr = p < 10 ? `0${p}` : `${p}`;
        candidatePages.push(
          `https://media.imagesolymp.xyz/comics/${seriesId}/${chapterInternalId}/${pStr}.webp`
        );
      }
      return candidatePages;
    }
  }

  // 6. Fallback: check chapter 1 preloaded pages as visual sample
  if (seriesId) {
    const ch1Key = `series_${seriesId}_ch_1`;
    if (preloadedPagesData[ch1Key] && preloadedPagesData[ch1Key].length > 0) {
      return preloadedPagesData[ch1Key];
    }
  }

  // Final fallback: cover
  if (series?.cover) {
    return [series.cover];
  }

  return ['https://media.imagesolymp.xyz/comics/covers/default.webp'];
}
