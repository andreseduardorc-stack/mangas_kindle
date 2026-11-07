export type ReadingMode = 'manga-rtl' | 'comic-ltr' | 'webtoon-vertical';
export type KindleTheme = 'paperwhite' | 'sepia' | 'eink' | 'dark';
export type FitMode = 'width' | 'height' | 'fit-both' | 'original';

export interface Chapter {
  id: string;
  mangaId: string;
  chapterNumber: string;
  title: string;
  language: string; // 'es', 'es-la'
  pagesCount: number;
  pages: string[]; // URLs or base64
  publishDate?: string;
  scanlationGroup?: string;
}

export interface Manga {
  id: string;
  title: string;
  altTitle?: string;
  author: string;
  artist?: string;
  coverUrl: string;
  description: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  type: 'manga' | 'manhwa' | 'manhua';
  genres: string[];
  chaptersCount: number;
  isLocal?: boolean;
  source: 'mangadex' | 'local' | 'demo' | 'olympus';
  olympusSlug?: string;
  defaultReadingMode: ReadingMode;
  inLibrary: boolean;
  addedAt: number;
  lastReadAt?: number;
  currentChapterId?: string;
  currentPage?: number;
  totalPagesInCurrentChapter?: number;
  progressPercent?: number; // 0 - 100
  downloaded?: boolean;
}

export interface Bookmark {
  id: string;
  mangaId: string;
  chapterId: string;
  chapterNumber: string;
  pageIndex: number;
  timestamp: number;
  mangaTitle: string;
  previewUrl?: string;
}

export interface ReaderSettings {
  readingMode: ReadingMode;
  theme: KindleTheme;
  fitMode: FitMode;
  brightness: number; // 20 - 100
  warmth: number; // 0 - 100
  contrast: number; // 80 - 150
  eInkFilter: boolean;
  showPageNumbers: boolean;
  invertColors: boolean;
}

export interface KindleSystemSettings {
  airplaneMode: boolean;
  wifiEnabled: boolean;
  battery: number;
  bluetoothEnabled: boolean;
  deviceSyncTime: string;
}

