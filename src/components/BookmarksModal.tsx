import React from 'react';
import { Bookmark, X, Trash2, ArrowUpRight, BookOpen } from 'lucide-react';
import type { Bookmark as BookmarkType } from '../types';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkType[];
  onDeleteBookmark: (id: string) => void;
  onJumpToBookmark: (bookmark: BookmarkType) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onDeleteBookmark,
  onJumpToBookmark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-serif text-[#1e1d1b]">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl bg-[#fbf9f4] border-2 border-[#d6cfbd] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#ded8c7] bg-[#f4f1e8] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-[#2c2b29]" />
            <h3 className="font-serif font-bold text-base text-[#1a1918]">
              Tus Marcadores y Notas Kindle ({bookmarks.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#e2ddd0] transition-colors"
          >
            <X className="w-5 h-5 text-[#4a4740]" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12 text-[#635f56]">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-serif font-bold text-base text-[#2c2b29]">
                Aún no tienes marcadores
              </p>
              <p className="text-xs font-sans mt-1 max-w-xs mx-auto">
                Mientras lees cualquier manga o manhwa, pulsa el lazo de la esquina superior derecha o la tecla 'B' para guardar una página.
              </p>
            </div>
          ) : (
            bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="bg-[#f5f2e9] border border-[#d6cfbd] rounded-xl p-3 flex items-center justify-between hover:bg-[#ede8dc] transition-colors"
              >
                <div className="flex items-center space-x-3 truncate">
                  {bm.previewUrl && (
                    <div className="w-10 h-14 bg-[#ded8c7] rounded overflow-hidden shrink-0 border border-[#b8b09d]">
                      <img
                        src={bm.previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="truncate">
                    <h4 className="font-serif font-bold text-sm text-[#1a1918] truncate">
                      {bm.mangaTitle}
                    </h4>
                    <p className="text-xs font-sans text-[#635f56]">
                      Capítulo {bm.chapterNumber} • Página {bm.pageIndex}
                    </p>
                    <p className="text-[10px] font-sans text-[#8c8577] mt-0.5">
                      {new Date(bm.timestamp).toLocaleDateString()} a las{' '}
                      {new Date(bm.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0 ml-3">
                  <button
                    onClick={() => {
                      onJumpToBookmark(bm);
                      onClose();
                    }}
                    className="bg-[#2c2b29] text-white p-2 rounded-lg hover:bg-[#1a1918] text-xs font-sans flex items-center space-x-1"
                    title="Ir a esta página"
                  >
                    <span>Ir</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteBookmark(bm.id)}
                    className="p-2 text-[#8c8577] hover:text-red-700 hover:bg-[#ded8c7] rounded-lg transition-colors"
                    title="Eliminar marcador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
