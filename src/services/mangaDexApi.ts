import type { Manga, Chapter, ReadingMode } from '../types';

const BASE_URL = 'https://api.mangadex.org';
const COVER_BASE = 'https://uploads.mangadex.org/covers';

export interface MangaDexMangaItem {
  id: string;
  attributes: {
    title: Record<string, string>;
    altTitles?: Array<Record<string, string>>;
    description: Record<string, string>;
    originalLanguage: string;
    status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
    tags: Array<{
      attributes: {
        name: Record<string, string>;
      };
    }>;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: {
      fileName?: string;
      name?: string;
    };
  }>;
}

export async function searchMangaDex(
  query: string,
  typeFilter: 'all' | 'manga' | 'manhwa' = 'all'
): Promise<Manga[]> {
  try {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.append('title', query.trim());
    }
    params.append('limit', '20');
    params.append('availableTranslatedLanguage[]', 'es');
    params.append('availableTranslatedLanguage[]', 'es-la');
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('order[relevance]', 'desc');
    params.append('order[followedCount]', 'desc');

    if (typeFilter === 'manhwa') {
      params.append('originalLanguage[]', 'ko');
    } else if (typeFilter === 'manga') {
      params.append('originalLanguage[]', 'ja');
    }

    const res = await fetch(`${BASE_URL}/manga?${params.toString()}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      console.warn('MangaDex API status:', res.status);
      return [];
    }

    const data = await res.json();
    if (!data || !data.data) return [];

    return data.data.map((item: MangaDexMangaItem) => {
      const title =
        item.attributes.title.es ||
        item.attributes.title['es-la'] ||
        item.attributes.title.en ||
        Object.values(item.attributes.title)[0] ||
        'Sin título';

      const desc =
        item.attributes.description.es ||
        item.attributes.description['es-la'] ||
        item.attributes.description.en ||
        Object.values(item.attributes.description)[0] ||
        'Sin descripción disponible.';

      const coverRel = item.relationships.find((r) => r.type === 'cover_art');
      const authorRel = item.relationships.find((r) => r.type === 'author');

      const coverFileName = coverRel?.attributes?.fileName;
      const coverUrl = coverFileName
        ? `${COVER_BASE}/${item.id}/${coverFileName}.256.jpg`
        : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80';

      const origLang = item.attributes.originalLanguage;
      const isManhwa = origLang === 'ko';
      const isManhua = origLang === 'zh';
      const type: 'manga' | 'manhwa' | 'manhua' = isManhwa ? 'manhwa' : isManhua ? 'manhua' : 'manga';

      const defaultReadingMode: ReadingMode = isManhwa ? 'webtoon-vertical' : 'manga-rtl';

      const genres = item.attributes.tags
        .slice(0, 5)
        .map((t) => t.attributes.name.es || t.attributes.name.en || 'Manga');

      return {
        id: item.id,
        title,
        author: authorRel?.attributes?.name || 'Autor Desconocido',
        coverUrl,
        description: desc,
        status: (item.attributes.status as any) || 'ongoing',
        type,
        genres,
        chaptersCount: 0,
        source: 'mangadex',
        defaultReadingMode,
        inLibrary: false,
        addedAt: Date.now(),
        downloaded: false,
      } as Manga;
    });
  } catch (error) {
    console.error('Error fetching MangaDex:', error);
    return [];
  }
}

export async function fetchMangaDexChapters(mangaId: string): Promise<Chapter[]> {
  try {
    const params = new URLSearchParams();
    params.append('translatedLanguage[]', 'es');
    params.append('translatedLanguage[]', 'es-la');
    params.append('order[chapter]', 'asc');
    params.append('limit', '100');
    params.append('includes[]', 'scanlation_group');

    const res = await fetch(`${BASE_URL}/manga/${mangaId}/feed?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data || !data.data) return [];

    return data.data.map((item: any) => {
      const scanRel = item.relationships?.find((r: any) => r.type === 'scanlation_group');
      const scanName = scanRel?.attributes?.name || 'Fansub en Español';
      const chNum = item.attributes.chapter || '1';
      const chTitle = item.attributes.title
        ? `Cap. ${chNum}: ${item.attributes.title}`
        : `Capítulo ${chNum}`;

      return {
        id: item.id,
        mangaId,
        chapterNumber: chNum,
        title: chTitle,
        language: item.attributes.translatedLanguage || 'es',
        pagesCount: item.attributes.pages || 0,
        pages: [], // fetched when opened
        publishDate: item.attributes.publishAt?.split('T')[0],
        scanlationGroup: scanName,
      };
    });
  } catch (err) {
    console.error('Error fetching chapters:', err);
    return [];
  }
}

export async function fetchChapterPages(chapterId: string): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}/at-home/server/${chapterId}`);
    if (!res.ok) throw new Error('No se pudo obtener el servidor de páginas');

    const data = await res.json();
    const baseUrl = data.baseUrl;
    const hash = data.chapter.hash;
    // Prefer dataSaver to save bandwidth and load super quickly like Kindle
    const fileNames: string[] = data.chapter.dataSaver || data.chapter.data;

    return fileNames.map((fn: string) => `${baseUrl}/data-saver/${hash}/${fn}`);
  } catch (err) {
    console.error('Error fetching chapter pages:', err);
    return [];
  }
}
