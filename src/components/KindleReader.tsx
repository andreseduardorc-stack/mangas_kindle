import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Bookmark as BookmarkIcon,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Type,
  Sun,
  Flame,
  Layers,
  ArrowRightLeft,
  FileText,
  Loader2,
  Check,
  Play,
  Pause,
  BookOpen,
} from 'lucide-react';
import type { Manga, Chapter, ReaderSettings, Bookmark, ReadingMode, KindleTheme, FitMode } from '../types';
import { fetchChapterPages } from '../services/mangaDexApi';
import { fetchOlympusChapterPages, fetchOlympusChapters } from '../services/olympusService';

interface KindleReaderProps {
  manga: Manga;
  chapter: Chapter;
  initialPage?: number;
  allChapters?: Chapter[];
  onBackToLibrary: () => void;
  onUpdateProgress: (mangaId: string, chapterId: string, page: number, total: number) => void;
  onToggleBookmark: (bookmark: Bookmark) => void;
  bookmarks: Bookmark[];
  readerSettings: ReaderSettings;
  onUpdateReaderSettings: (updated: Partial<ReaderSettings>) => void;
  onSelectChapter: (chapter: Chapter) => void;
}

interface KindlePageImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  draggable?: boolean;
}

const KindlePageImage: React.FC<KindlePageImageProps> = ({
  src,
  alt,
  className,
  style,
  loading = 'lazy',
  draggable = false,
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [attempt, setAttempt] = useState(0);
  const [isBroken, setIsBroken] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setAttempt(0);
    setIsBroken(false);
  }, [src]);

  const handleError = () => {
    // Systematic fallback through Olympus naming patterns:
    // 01.webp -> 1.webp -> 001.webp -> 01_01.webp -> 1_01.webp -> 0.webp -> 0.1.webp
    if (attempt === 0 && /\/0(\d+\.webp)$/.test(currentSrc)) {
      setAttempt(1);
      setCurrentSrc(currentSrc.replace(/\/0(\d+\.webp)$/, '/$1'));
    } else if (attempt <= 1 && /\/(\d+\.webp)$/.test(currentSrc) && !currentSrc.includes('/00')) {
      setAttempt(2);
      setCurrentSrc(currentSrc.replace(/\/(\d+\.webp)$/, '/00$1'));
    } else if (attempt <= 2 && !currentSrc.includes('_')) {
      setAttempt(3);
      setCurrentSrc(currentSrc.replace(/\/(\d+\.webp)$/, '/01_$1'));
    } else if (attempt <= 3 && currentSrc.includes('/01_')) {
      setAttempt(4);
      setCurrentSrc(currentSrc.replace(/\/01_(\d+\.webp)$/, '/1_$1'));
    } else if (attempt <= 4 && (currentSrc.includes('/1.webp') || currentSrc.includes('/01.webp') || currentSrc.includes('/1_01.webp'))) {
      setAttempt(5);
      setCurrentSrc(currentSrc.replace(/\/[^/]+\.webp$/, '/0.webp'));
    } else if (attempt <= 5 && currentSrc.includes('/0.webp')) {
      setAttempt(6);
      setCurrentSrc(currentSrc.replace(/\/0\.webp$/, '/0.1.webp'));
    } else {
      setIsBroken(true);
    }
  };

  if (isBroken) {
    return (
      <div
        onClick={() => {
          setIsBroken(false);
          setAttempt(0);
          setCurrentSrc(src);
        }}
        className="w-full max-w-2xl py-6 px-4 bg-[#f2eee3] border border-dashed border-[#d6cfbd] rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#eae4d5] transition-colors my-1 text-[#55524c]"
      >
        <span className="font-serif font-bold text-xs text-[#1a1918]">Reintentar viñeta {alt}</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      draggable={draggable}
      onError={handleError}
    />
  );
};

