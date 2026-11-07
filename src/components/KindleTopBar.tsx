import React from 'react';
import { Search, Bookmark as BookmarkIcon, SlidersHorizontal, BookOpen } from 'lucide-react';

interface KindleTopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenBookmarks: () => void;
  bookmarksCount: number;
  onOpenQuickSettings: () => void;
}

export const KindleTopBar: React.FC<KindleTopBarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenBookmarks,
  bookmarksCount,
  onOpenQuickSettings,
}) => {
  return (
    <div className="w-full bg-[#fbf9f4] border-b border-[#e2ddd0] px-4 py-2.5 flex items-center justify-between gap-3">
      {/* Brand logo in classic Kindle serif typography */}
      <div className="flex items-center space-x-2 shrink-0">
        <BookOpen className="w-5 h-5 text-[#2c2b29]" />
        <span className="font-serif font-black tracking-tight text-lg text-[#1a1918]">
          kindle <span className="font-sans font-light text-xs uppercase px-1.5 py-0.5 rounded bg-[#eeebd9] text-[#55524c] tracking-wider ml-1">Manga</span>
        </span>
      </div>

      {/* Kindle Search Bar */}
      <div className="flex-1 max-w-xl relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#78746a]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar en la biblioteca o catálogo en español..."
          className="w-full bg-[#ede9dc] text-[#1e1d1b] placeholder-[#78746a] text-xs font-sans pl-9 pr-4 py-2 rounded-full border border-[#d6cfbd] focus:outline-none focus:ring-1 focus:ring-[#2c2b29] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#78746a] hover:text-[#1e1d1b]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-1 shrink-0">
        {/* Bookmarks */}
        <button
          onClick={onOpenBookmarks}
          className="relative p-2 rounded-full hover:bg-[#ede9dc] text-[#3d3b37] transition-colors"
          title="Ver marcadores guardados"
        >
          <BookmarkIcon className="w-4 h-4" />
          {bookmarksCount > 0 && (
            <span className="absolute 1 top-1 right-1 w-3.5 h-3.5 bg-[#2c2b29] text-white text-[9px] font-sans font-bold rounded-full flex items-center justify-center">
              {bookmarksCount}
            </span>
          )}
        </button>

        {/* Quick settings icon */}
        <button
          onClick={onOpenQuickSettings}
          className="p-2 rounded-full hover:bg-[#ede9dc] text-[#3d3b37] transition-colors"
          title="Ajustes de visualización y Kindle"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

