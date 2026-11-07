import React, { useState, useEffect } from 'react';
import type { Manga, Chapter, Bookmark, ReaderSettings, KindleSystemSettings } from './types';
import {
  loadLibrary,
  saveLibrary,
  loadBookmarks,
  saveBookmarks,
  loadReaderSettings,
  saveReaderSettings,
  loadSystemSettings,
  saveSystemSettings,
  loadChapters,
} from './services/storage';
import { KindleStatusBar } from './components/KindleStatusBar';
import { KindleTopBar } from './components/KindleTopBar';
import { KindleBottomNav } from './components/KindleBottomNav';
import type { TabType } from './components/KindleBottomNav';
import { KindleQuickSettingsDrawer } from './components/KindleQuickSettingsDrawer';
import { HomeView } from './components/HomeView';
import { LibraryView } from './components/LibraryView';
import { DiscoverView } from './components/DiscoverView';
import { ImportView } from './components/ImportView';
import { MangaDetailModal } from './components/MangaDetailModal';
import { KindleReader } from './components/KindleReader';
import { BookmarksModal } from './components/BookmarksModal';
import { Smartphone, Monitor } from 'lucide-react';

export const App: React.FC = () => {
  const [library, setLibrary] = useState<Manga[]>(() => loadLibrary());
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => loadBookmarks());
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => loadReaderSettings());
  const [systemSettings, setSystemSettings] = useState<KindleSystemSettings>(() => loadSystemSettings());

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [activeReader, setActiveReader] = useState<{
    manga: Manga;
    chapter: Chapter;
    page: number;
  } | null>(null);

  // Kindle Frame Bezel simulation toggle (Kindle Paperwhite frame)
  const [showKindleBezel, setShowKindleBezel] = useState<boolean>(false);

  // Persist library
  useEffect(() => {
    saveLibrary(library);
  }, [library]);

  // Persist bookmarks
  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  // Persist reader settings
  useEffect(() => {
    saveReaderSettings(readerSettings);
  }, [readerSettings]);

  // Persist system settings
  useEffect(() => {
    saveSystemSettings(systemSettings);
  }, [systemSettings]);

  // Handlers
  const handleToggleLibrary = (manga: Manga) => {
    setLibrary((prev) => {
      const exists = prev.find((m) => m.id === manga.id);
      if (exists) {
        return prev.map((m) =>
          m.id === manga.id ? { ...m, inLibrary: !m.inLibrary } : m
        );
      } else {
        return [{ ...manga, inLibrary: true, addedAt: Date.now() }, ...prev];
      }
    });

    if (selectedManga && selectedManga.id === manga.id) {
      setSelectedManga((prev) => (prev ? { ...prev, inLibrary: !prev.inLibrary } : null));
    }
  };

  const handleStartReading = (manga: Manga, chapter: Chapter, page = 1) => {
    // If manga isn't in library yet, auto-add it so user doesn't lose reading history
    setLibrary((prev) => {
      const exists = prev.find((m) => m.id === manga.id);
      if (!exists) {
        return [{ ...manga, inLibrary: true, lastReadAt: Date.now() }, ...prev];
      }
      return prev.map((m) =>
        m.id === manga.id ? { ...m, inLibrary: true, lastReadAt: Date.now() } : m
      );
    });

    // Auto set reading mode based on manga type if default
    if (manga.type === 'manhwa' && readerSettings.readingMode !== 'webtoon-vertical') {
      setReaderSettings((prev) => ({ ...prev, readingMode: 'webtoon-vertical' }));
    } else if (manga.type === 'manga' && readerSettings.readingMode === 'webtoon-vertical') {
      setReaderSettings((prev) => ({ ...prev, readingMode: 'manga-rtl' }));
    }

    setSelectedManga(null);
    setActiveReader({ manga, chapter, page });
  };

  const handleUpdateProgress = (
    mangaId: string,
    chapterId: string,
    page: number,
    total: number
  ) => {
    const percent = Math.min(100, Math.round((page / (total || 1)) * 100));

    setLibrary((prev) =>
      prev.map((m) => {
        if (m.id === mangaId) {
          return {
            ...m,
            currentChapterId: chapterId,
            currentPage: page,
            totalPagesInCurrentChapter: total,
            progressPercent: percent,
            lastReadAt: Date.now(),
          };
        }
        return m;
      })
    );
  };

  const handleToggleBookmark = (bm: Bookmark) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === bm.id);
      if (exists) {
        return prev.filter((b) => b.id !== bm.id);
      } else {
        return [bm, ...prev];
      }
    });
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleJumpToBookmark = (bm: Bookmark) => {
    const manga = library.find((m) => m.id === bm.mangaId);
    if (!manga) return;

    const chapters = loadChapters(manga.id);
    const chapter = chapters.find((c) => c.id === bm.chapterId) || chapters[0];

    if (chapter) {
      handleStartReading(manga, chapter, bm.pageIndex);
    }
  };

  const handleImportSuccess = (manga: Manga, _chapter: Chapter) => {
    setLibrary((prev) => [manga, ...prev]);
  };

  // Search filtered library if search query is active
  const filteredLibrary = searchQuery
    ? library.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : library;

  return (
    <div className="min-h-screen bg-[#2c2b29] flex flex-col items-center justify-center sm:p-4 select-none">
      {/* Kindle Frame Bezel Container */}
      <div
        className={`w-full transition-all duration-300 ${
          showKindleBezel
            ? 'max-w-[850px] bg-[#1a1918] p-5 sm:p-8 rounded-[36px] shadow-2xl border-4 border-[#3a3936]'
            : 'max-w-5xl bg-[#f7f4ed] shadow-xl'
        }`}
      >
        {/* Bezel Kindle Top Brand */}
        {showKindleBezel && (
          <div className="w-full flex justify-between items-center px-4 pb-3 text-[#78746a] text-xs font-serif">
            <span className="tracking-widest uppercase font-semibold text-[10px]">
              KINDLE PAPERWHITE SIGNATURE
            </span>
            <button
              onClick={() => setShowKindleBezel(false)}
              className="hover:text-white transition-colors flex items-center space-x-1 font-sans text-[11px]"
              title="Modo pantalla completa"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Modo Pantalla Completa</span>
            </button>
          </div>
        )}

        {/* Inner Screen Display (Paper / E-Ink texture) */}
        <div
          className={`w-full min-h-[90vh] flex flex-col justify-between bg-[#fbf9f4] text-[#1a1918] overflow-hidden ${
            showKindleBezel ? 'rounded-2xl border border-[#d6cfbd]' : ''
          }`}
        >
          {/* Kindle Top Status Bar */}
          <KindleStatusBar
            settings={systemSettings}
            onToggleDrawer={() => setIsQuickSettingsOpen((prev) => !prev)}
            isDrawerOpen={isQuickSettingsOpen}
          />

          {/* Kindle Top Action Bar */}
          <KindleTopBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenBookmarks={() => setIsBookmarksOpen(true)}
            bookmarksCount={bookmarks.length}
            onOpenQuickSettings={() => setIsQuickSettingsOpen(true)}
          />

          {/* Main App Body */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'home' && (
              <HomeView
                library={filteredLibrary}
                onOpenManga={(m) => setSelectedManga(m)}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'library' && (
              <LibraryView
                library={filteredLibrary}
                onOpenManga={(m) => setSelectedManga(m)}
                onNavigateToDiscover={() => setActiveTab('discover')}
              />
            )}

            {activeTab === 'discover' && (
              <DiscoverView
                library={library}
                onAddToLibrary={handleToggleLibrary}
                onOpenManga={(m) => setSelectedManga(m)}
              />
            )}

            {activeTab === 'import' && (
              <ImportView
                onImportSuccess={handleImportSuccess}
                onOpenReader={(m, c) => handleStartReading(m, c, 1)}
              />
            )}
          </div>

          {/* Kindle Bottom Navigation Bar */}
          <KindleBottomNav
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setSearchQuery('');
            }}
            libraryCount={library.filter((m) => m.inLibrary).length}
          />
        </div>

        {/* Bezel Bottom Brand Logo */}
        {showKindleBezel && (
          <div className="w-full text-center pt-4 text-[#8a8579] font-serif tracking-widest text-sm font-semibold select-none">
            kindle
          </div>
        )}
      </div>

      {/* Floating Toggle for Kindle Bezel Simulation */}
      {!showKindleBezel && (
        <button
          onClick={() => setShowKindleBezel(true)}
          className="fixed bottom-4 right-4 bg-[#1a1918]/90 backdrop-blur-sm text-white px-3.5 py-2 rounded-full text-xs font-sans font-medium flex items-center space-x-2 shadow-xl hover:bg-black transition-all z-40 border border-[#444]"
          title="Ver en marco físico de Kindle Paperwhite"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Ver con Marco Kindle</span>
        </button>
      )}

      {/* Kindle Quick Settings Top Drawer */}
      <KindleQuickSettingsDrawer
        isOpen={isQuickSettingsOpen}
        onClose={() => setIsQuickSettingsOpen(false)}
        systemSettings={systemSettings}
        onUpdateSystemSettings={(upd) =>
          setSystemSettings((prev) => ({ ...prev, ...upd }))
        }
        readerSettings={readerSettings}
        onUpdateReaderSettings={(upd) =>
          setReaderSettings((prev) => ({ ...prev, ...upd }))
        }
      />

      {/* Manga Detail Modal */}
      <MangaDetailModal
        manga={selectedManga}
        isOpen={!!selectedManga}
        onClose={() => setSelectedManga(null)}
        onStartReading={handleStartReading}
        onToggleLibrary={handleToggleLibrary}
        isInLibrary={!!selectedManga && library.some((m) => m.id === selectedManga.id && m.inLibrary)}
      />

      {/* Bookmarks Modal */}
      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        onDeleteBookmark={handleDeleteBookmark}
        onJumpToBookmark={handleJumpToBookmark}
      />

      {/* Fullscreen Kindle Reader */}
      {activeReader && (
        <KindleReader
          manga={activeReader.manga}
          chapter={activeReader.chapter}
          initialPage={activeReader.page}
          allChapters={loadChapters(activeReader.manga.id)}
          onBackToLibrary={() => setActiveReader(null)}
          onUpdateProgress={handleUpdateProgress}
          onToggleBookmark={handleToggleBookmark}
          bookmarks={bookmarks}
          readerSettings={readerSettings}
          onUpdateReaderSettings={(upd) =>
            setReaderSettings((prev) => ({ ...prev, ...upd }))
          }
          onSelectChapter={(nextCh) =>
            setActiveReader({
              manga: activeReader.manga,
              chapter: nextCh,
              page: 1,
            })
          }
        />
      )}
    </div>
  );
};

export default App;