export const KindleReader: React.FC<KindleReaderProps> = ({
  manga,
  chapter,
  initialPage = 1,
  allChapters = [],
  onBackToLibrary,
  onUpdateProgress,
  onToggleBookmark,
  bookmarks,
  readerSettings,
  onUpdateReaderSettings,
  onSelectChapter,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pages, setPages] = useState<string[]>(chapter.pages || []);
  const [loadingPages, setLoadingPages] = useState<boolean>(false);
  const [showOverlays, setShowOverlays] = useState<boolean>(false);
  const [showAaMenu, setShowAaMenu] = useState<boolean>(false);
  const [showChapterList, setShowChapterList] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [aaTab, setAaTab] = useState<'mode' | 'theme' | 'fit' | 'light'>('mode');
  const [chaptersList, setChaptersList] = useState<Chapter[]>(allChapters);
  const [autoScroll, setAutoScroll] = useState<boolean>(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState<number>(1.5);

  const containerRef = useRef<HTMLDivElement>(null);
  const verticalContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll loop for Manhwa continuous vertical reading
  useEffect(() => {
    if (!autoScroll || readerSettings.readingMode !== 'webtoon-vertical') return;

    let animId: number;
    const step = () => {
      if (verticalContainerRef.current) {
        verticalContainerRef.current.scrollTop += autoScrollSpeed;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [autoScroll, autoScrollSpeed, readerSettings.readingMode]);

  // Sync chaptersList with allChapters
  useEffect(() => {
    if (manga.source === 'olympus' || manga.id.startsWith('olympus-')) {
      const slug = (manga as any).olympusSlug || manga.id.replace('olympus-', '');
      fetchOlympusChapters(manga.id, slug).then((chs) => {
        if (chs.length > 0) {
          setChaptersList(chs);
        } else if (allChapters && allChapters.length > chaptersList.length) {
          setChaptersList(allChapters);
        }
      });
    } else if (allChapters && allChapters.length > chaptersList.length) {
      setChaptersList(allChapters);
    }
  }, [allChapters, manga.id]);

  // Load pages if chapter has empty pages array
  useEffect(() => {
    setCurrentPage(initialPage || 1);
    if (verticalContainerRef.current) {
      verticalContainerRef.current.scrollTop = 0;
    }

    if (chapter.pages && chapter.pages.length > 0) {
      setPages(chapter.pages);
      setLoadingPages(false);
    } else {
      setLoadingPages(true);
      setPages([]);

      const fetchPromise =
        manga.id.startsWith('olympus-') || manga.source === 'olympus'
          ? fetchOlympusChapterPages(manga.id, chapter.chapterNumber, (manga as any).olympusSlug)
          : fetchChapterPages(chapter.id);

      fetchPromise
        .then((fetchedPages) => {
          if (fetchedPages.length > 0) {
            setPages(fetchedPages);
          } else {
            setPages([]);
          }
        })
        .catch((err) => {
          console.error(err);
          setPages([]);
        })
        .finally(() => setLoadingPages(false));
    }
  }, [chapter.id, chapter.chapterNumber]);

  // Track scroll position in vertical mode to update Kindle location & progress
  useEffect(() => {
    const el = verticalContainerRef.current;
    if (!el || readerSettings.readingMode !== 'webtoon-vertical') return;

    const handleScroll = () => {
      const children = el.querySelectorAll('[data-page-index]');
      const containerMiddle = el.scrollTop + el.clientHeight / 2;

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const top = child.offsetTop;
        const bottom = top + child.offsetHeight;
        if (containerMiddle >= top && containerMiddle <= bottom) {
          const pageIndex = Number(child.getAttribute('data-page-index'));
          if (pageIndex && pageIndex !== currentPage) {
            setCurrentPage(pageIndex);
          }
          break;
        }
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [pages.length, readerSettings.readingMode, currentPage]);

  // Sync progress
  useEffect(() => {
    if (pages.length > 0) {
      onUpdateProgress(manga.id, chapter.id, currentPage, pages.length);
    }
  }, [currentPage, pages.length, chapter.id]);

  // Is current page bookmarked?
  const isCurrentPageBookmarked = bookmarks.some(
    (b) => b.mangaId === manga.id && b.chapterId === chapter.id && b.pageIndex === currentPage
  );

  const handleToggleCurrentBookmark = () => {
    const b: Bookmark = {
      id: `${manga.id}-${chapter.id}-${currentPage}`,
      mangaId: manga.id,
      chapterId: chapter.id,
      chapterNumber: chapter.chapterNumber,
      pageIndex: currentPage,
      timestamp: Date.now(),
      mangaTitle: manga.title,
      previewUrl: pages[currentPage - 1],
    };
    onToggleBookmark(b);
  };

  // Turn page logic
  const goToNextPage = () => {
    if (currentPage < pages.length) {
      setCurrentPage((prev) => prev + 1);
    } else {
      // Prompt next chapter if available
      goToNextChapter();
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else {
      goToPrevChapter();
    }
  };

  const currentChIndex = chaptersList.findIndex(
    (c) => c.id === chapter.id || String(c.chapterNumber) === String(chapter.chapterNumber)
  );
  const hasNextChapter = currentChIndex !== -1 && currentChIndex < chaptersList.length - 1;
  const hasPrevChapter = currentChIndex > 0;

  const goToNextChapter = () => {
    if (hasNextChapter) {
      onSelectChapter(chaptersList[currentChIndex + 1]);
    }
  };

  const goToPrevChapter = () => {
    if (hasPrevChapter) {
      onSelectChapter(chaptersList[currentChIndex - 1]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (readerSettings.readingMode === 'manga-rtl') {
          goToPrevPage();
        } else {
          goToNextPage();
        }
      } else if (e.key === 'ArrowLeft') {
        if (readerSettings.readingMode === 'manga-rtl') {
          goToNextPage();
        } else {
          goToPrevPage();
        }
      } else if (e.key === ' ' || e.key === 'PageDown') {
        goToNextPage();
      } else if (e.key === 'PageUp') {
        goToPrevPage();
      } else if (e.key === 'm' || e.key === 'M') {
        setShowOverlays((prev) => !prev);
      } else if (e.key === 'b' || e.key === 'B') {
        handleToggleCurrentBookmark();
      } else if (e.key === 'Escape') {
        if (showAaMenu || showChapterList) {
          setShowAaMenu(false);
          setShowChapterList(false);
        } else if (showOverlays) {
          setShowOverlays(false);
        } else {
          onBackToLibrary();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentPage,
    pages.length,
    readerSettings.readingMode,
    showOverlays,
    showAaMenu,
    showChapterList,
    currentChIndex,
  ]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Theme classes & inline filters
  const getThemeClass = () => {
    switch (readerSettings.theme) {
      case 'sepia':
        return 'theme-sepia';
      case 'eink':
        return 'theme-eink-contrast';
      case 'dark':
        return 'theme-dark';
      default:
        return 'theme-paperwhite';
    }
  };

  const calculateStyle = () => {
    const brightnessVal = readerSettings.brightness / 100;
    const contrastVal = readerSettings.contrast / 100;
    const sepiaVal = readerSettings.warmth / 100;

    return {
      filter: `brightness(${brightnessVal}) contrast(${contrastVal}) sepia(${sepiaVal}) ${
        readerSettings.eInkFilter ? 'grayscale(100%)' : ''
      }`,
    };
  };

  // Get image width/height styling based on fitMode
  const getImageFitClass = () => {
    switch (readerSettings.fitMode) {
      case 'width':
        return 'w-full max-w-4xl h-auto object-contain';
      case 'height':
        return 'h-[92vh] w-auto max-w-full object-contain';
      case 'fit-both':
        return 'max-h-[92vh] max-w-[95vw] object-contain';
      default:
        return 'max-w-4xl object-contain';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col justify-between overflow-hidden select-none font-serif transition-colors duration-200 ${getThemeClass()}`}
      style={calculateStyle()}
    >
      {/* Bookmark Ribbon on top right (Kindle signature element) */}
      <div
        onClick={handleToggleCurrentBookmark}
        title={isCurrentPageBookmarked ? 'Página marcada' : 'Marcar esta página'}
        className={`absolute top-0 right-6 sm:right-10 z-40 cursor-pointer transition-all duration-200 ${
          isCurrentPageBookmarked ? 'h-9 opacity-100' : 'h-6 opacity-30 hover:opacity-80'
        }`}
      >
        <div
          className={`w-7 h-8 flex items-center justify-center shadow-md ${
            isCurrentPageBookmarked ? 'bg-[#1a1918] text-white' : 'bg-[#ded8c7] text-[#1a1918]'
          }`}
          style={{
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 75%, 0% 100%)',
          }}
        >
          <BookmarkIcon className="w-3.5 h-3.5 fill-current mb-1" />
        </div>
      </div>

      {/* TOP KINDLE READER OVERLAY */}
      <div
        className={`absolute top-0 inset-x-0 z-40 transition-transform duration-300 ease-in-out ${
          showOverlays ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="bg-[#f5f2e9]/95 backdrop-blur-md border-b border-[#d6cfbd] px-4 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2.5 flex items-center justify-between text-[#1a1918] shadow-md">
          {/* Back button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToLibrary}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:bg-[#e4decb] text-xs font-sans font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Biblioteca</span>
            </button>
            <div className="h-4 w-px bg-[#d6cfbd]" />
            <div className="truncate max-w-xs sm:max-w-md">
              <h2 className="font-serif font-bold text-sm truncate">{manga.title}</h2>
              <p className="text-[11px] font-sans text-[#635f56] truncate">{chapter.title}</p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-1.5">
            {/* Chapter list selector */}
            <button
              onClick={() => {
                setShowChapterList((prev) => !prev);
                setShowAaMenu(false);
              }}
              className="p-2 rounded-full hover:bg-[#e4decb] transition-colors relative"
              title="Lista de capítulos"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Bookmark button */}
            <button
              onClick={handleToggleCurrentBookmark}
              className={`p-2 rounded-full transition-colors ${
                isCurrentPageBookmarked ? 'text-[#1a1918] bg-[#e4decb]' : 'hover:bg-[#e4decb]'
              }`}
              title="Añadir marcador"
            >
              <BookmarkIcon
                className={`w-4 h-4 ${isCurrentPageBookmarked ? 'fill-current' : ''}`}
              />
            </button>

            {/* Kindle "Aa" Settings */}
            <button
              onClick={() => {
                setShowAaMenu((prev) => !prev);
                setShowChapterList(false);
              }}
              className={`px-2.5 py-1 rounded-lg border font-serif font-black text-sm flex items-center space-x-1 transition-colors ${
                showAaMenu
                  ? 'bg-[#1a1918] text-white border-[#1a1918]'
                  : 'bg-[#ede8dc] text-[#1a1918] border-[#d6cfbd] hover:bg-[#e4decb]'
              }`}
              title="Ajustes de visualización y lectura (Aa)"
            >
              <Type className="w-4 h-4" />
              <span className="font-sans text-xs">Aa</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-[#e4decb] transition-colors"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* KINDLE "Aa" MENU DRAWER */}
      {showAaMenu && (
        <div className="absolute top-14 right-4 sm:right-8 z-50 w-80 sm:w-96 bg-[#f7f5ed] border-2 border-[#d6cfbd] rounded-2xl shadow-2xl p-4 text-[#1a1918] font-sans text-xs">
          {/* Navigation tabs inside Aa */}
          <div className="flex border-b border-[#ded8c7] pb-2 mb-3">
            {[
              { id: 'mode', label: 'Modo', icon: ArrowRightLeft },
              { id: 'theme', label: 'Tema', icon: Sun },
              { id: 'fit', label: 'Ajuste', icon: FileText },
              { id: 'light', label: 'Filtros', icon: Flame },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAaTab(tab.id as any)}
                  className={`flex-1 py-1 flex items-center justify-center space-x-1 rounded-lg font-medium transition-colors ${
                    aaTab === tab.id
                      ? 'bg-[#2c2b29] text-white'
                      : 'text-[#635f56] hover:bg-[#eee9db]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: READING MODE */}
          {aaTab === 'mode' && (
            <div className="space-y-2">
              <span className="text-[11px] text-[#7a766c] block font-semibold mb-1">
                Dirección de lectura:
              </span>
              {[
                {
                  id: 'manga-rtl' as ReadingMode,
                  title: 'Manga Japonés (RTL)',
                  desc: 'De Derecha a Izquierda, paso de página tradicional',
                },
                {
                  id: 'webtoon-vertical' as ReadingMode,
                  title: 'Manhwa / Webtoon Continuo',
                  desc: 'Desplazamiento vertical fluido en cascada',
                },
                {
                  id: 'comic-ltr' as ReadingMode,
                  title: 'Cómic Occidental (LTR)',
                  desc: 'De Izquierda a Derecha',
                },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onUpdateReaderSettings({ readingMode: m.id })}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                    readerSettings.readingMode === m.id
                      ? 'bg-[#2c2b29] text-white border-[#2c2b29]'
                      : 'bg-[#ede8dc] border-[#d6cfbd] hover:bg-[#e4decb] text-[#2c2b29]'
                  }`}
                >
                  <div>
                    <p className="font-bold">{m.title}</p>
                    <p className="text-[10px] opacity-80">{m.desc}</p>
                  </div>
                  {readerSettings.readingMode === m.id && <Check className="w-4 h-4 shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* TAB 2: THEME */}
          {aaTab === 'theme' && (
            <div className="space-y-3">
              <span className="text-[11px] text-[#7a766c] block font-semibold">
                Esquema de color y papel Kindle:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'paperwhite' as KindleTheme,
                    label: 'Paperwhite',
                    sub: 'Clásico neutro',
                    bg: '#f7f6f2',
                    text: '#121212',
                  },
                  {
                    id: 'sepia' as KindleTheme,
                    label: 'Sepia Ámbar',
                    sub: 'Luz cálida de lectura',
                    bg: '#f4ecd8',
                    text: '#382c1e',
                  },
                  {
                    id: 'eink' as KindleTheme,
                    label: 'E-Ink Puro',
                    sub: 'Alto contraste B/N',
                    bg: '#ffffff',
                    text: '#000000',
                  },
                  {
                    id: 'dark' as KindleTheme,
                    label: 'Noche Invertido',
                    sub: 'Fondo negro suave',
                    bg: '#18181b',
                    text: '#e4e4e7',
                  },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => onUpdateReaderSettings({ theme: th.id })}
                    style={{ backgroundColor: th.bg, color: th.text }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between shadow-xs transition-transform ${
                      readerSettings.theme === th.id
                        ? 'ring-2 ring-[#2c2b29] scale-[1.02]'
                        : 'border-[#cfc8b5] hover:opacity-90'
                    }`}
                  >
                    <span className="font-bold text-xs">{th.label}</span>
                    <span className="text-[10px] opacity-75">{th.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: IMAGE FIT */}
          {aaTab === 'fit' && (
            <div className="space-y-2">
              <span className="text-[11px] text-[#7a766c] block font-semibold mb-1">
                Ajuste de dimensiones de viñeta:
              </span>
              {[
                { id: 'width' as FitMode, label: 'Ajustar al Ancho', desc: 'Ideal para manhwas en pantallas verticales' },
                { id: 'height' as FitMode, label: 'Ajustar a la Altura', desc: 'Ver página completa sin scroll' },
                { id: 'fit-both' as FitMode, label: 'Ajustar a la Pantalla', desc: 'Encajar en ventana completa' },
                { id: 'original' as FitMode, label: 'Tamaño Original (100%)', desc: 'Resolución nativa' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => onUpdateReaderSettings({ fitMode: f.id })}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                    readerSettings.fitMode === f.id
                      ? 'bg-[#2c2b29] text-white border-[#2c2b29]'
                      : 'bg-[#ede8dc] border-[#d6cfbd] hover:bg-[#e4decb] text-[#2c2b29]'
                  }`}
                >
                  <div>
                    <p className="font-bold">{f.label}</p>
                    <p className="text-[10px] opacity-80">{f.desc}</p>
                  </div>
                  {readerSettings.fitMode === f.id && <Check className="w-4 h-4 shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* TAB 4: LIGHTING & FILTERS */}
          {aaTab === 'light' && (
            <div className="space-y-3.5">
              {/* Brightness */}
              <div>
                <div className="flex justify-between text-[11px] text-[#4a4740] font-medium mb-1">
                  <span>Brillo</span>
                  <span>{readerSettings.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="120"
                  value={readerSettings.brightness}
                  onChange={(e) => onUpdateReaderSettings({ brightness: Number(e.target.value) })}
                  className="w-full h-1.5 bg-[#dcd7cb] rounded-lg appearance-none cursor-pointer accent-[#2c2b29]"
                />
              </div>

              {/* Warmth */}
              <div>
                <div className="flex justify-between text-[11px] text-[#4a4740] font-medium mb-1">
                  <span>Luz Cálida (Tinte Sepia)</span>
                  <span>{readerSettings.warmth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={readerSettings.warmth}
                  onChange={(e) => onUpdateReaderSettings({ warmth: Number(e.target.value) })}
                  className="w-full h-1.5 bg-[#dcd7cb] rounded-lg appearance-none cursor-pointer accent-[#c26217]"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between text-[11px] text-[#4a4740] font-medium mb-1">
                  <span>Contraste de Tinta</span>
                  <span>{readerSettings.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="150"
                  value={readerSettings.contrast}
                  onChange={(e) => onUpdateReaderSettings({ contrast: Number(e.target.value) })}
                  className="w-full h-1.5 bg-[#dcd7cb] rounded-lg appearance-none cursor-pointer accent-[#2c2b29]"
                />
              </div>

              {/* E-ink grayscale checkbox */}
              <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readerSettings.eInkFilter}
                  onChange={(e) => onUpdateReaderSettings({ eInkFilter: e.target.checked })}
                  className="rounded text-[#2c2b29] focus:ring-0"
                />
                <span className="text-xs text-[#2c2b29]">Forzar Escala de Grises Monocromática</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* CHAPTER LIST POPOVER */}
      {showChapterList && (
        <div className="absolute top-14 right-16 z-50 w-72 max-h-80 bg-[#f7f5ed] border-2 border-[#d6cfbd] rounded-2xl shadow-2xl p-3 text-[#1a1918] font-sans text-xs flex flex-col">
          <h4 className="font-serif font-bold text-sm mb-2 px-1">
            Seleccionar Capítulo ({chaptersList.length})
          </h4>
          <div className="overflow-y-auto space-y-1 flex-1">
            {chaptersList.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  onSelectChapter(ch);
                  setShowChapterList(false);
                }}
                className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                  ch.id === chapter.id
                    ? 'bg-[#2c2b29] text-white font-bold'
                    : 'hover:bg-[#e4decb] text-[#2c2b29]'
                }`}
              >
                <span className="truncate">{ch.title}</span>
                <span className="text-[10px] opacity-75 shrink-0 ml-1">ES</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MAIN READING CANVAS */}
      <main
        className="flex-1 w-full h-full relative flex items-center justify-center overflow-auto"
        onClick={(e) => {
          // If clicked in center 30%, toggle overlays. If clicked on sides, flip page!
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;

          if (readerSettings.readingMode === 'webtoon-vertical') {
            setShowOverlays((prev) => !prev);
            return;
          }

          if (clickX > width * 0.35 && clickX < width * 0.65) {
            setShowOverlays((prev) => !prev);
          } else if (clickX <= width * 0.35) {
            // Left click
            if (readerSettings.readingMode === 'manga-rtl') {
              goToNextPage();
            } else {
              goToPrevPage();
            }
          } else {
            // Right click
            if (readerSettings.readingMode === 'manga-rtl') {
              goToPrevPage();
            } else {
              goToNextPage();
            }
          }
        }}
      >
        {loadingPages ? (
          <div className="flex flex-col items-center justify-center space-y-3 font-sans text-[#55524c]">
            <Loader2 className="w-10 h-10 animate-spin text-[#1a1918]" />
            <p className="text-sm font-medium">Cargando páginas del capítulo...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4 font-serif">
            <div className="w-16 h-16 rounded-full bg-[#ede8dc] border border-[#d6cfbd] flex items-center justify-center text-[#2c2b29]">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1918]">
              {chapter.title}
            </h3>
            <p className="text-xs font-sans text-[#635f56] leading-relaxed">
              Las imágenes de este capítulo no se encuentran disponibles temporalmente en el servidor de Olympus.
            </p>
            <div className="flex items-center space-x-3 pt-2 font-sans text-xs">
              {hasPrevChapter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevChapter();
                  }}
                  className="px-4 py-2 bg-[#ded8c7] rounded-xl font-bold text-[#2c2b29] hover:bg-[#d6cfbd]"
                >
                  ← Cap. Anterior
                </button>
              )}
              {hasNextChapter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextChapter();
                  }}
                  className="px-4 py-2 bg-[#2c2b29] rounded-xl font-bold text-white hover:bg-[#1a1918]"
                >
                  Cap. Siguiente →
                </button>
              )}
            </div>
          </div>
        ) : readerSettings.readingMode === 'webtoon-vertical' ? (
          /* VERTICAL CONTINUOUS SCROLL MODE (Manhwa / Webtoon) */
          <div
            ref={verticalContainerRef}
            className="w-full h-full overflow-y-auto flex flex-col items-center py-6 px-2 space-y-1"
          >
            {pages.map((pageUrl, idx) => (
              <div
                key={`${chapter.id}-${pageUrl}-${idx}`}
                data-page-index={idx + 1}
                className="relative w-full max-w-2xl flex flex-col items-center"
              >
                <KindlePageImage
                  src={pageUrl}
                  alt={`Página ${idx + 1}`}
                  className="w-full h-auto object-contain shadow-sm"
                  loading={idx < 3 ? 'eager' : 'lazy'}
                />
                <span className="text-[10px] font-sans text-[#8c8577] mt-1 mb-2">
                  Página {idx + 1} de {pages.length}
                </span>
              </div>
            ))}
            {/* End of chapter banner */}
            <div className="py-12 text-center font-sans space-y-3">
              <p className="text-sm font-serif font-bold text-[#1a1918]">
                Fin del {chapter.title}
              </p>
              {hasNextChapter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextChapter();
                  }}
                  className="bg-[#2c2b29] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#1a1918]"
                >
                  Continuar al siguiente capítulo
                </button>
              )}
            </div>
          </div>
        ) : (
          /* SINGLE PAGE MODE (Manga RTL or Comic LTR) */
          <div className="relative flex flex-col items-center justify-center p-2 max-h-full max-w-full">
            {pages[currentPage - 1] ? (
              <KindlePageImage
                key={`${chapter.id}-${currentPage}-${pages[currentPage - 1]}`}
                src={pages[currentPage - 1]}
                alt={`Página ${currentPage}`}
                className={`${getImageFitClass()} shadow-md transition-all select-none`}
                draggable={false}
              />
            ) : (
              <div className="w-80 h-96 bg-[#ded8c7] flex items-center justify-center rounded-xl font-sans text-xs">
                Cargando página...
              </div>
            )}

            {/* Click visual hint arrows on hover */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 hover:bg-black/20 text-[#1a1918] opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              <ChevronLeft className="w-6 h-6" />
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 hover:bg-black/20 text-[#1a1918] opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              <ChevronRight className="w-6 h-6" />
            </div>
          </div>
        )}
      </main>

      {/* Floating Auto-Scroll Controls for Manhwa Webtoon */}
      {readerSettings.readingMode === 'webtoon-vertical' && (
        <div
          className={`fixed bottom-16 right-5 z-40 transition-all duration-300 ${
            showOverlays ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-80 hover:opacity-100'
          }`}
        >
          <div className="bg-[#f5f2e9]/95 backdrop-blur-md border border-[#d6cfbd] rounded-full p-1.5 flex items-center space-x-1.5 shadow-xl text-xs font-sans text-[#1a1918]">
            <button
              onClick={() => setAutoScroll((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full font-bold flex items-center space-x-1.5 transition-all ${
                autoScroll
                  ? 'bg-[#1a1918] text-white shadow-xs'
                  : 'bg-[#ded8c7] text-[#2c2b29] hover:bg-[#d6cfbd]'
              }`}
            >
              {autoScroll ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{autoScroll ? 'Pausar' : 'Auto Scroll'}</span>
            </button>

            {autoScroll && (
              <div className="flex items-center space-x-1 pr-1.5">
                {[1, 2, 3].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setAutoScrollSpeed(spd * 1.2)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                      Math.round(autoScrollSpeed / 1.2) === spd
                        ? 'bg-[#2c2b29] text-white'
                        : 'text-[#635f56] hover:bg-[#ded8c7]'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM KINDLE READER OVERLAY */}
      <div
        className={`absolute bottom-0 inset-x-0 z-40 transition-transform duration-300 ease-in-out ${
          showOverlays ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-[#f5f2e9]/95 backdrop-blur-md border-t border-[#d6cfbd] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col space-y-2 text-[#1a1918] shadow-lg">
          {/* Kindle Progress scrubber */}
          <div className="flex items-center space-x-3 max-w-3xl mx-auto w-full">
            <button
              onClick={goToPrevChapter}
              disabled={!hasPrevChapter}
              className="text-xs font-sans font-medium px-2 py-1 rounded hover:bg-[#e4decb] disabled:opacity-30 disabled:hover:bg-transparent"
              title="Capítulo anterior"
            >
              Cap. Anterior
            </button>

            <div className="flex-1 flex items-center space-x-2">
              <span className="text-[11px] font-sans text-[#635f56] min-w-[20px] text-right">
                {currentPage}
              </span>
              <input
                type="range"
                min="1"
                max={Math.max(1, pages.length)}
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="w-full h-1.5 bg-[#dcd7cb] rounded-lg appearance-none cursor-pointer accent-[#2c2b29]"
              />
              <span className="text-[11px] font-sans text-[#635f56] min-w-[20px]">
                {pages.length}
              </span>
            </div>

            <button
              onClick={goToNextChapter}
              disabled={!hasNextChapter}
              className="text-xs font-sans font-medium px-2 py-1 rounded hover:bg-[#e4decb] disabled:opacity-30 disabled:hover:bg-transparent"
              title="Siguiente capítulo"
            >
              Cap. Siguiente
            </button>
          </div>

          {/* Kindle status subtitle */}
          <div className="flex items-center justify-between text-[11px] font-sans text-[#635f56] max-w-3xl mx-auto w-full px-1">
            <span>
              Loc {currentPage} de {pages.length} • {Math.round((currentPage / (pages.length || 1)) * 100)}% leído
            </span>
            <span className="italic">
              {readerSettings.readingMode === 'manga-rtl'
                ? 'Manga RTL (<- Avance | Retroceso ->)'
                : readerSettings.readingMode === 'webtoon-vertical'
                ? 'Modo Webtoon Continuo'
                : 'Cómic LTR'}
            </span>
            <span>
              Estimado: ~{Math.max(1, Math.round((pages.length - currentPage) * 0.8))} min para terminar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
