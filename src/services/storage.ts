import type { Manga, Chapter, Bookmark, ReaderSettings, KindleSystemSettings } from '../types';
import { DEMO_MANGAS, DEMO_CHAPTERS } from './sampleData';
import { OLYMPUS_MANGAS, OLYMPUS_CHAPTERS } from '../data/olympusMangaData';

const STORAGE_KEYS = {
  LIBRARY: 'kindle_manga_library_v2', // bumped to v2 so Olympus takes immediate priority
  CHAPTERS: 'kindle_manga_chapters_v2',
  BOOKMARKS: 'kindle_manga_bookmarks_v1',
  READER_SETTINGS: 'kindle_manga_reader_settings_v1',
  SYSTEM_SETTINGS: 'kindle_manga_sys_settings_v1',
};

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  readingMode: 'webtoon-vertical',
  theme: 'paperwhite',
  fitMode: 'width',
  brightness: 100,
  warmth: 0,
  contrast: 100,
  eInkFilter: false,
  showPageNumbers: true,
  invertColors: false,
};

export const DEFAULT_SYSTEM_SETTINGS: KindleSystemSettings = {
  airplaneMode: false,
  wifiEnabled: true,
  battery: 96,
  bluetoothEnabled: false,
  deviceSyncTime: 'Sincronizado hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export function loadLibrary(): Manga[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LIBRARY);
    if (!raw) {
      // Prioritize real Olympus series, with demo items appended
      const initial = [...OLYMPUS_MANGAS, ...DEMO_MANGAS];
      localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(initial));
      return initial;
    }
    const stored: Manga[] = JSON.parse(raw);
    
    // Ensure all Olympus mangas are present in the library
    const existingIds = new Set(stored.map((m) => m.id));
    const missingOlympus = OLYMPUS_MANGAS.filter((m) => !existingIds.has(m.id));
    
    if (missingOlympus.length > 0) {
      const merged = [...missingOlympus, ...stored];
      localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(merged));
      return merged;
    }
    
    return stored;
  } catch {
    return [...OLYMPUS_MANGAS, ...DEMO_MANGAS];
  }
}

export function saveLibrary(mangas: Manga[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(mangas));
  } catch (err) {
    console.warn('Error saving library to localStorage', err);
  }
}

export function loadChapters(mangaId: string): Chapter[] {
  try {
    // 1. Check Olympus chapters first
    if (OLYMPUS_CHAPTERS[mangaId] && OLYMPUS_CHAPTERS[mangaId].length > 0) {
      return OLYMPUS_CHAPTERS[mangaId];
    }

    // 2. Check localStorage cache
    const raw = localStorage.getItem(STORAGE_KEYS.CHAPTERS);
    const map: Record<string, Chapter[]> = raw ? JSON.parse(raw) : {};
    if (map[mangaId] && map[mangaId].length > 0) {
      return map[mangaId];
    }

    // 3. Check demo chapters
    if (DEMO_CHAPTERS[mangaId]) {
      return DEMO_CHAPTERS[mangaId];
    }
    return [];
  } catch {
    return OLYMPUS_CHAPTERS[mangaId] || DEMO_CHAPTERS[mangaId] || [];
  }
}

export function saveChapters(mangaId: string, chapters: Chapter[]): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAPTERS);
    const map: Record<string, Chapter[]> = raw ? JSON.parse(raw) : {};
    map[mangaId] = chapters;
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(map));
  } catch (err) {
    console.warn('Error saving chapters to localStorage', err);
  }
}

export function loadBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  } catch (err) {
    console.warn('Error saving bookmarks', err);
  }
}

export function loadReaderSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.READER_SETTINGS);
    return raw ? { ...DEFAULT_READER_SETTINGS, ...JSON.parse(raw) } : DEFAULT_READER_SETTINGS;
  } catch {
    return DEFAULT_READER_SETTINGS;
  }
}

export function saveReaderSettings(settings: ReaderSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.READER_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('Error saving reader settings', err);
  }
}

export function loadSystemSettings(): KindleSystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYSTEM_SETTINGS);
    return raw ? { ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SYSTEM_SETTINGS;
  } catch {
    return DEFAULT_SYSTEM_SETTINGS;
  }
}

export function saveSystemSettings(settings: KindleSystemSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('Error saving system settings', err);
  }
}
