import { OLYMPUS_CHAPTERS } from '../data/olympusMangaData';
import allSeriesData from '../data/olympusAllSeries.json';
import type { Manga, Chapter } from '../types';

const OLYMPUS_CACHE_KEY = 'kindle_olympus_full_catalog_v1';

export interface RawOlympusSeriesItem {
  id: number;
  name: string;
  slug: string;
  cover: string;
  type: string;
}

// Transform raw Olympus series item into our Manga type
export function mapOlympusItemToManga(item: RawOlympusSeriesItem): Manga {
  const isManhwa = item.type === 'comic';
  return {
    id: `olympus-${item.slug}`,
    title: item.name,
    altTitle: 'Olympus Scanlation',
    author: 'Olympus Scans',
    artist: 'Olympus',
    coverUrl: item.cover || 'https://media.imagesolymp.xyz/comics/covers/default.webp',
    description: `Serie oficial en español de Olympus Scanlation: ${item.name}.`,
    status: 'ongoing',
    type: isManhwa ? 'manhwa' : 'manga',
    genres: ['Olympus', isManhwa ? 'Manhwa Webtoon' : 'Manga', 'En Español'],
    chaptersCount: 0,
    source: 'olympus',
    defaultReadingMode: 'webtoon-vertical',
    inLibrary: false,
    addedAt: Date.now(),
    olympusSlug: item.slug,
  };
}

// 1. Fetch full live catalog of 897+ titles from Olympus (with local fallback)
export async function getFullOlympusCatalog(): Promise<Manga[]> {
  try {
    // Attempt live fetch from Olympus backend through proxy
    const res = await fetch('/olympus-api/api/series/list', {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const json = await res.json();
      const list: RawOlympusSeriesItem[] = json.data || [];
      if (list.length > 0) {
        localStorage.setItem(OLYMPUS_CACHE_KEY, JSON.stringify(list));
        return list.map(mapOlympusItemToManga);
      }
    }
  } catch (err) {
    console.warn('No se pudo actualizar catálogo en vivo de Olympus, usando datos cacheados:', err);
  }

  // Fallback 1: LocalStorage cache
  try {
    const cached = localStorage.getItem(OLYMPUS_CACHE_KEY);
    if (cached) {
      const list: RawOlympusSeriesItem[] = JSON.parse(cached);
      if (list.length > 0) {
        return list.map(mapOlympusItemToManga);
      }
    }
  } catch {}

  // Fallback 2: Bundled 897 titles snapshot
  const bundledList: RawOlympusSeriesItem[] = allSeriesData as RawOlympusSeriesItem[];
  return bundledList.map(mapOlympusItemToManga);
}

// 2. Fetch series details (summary, genres, total chapters) in real-time
export async function fetchOlympusSeriesDetails(slug: string): Promise<Partial<Manga> | null> {
  try {
    const res = await fetch(`/olympus-api/api/series/${slug}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return null;

    const json = await res.json();
    const data = json.data;
    if (!data) return null;

    const genres: string[] = (data.genres || []).map((g: any) => g.name?.trim()).filter(Boolean);

    return {
      description: data.summary || `Serie oficial de Olympus: ${data.name}`,
      status: data.status?.name === 'Finalizado' ? 'completed' : 'ongoing',
      chaptersCount: data.chapter_count || 1,
      coverUrl: data.cover || undefined,
      genres: genres.length > 0 ? genres : ['Acción', 'Fantasía', 'Webtoon'],
    };
  } catch (err) {
    console.warn(`Error al obtener detalles para ${slug}:`, err);
    return null;
  }
}

// 3. Fetch chapters list in real-time for any series
export async function fetchOlympusChapters(mangaId: string, slug: string): Promise<Chapter[]> {
  // Check if we have preloaded chapters for top titles
  if (OLYMPUS_CHAPTERS[mangaId] && OLYMPUS_CHAPTERS[mangaId].length > 0) {
    return OLYMPUS_CHAPTERS[mangaId];
  }

  try {
    const res = await fetch(`/olympus-api/api/series/${slug}/chapters`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const json = await res.json();
    const rawChapters: any[] = json.data || [];

    const chapters: Chapter[] = rawChapters.map((ch) => ({
      id: `${mangaId}-ch-${ch.name}`,
      mangaId,
      chapterNumber: String(ch.name),
      title: `Capítulo ${ch.name}`,
      language: 'es',
      pagesCount: 25,
      pages: [],
      publishDate: ch.published_at ? ch.published_at.split('T')[0] : '2024-01-01',
      scanlationGroup: 'Olympus Scanlation',
    }));

    // Natural sort: 1, 2, 3, 10...
    chapters.sort((a, b) => {
      const numA = parseFloat(a.chapterNumber) || 0;
      const numB = parseFloat(b.chapterNumber) || 0;
      return numA - numB;
    });

    return chapters;
  } catch (err) {
    console.warn(`Error al cargar lista de capítulos de Olympus para ${slug}:`, err);
    return [];
  }
}

// 4. Fetch real chapter pages for any series and chapter
export async function fetchOlympusChapterPages(
  mangaId: string,
  chapterNumber: string,
  slug?: string
): Promise<string[]> {
  // Check pre-loaded chapters first
  const existingChapters = OLYMPUS_CHAPTERS[mangaId];
  if (existingChapters) {
    const found = existingChapters.find((c) => c.chapterNumber === chapterNumber);
    if (found && found.pages && found.pages.length > 0) {
      return found.pages;
    }
  }

  if (!slug) {
    slug = mangaId.replace('olympus-', '');
  }

  // Fetch real chapter HTML and extract image links
  const urlsToTry = [
    `/olympus-api/series/comic-${slug}/capitulo/${chapterNumber}`,
    `https://corsproxy.io/?url=https://olympusxyz.com/series/comic-${slug}/capitulo/${chapterNumber}`,
  ];

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, { headers: { Accept: 'text/html' } });
      if (!res.ok) continue;

      const html = await res.text();
      const regex = /https:\/\/media\.imagesolymp\.xyz\/comics\/[^"'\s]+\.webp/g;
      const matches = html.match(regex) || [];

      // Filter out covers and icons
      const pageImgs = matches.filter(
        (u) => !u.includes('/covers/') && !u.includes('/teams/')
      );

      // Deduplicate preserving order
      const uniquePages = Array.from(new Set(pageImgs));
      if (uniquePages.length > 0) {
        return uniquePages;
      }
    } catch {
      // try next
    }
  }

  // Fallback to chapter 1 or 2 if available
  if (existingChapters) {
    const fallbackCh = existingChapters.find((c) => c.pages && c.pages.length > 0);
    if (fallbackCh && fallbackCh.pages) {
      return fallbackCh.pages;
    }
  }

  return [];
}
