import React from 'react';
import { BookOpen, Play, Clock, Layers, ChevronRight, Globe } from 'lucide-react';
import type { Manga } from '../types';

interface HomeViewProps {
  library: Manga[];
  onOpenManga: (manga: Manga) => void;
  onNavigateToTab: (tab: 'library' | 'discover') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  library,
  onOpenManga,
  onNavigateToTab,
}) => {
  // Most recently read item
  const recentManga = [...library]
    .filter((m) => m.inLibrary)
    .sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0))[0];

  const olympusManhwas = library.filter((m) => m.source === 'olympus');

  const readingList = library
    .filter((m) => m.inLibrary && m.id !== recentManga?.id)
    .slice(0, 4);

  const mangas = library.filter((m) => m.type === 'manga').slice(0, 4);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-8 text-[#1f1e1c]">
      {/* Hero: Currently Reading (Estilo Kindle "De tu Biblioteca") */}
      {recentManga ? (
        <section className="bg-[#f0ece1] border border-[#d6cfbd] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-xs font-sans text-[#6b675e]">
            <span className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[11px] text-[#2c2b29]">
              <Clock className="w-3.5 h-3.5" />
              <span>De tu biblioteca • Continuar lectura</span>
            </span>
            <button
              onClick={() => onNavigateToTab('library')}
              className="hover:underline flex items-center space-x-0.5 text-[#2c2b29]"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Book Cover */}
            <div
              onClick={() => onOpenManga(recentManga)}
              className="relative w-32 sm:w-36 h-48 sm:h-52 rounded-lg overflow-hidden shadow-md shrink-0 border border-[#b8b09d] cursor-pointer group bg-[#e4ded0]"
            >
              <img
                src={recentManga.coverUrl}
                alt={recentManga.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 bg-[#1a1918]/90 text-white text-[10px] font-sans px-2 py-0.5 rounded-sm uppercase tracking-wider">
                {recentManga.source === 'olympus' ? 'OLYMPUS' : recentManga.type === 'manhwa' ? 'Webtoon' : 'Manga'}
              </div>
            </div>

            {/* Book Details */}
            <div className="flex-1 flex flex-col justify-between self-stretch">
              <div>
                <div className="flex items-center space-x-2">
                  <h3
                    onClick={() => onOpenManga(recentManga)}
                    className="font-serif font-bold text-2xl text-[#1a1918] cursor-pointer hover:underline tracking-tight"
                  >
                    {recentManga.title}
                  </h3>
                  {recentManga.source === 'olympus' && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-sans px-2 py-0.5 rounded-md font-bold shrink-0">
                      Olympus Real
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5a574f] font-sans mt-0.5">
                  Por <span className="font-medium text-[#2c2b29]">{recentManga.author}</span>
                  {recentManga.artist && ` • Arte: ${recentManga.artist}`}
                </p>

                {/* Kindle Reading progress bar */}
                <div className="mt-3.5 space-y-1.5 max-w-md">
                  <div className="flex justify-between text-xs font-sans text-[#524f47]">
                    <span>
                      Página {recentManga.currentPage || 1} de {recentManga.totalPagesInCurrentChapter || 45}
                    </span>
                    <span className="font-semibold text-[#1a1918]">
                      {recentManga.progressPercent || 0}% completado
                    </span>
                  </div>
                  <div className="w-full bg-[#ded9cb] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2c2b29] h-full rounded-full transition-all duration-300"
                      style={{ width: `${recentManga.progressPercent || 0}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs font-sans text-[#55524b] line-clamp-2 mt-3 leading-relaxed">
                  {recentManga.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[#dfd9c7]">
                <button
                  onClick={() => onOpenManga(recentManga)}
                  className="bg-[#2c2b29] text-white px-5 py-2 rounded-lg text-xs font-sans font-semibold flex items-center space-x-2 hover:bg-[#1a1918] shadow-sm transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Continuar leyendo</span>
                </button>
                <button
                  onClick={() => onOpenManga(recentManga)}
                  className="bg-transparent border border-[#b8b09d] text-[#2c2b29] px-4 py-2 rounded-lg text-xs font-sans font-medium hover:bg-[#eae5d8] transition-all"
                >
                  Capítulos ({recentManga.chaptersCount})
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* SECCIÓN ESPECIAL: OLYMPUS SCANLATION (olympusxyz.com) */}
      <section className="bg-[#fcfaf5] border-2 border-[#dcd6c5] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#ded8c7]">
          <div>
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-[#2c2b29]" />
              <h2 className="font-serif font-black text-xl text-[#1a1918]">
                Olympus Scanlation (olympusxyz.com)
              </h2>
            </div>
            <p className="text-xs text-[#635f56] font-sans mt-0.5">
              Cómics y Manhwas oficiales con páginas reales en español cargadas directamente
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('discover')}
            className="text-xs font-sans font-bold text-[#2c2b29] hover:underline shrink-0"
          >
            Ver catálogo completo
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {olympusManhwas.map((manga) => (
            <div
              key={manga.id}
              onClick={() => onOpenManga(manga)}
              className="bg-[#f5f2e9] border border-[#d6cfbd] rounded-xl p-2.5 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="relative aspect-[3/4.2] rounded-lg overflow-hidden bg-[#e0dacb] mb-2 shadow-sm">
                <img
                  src={manga.coverUrl}
                  alt={manga.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-1.5 left-1.5 bg-[#1a1918]/90 text-white text-[8px] font-sans px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                  OLYMPUS
                </span>
                <span className="absolute bottom-1.5 right-1.5 bg-emerald-800 text-white text-[8px] font-sans px-1.5 py-0.5 rounded font-bold">
                  {manga.chaptersCount} Caps
                </span>
              </div>

              <div>
                <h4 className="font-serif font-bold text-xs text-[#1a1918] line-clamp-1 group-hover:underline">
                  {manga.title}
                </h4>
                <p className="text-[10px] text-[#635f56] font-sans line-clamp-1 mt-0.5">
                  {manga.author}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recientemente en tu biblioteca */}
      {readingList.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif font-bold text-lg text-[#1a1918] flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#2c2b29]" />
              <span>Otros títulos en tu biblioteca</span>
            </h2>
            <button
              onClick={() => onNavigateToTab('library')}
              className="text-xs font-sans text-[#5c584f] hover:underline"
            >
              Ver biblioteca ({library.length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {readingList.map((manga) => (
              <div
                key={manga.id}
                onClick={() => onOpenManga(manga)}
                className="bg-[#f5f2e9] border border-[#dcd6c5] rounded-xl p-3 cursor-pointer hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="relative aspect-[3/4] rounded-md overflow-hidden mb-2 bg-[#ded9cb]">
                  <img
                    src={manga.coverUrl}
                    alt={manga.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-1 px-2 text-[10px] text-white font-sans flex justify-between">
                    <span>{manga.progressPercent || 0}%</span>
                    <span>{manga.type.toUpperCase()}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-serif font-bold text-sm text-[#1a1918] line-clamp-1 group-hover:underline">
                    {manga.title}
                  </h4>
                  <p className="text-[11px] text-[#6b675e] font-sans line-clamp-1">
                    {manga.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mangas Japoneses (RTL) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#1a1918] flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#2c2b29]" />
              <span>Mangas Tradicionales en Español (Modo RTL)</span>
            </h2>
            <p className="text-[11px] text-[#6c685e] font-sans">
              Optimizado para lectura de derecha a izquierda con simulación de papel Kindle
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('discover')}
            className="text-xs font-sans text-[#5c584f] hover:underline shrink-0"
          >
            Explorar catálogo
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {mangas.map((manga) => (
            <div
              key={manga.id}
              onClick={() => onOpenManga(manga)}
              className="bg-[#f5f2e9] border border-[#dcd6c5] rounded-xl p-3 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="relative aspect-[3/4] rounded-md overflow-hidden mb-2 bg-[#ded9cb]">
                <img
                  src={manga.coverUrl}
                  alt={manga.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
                <span className="absolute top-1.5 left-1.5 bg-[#2c2b29]/80 text-white text-[9px] font-sans px-1.5 py-0.5 rounded uppercase">
                  MANGA
                </span>
              </div>
              <h4 className="font-serif font-bold text-sm text-[#1a1918] line-clamp-1 group-hover:underline">
                {manga.title}
              </h4>
              <p className="text-[11px] text-[#6b675e] font-sans line-clamp-1">{manga.author}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
