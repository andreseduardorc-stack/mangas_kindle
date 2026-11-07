import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  BookmarkPlus,
  BookmarkCheck,
  BookOpen,
  Layers,
  ArrowRightLeft,
  ArrowDownUp,
  Loader2,
  Calendar,
  User,
} from 'lucide-react';
import type { Manga, Chapter, ReadingMode } from '../types';
import { loadChapters, saveChapters } from '../services/storage';
import { fetchMangaDexChapters } from '../services/mangaDexApi';
import { fetchOlympusSeriesDetails, fetchOlympusChapters } from '../services/olympusService';

interface MangaDetailModalProps {
  manga: Manga | null;
  isOpen: boolean;
  onClose: () => void;
  onStartReading: (manga: Manga, chapter: Chapter, page?: number) => void;
  onToggleLibrary: (manga: Manga) => void;
  isInLibrary: boolean;
  onUpdateReadingMode?: (mangaId: string, mode: ReadingMode) => void;
}

export const MangaDetailModal: React.FC<MangaDetailModalProps> = ({
  manga,
  isOpen,
  onClose,
  onStartReading,
  onToggleLibrary,
  isInLibrary,
}) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [displayManga, setDisplayManga] = useState<Manga | null>(manga);

  useEffect(() => {
    setDisplayManga(manga);
    if (!manga) return;
    setLoading(true);

    const slug = manga.olympusSlug || manga.id.replace('olympus-', '');

    // If Olympus series, enrich details (synopsis, genres, chapters) in real-time
    if (manga.source === 'olympus') {
      fetchOlympusSeriesDetails(slug).then((details) => {
        if (details) {
          setDisplayManga((prev) => (prev ? { ...prev, ...details } : null));
        }
      });

      fetchOlympusChapters(manga.id, slug)
        .then((chs) => {
          if (chs.length > 0) {
            setChapters(chs);
            saveChapters(manga.id, chs);
          } else {
            const localList = loadChapters(manga.id);
            if (localList && localList.length > 0) {
              setChapters(localList);
            }
          }
        })
        .catch((err) => {
          console.error(err);
          const localList = loadChapters(manga.id);
          if (localList && localList.length > 0) {
            setChapters(localList);
          }
        })
        .finally(() => setLoading(false));
      return;
    }

    const localList = loadChapters(manga.id);
    if (localList && localList.length > 0) {
      setChapters(localList);
      setLoading(false);
      return;
    }

    if (manga.source === 'mangadex') {
      fetchMangaDexChapters(manga.id)
        .then((chs) => {
          setChapters(chs);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [manga]);

  if (!isOpen || !displayManga) return null;

  const currentChapter =
    chapters.find((c) => c.id === displayManga.currentChapterId) || chapters[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-serif text-[#1e1d1b]">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container Kindle styled */}
      <div className="relative z-10 w-full max-w-3xl max-h-[92vh] bg-[#fbf9f4] border-2 border-[#d6cfbd] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="px-5 py-3 border-b border-[#ded8c7] bg-[#f4f1e8] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-sans text-[#635f56]">
            <span className="font-bold uppercase tracking-wider text-[#1a1918]">
              Detalles del libro Kindle
            </span>
            <span>•</span>
            <span className="uppercase">{displayManga.type}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#e2ddd0] transition-colors"
          >
            <X className="w-5 h-5 text-[#4a4740]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top section: Cover & metadata */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Book Cover */}
            <div className="w-36 sm:w-44 h-52 sm:h-64 rounded-xl overflow-hidden bg-[#e4ded0] shadow-md border border-[#c4bdae] shrink-0 mx-auto sm:mx-0">
              <img
                src={displayManga.coverUrl}
                alt={displayManga.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between self-stretch">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#1a1918] tracking-tight leading-snug">
                  {displayManga.title}
                </h2>
                {displayManga.altTitle && (
                  <p className="text-xs text-[#78746a] font-sans mt-0.5 italic">
                    {displayManga.altTitle}
                  </p>
                )}

                <div className="flex items-center space-x-4 mt-2.5 text-xs font-sans text-[#524f47]">
                  <span className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5" />
                    <span>{displayManga.author}</span>
                  </span>
                  <span className="capitalize bg-[#eeeae0] px-2 py-0.5 rounded text-[#4a4740]">
                    {displayManga.status === 'completed' ? 'Finalizado' : 'En publicación'}
                  </span>
                </div>

                {/* Genre tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {displayManga.genres.map((g) => (
                    <span
                      key={g}
                      className="text-[11px] font-sans bg-[#eeeae0] text-[#4a4740] px-2 py-0.5 rounded-md border border-[#ded8c7]"
                    >
                      {g}
                    </span>
                  ))}
                </div>

                {/* Kindle Progress (if any) */}
                {displayManga.progressPercent ? (
                  <div className="mt-4 p-3 bg-[#ede8dc] rounded-xl border border-[#d6cfbd] text-xs font-sans">
                    <div className="flex justify-between text-[#3d3b37] mb-1 font-semibold">
                      <span>Progreso de lectura</span>
                      <span>{displayManga.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-[#d6cfbd] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2c2b29] h-full rounded-full"
                        style={{ width: `${displayManga.progressPercent}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-[#ded8c7]">
                {currentChapter ? (
                  <button
                    onClick={() =>
                      onStartReading(displayManga, currentChapter, displayManga.currentPage || 1)
                    }
                    className="flex-1 min-w-[160px] bg-[#2c2b29] text-white py-2.5 px-4 rounded-xl text-xs font-sans font-bold hover:bg-[#1a1918] transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {displayManga.progressPercent
                        ? `Continuar (Cap. ${currentChapter.chapterNumber})`
                        : `Comenzar Lectura`}
                    </span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-sans font-bold bg-[#ded8c7] text-[#78746a] cursor-not-allowed"
                  >
                    Sin capítulos disponibles
                  </button>
                )}

                <button
                  onClick={() => onToggleLibrary(displayManga)}
                  className={`py-2.5 px-4 rounded-xl text-xs font-sans font-bold flex items-center space-x-2 border transition-all cursor-pointer ${
                    isInLibrary
                      ? 'bg-[#ded8c7] text-[#2c2b29] border-[#b8b09d]'
                      : 'bg-transparent text-[#2c2b29] border-[#2c2b29] hover:bg-[#eae5d8]'
                  }`}
                >
                  {isInLibrary ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-emerald-800" />
                      <span>En tu Biblioteca</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-4 h-4" />
                      <span>Añadir a Biblioteca</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-serif font-bold text-base text-[#1a1918] mb-1.5">
              Sinopsis
            </h4>
            <p className="text-xs font-sans text-[#4a4740] leading-relaxed whitespace-pre-line bg-[#f5f2e9] p-4 rounded-xl border border-[#ded8c7]">
              {displayManga.description}
            </p>
          </div>

          {/* Reading Mode Guide */}
          <div className="bg-[#ede8dc] border border-[#d6cfbd] rounded-xl p-3.5 flex items-center justify-between text-xs font-sans text-[#4a4740]">
            <div className="flex items-center space-x-2.5">
              {displayManga.defaultReadingMode === 'webtoon-vertical' ? (
                <ArrowDownUp className="w-5 h-5 text-[#0284c7]" />
              ) : (
                <ArrowRightLeft className="w-5 h-5 text-[#2c2b29]" />
              )}
              <div>
                <span className="font-bold text-[#1a1918] block">
                  {displayManga.defaultReadingMode === 'webtoon-vertical'
                    ? 'Modo Recomendado: Webtoon Continuo'
                    : 'Modo Recomendado: Manga RTL (Derecha a Izquierda)'}
                </span>
                <span className="text-[11px] text-[#635f56]">
                  {displayManga.defaultReadingMode === 'webtoon-vertical'
                    ? 'Desplazamiento vertical fluido en cascada'
                    : 'Paso de página estilo libro japonés tradicional'}
                </span>
              </div>
            </div>
          </div>

          {/* Chapters List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-serif font-bold text-base text-[#1a1918] flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>Capítulos disponibles ({chapters.length})</span>
              </h4>
              <span className="text-[11px] font-sans text-[#78746a]">
                Idioma: Español [ES]
              </span>
            </div>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-xs font-sans text-[#635f56]">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span>Cargando lista de capítulos...</span>
              </div>
            ) : chapters.length === 0 ? (
              <div className="text-center py-6 bg-[#f5f2e9] border border-dashed border-[#ded8c7] rounded-xl text-xs font-sans text-[#635f56]">
                No se encontraron capítulos en español para este título.
              </div>
            ) : (
              <div className="divide-y divide-[#ded8c7] bg-[#f5f2e9] border border-[#ded8c7] rounded-xl max-h-60 overflow-y-auto">
                {chapters.map((ch) => {
                  const isCurrent = ch.id === displayManga.currentChapterId;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => onStartReading(displayManga, ch, 1)}
                      className={`p-3 flex items-center justify-between hover:bg-[#ede8dc] cursor-pointer transition-colors ${
                        isCurrent ? 'bg-[#e7e1d2] font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <BookOpen
                          className={`w-4 h-4 ${
                            isCurrent ? 'text-[#1a1918]' : 'text-[#8c8577]'
                          }`}
                        />
                        <div>
                          <p className="font-sans text-xs text-[#1a1918]">
                            {ch.title}
                          </p>
                          <p className="font-sans text-[10px] text-[#78746a]">
                            {ch.scanlationGroup || 'Fansub Español'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-xs font-sans text-[#635f56]">
                        {ch.publishDate && (
                          <span className="flex items-center space-x-1 text-[11px]">
                            <Calendar className="w-3 h-3" />
                            <span>{ch.publishDate}</span>
                          </span>
                        )}
                        <span className="bg-[#e0dacb] text-[#33312c] px-2 py-0.5 rounded text-[10px] font-bold">
                          ES
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
