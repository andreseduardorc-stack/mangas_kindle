import React, { useState } from 'react';
import {
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  CheckCircle2,
  BookOpen,
  Filter,
} from 'lucide-react';
import type { Manga } from '../types';

interface LibraryViewProps {
  library: Manga[];
  onOpenManga: (manga: Manga) => void;
  onNavigateToDiscover: () => void;
}

type FilterCategory = 'all' | 'mangas' | 'manhwas' | 'downloaded' | 'reading';
type SortOption = 'recent' | 'title' | 'progress';

export const LibraryView: React.FC<LibraryViewProps> = ({
  library,
  onOpenManga,
  onNavigateToDiscover,
}) => {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [sort, setSort] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter
  const filtered = library.filter((item) => {
    if (!item.inLibrary) return false;
    if (filter === 'mangas') return item.type === 'manga';
    if (filter === 'manhwas') return item.type === 'manhwa';
    if (filter === 'downloaded') return item.downloaded;
    if (filter === 'reading') return (item.progressPercent || 0) > 0 && (item.progressPercent || 0) < 100;
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    if (sort === 'recent') {
      return (b.lastReadAt || b.addedAt || 0) - (a.lastReadAt || a.addedAt || 0);
    }
    if (sort === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sort === 'progress') {
      return (b.progressPercent || 0) - (a.progressPercent || 0);
    }
    return 0;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 text-[#1f1e1c]">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#ded8c7] gap-4">
        <div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-[#1a1918]">
            Tu Biblioteca Kindle
          </h1>
          <p className="text-xs text-[#635f56] font-sans mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'título disponible' : 'títulos disponibles'} para lectura
          </p>
        </div>

        {/* View mode & Sort controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Sort selector */}
          <div className="flex items-center space-x-1.5 bg-[#ede8dc] px-3 py-1.5 rounded-lg border border-[#d6cfbd] text-xs font-sans text-[#33312c]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#635f56]" />
            <span className="text-[#635f56]">Ordenar:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="recent">Recientes</option>
              <option value="title">Título (A-Z)</option>
              <option value="progress">Progreso</option>
            </select>
          </div>

          {/* Grid vs List toggle */}
          <div className="flex items-center bg-[#ede8dc] p-1 rounded-lg border border-[#d6cfbd]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#ffffff] text-[#1a1918] shadow-xs'
                  : 'text-[#635f56] hover:text-[#1a1918]'
              }`}
              title="Vista en cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#ffffff] text-[#1a1918] shadow-xs'
                  : 'text-[#635f56] hover:text-[#1a1918]'
              }`}
              title="Vista en lista"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs Kindle style */}
      <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar border-b border-[#ded8c7] mb-6 text-xs font-sans">
        <Filter className="w-3.5 h-3.5 text-[#635f56] shrink-0 mr-1" />
        {[
          { id: 'all', label: 'Todos' },
          { id: 'mangas', label: 'Mangas (RTL)' },
          { id: 'manhwas', label: 'Manhwas (Webtoon)' },
          { id: 'downloaded', label: 'Descargados' },
          { id: 'reading', label: 'En Curso' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterCategory)}
            className={`px-3 py-1.5 rounded-full transition-all shrink-0 font-medium ${
              filter === tab.id
                ? 'bg-[#2c2b29] text-white shadow-xs'
                : 'bg-[#ede8dc] text-[#55524c] hover:bg-[#e4decb]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#f7f4ed] border border-dashed border-[#d6cfbd] rounded-2xl">
          <BookOpen className="w-12 h-12 text-[#9e988a] mx-auto mb-3" />
          <h3 className="text-lg font-serif font-bold text-[#2c2b29]">
            No hay títulos con este filtro
          </h3>
          <p className="text-xs text-[#635f56] font-sans mt-1 max-w-sm mx-auto">
            Explora títulos en español desde el catálogo o importa tus archivos .cbz/.zip.
          </p>
          <button
            onClick={onNavigateToDiscover}
            className="mt-4 bg-[#2c2b29] text-white px-4 py-2 rounded-lg text-xs font-sans font-medium hover:bg-[#1a1918] transition-colors"
          >
            Explorar catálogo MangaDex
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Kindle Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {filtered.map((manga) => (
            <div
              key={manga.id}
              onClick={() => onOpenManga(manga)}
              className="bg-[#f5f2e9] border border-[#d6cfbd] rounded-xl p-2.5 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="relative aspect-[3/4.2] rounded-lg overflow-hidden bg-[#e0dacb] mb-2.5 shadow-sm">
                <img
                  src={manga.coverUrl}
                  alt={manga.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Kindle Reading progress indicator ribbon */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="bg-[#1a1918]/85 backdrop-blur-xs text-white text-[9px] font-sans px-2 py-0.5 rounded-sm uppercase tracking-wider font-semibold">
                    {manga.type === 'manhwa' ? 'Manhwa' : 'Manga'}
                  </span>
                  {manga.downloaded && (
                    <span className="bg-emerald-800/90 text-white text-[9px] font-sans px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Descargado
                    </span>
                  )}
                </div>

                {/* Bottom progress bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6">
                  <div className="flex justify-between items-center text-[10px] text-white font-sans mb-1">
                    <span>
                      {manga.progressPercent ? `${manga.progressPercent}% leído` : 'Sin empezar'}
                    </span>
                    <span>Cap. {manga.currentPage ? `${manga.currentPage}` : '1'}</span>
                  </div>
                  <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full"
                      style={{ width: `${manga.progressPercent || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-serif font-bold text-sm text-[#1a1918] line-clamp-1 group-hover:underline">
                  {manga.title}
                </h4>
                <p className="text-[11px] text-[#635f56] font-sans line-clamp-1 mt-0.5">
                  {manga.author}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Kindle List View */
        <div className="divide-y divide-[#ded8c7] bg-[#f8f6ef] border border-[#d6cfbd] rounded-2xl overflow-hidden">
          {filtered.map((manga) => (
            <div
              key={manga.id}
              onClick={() => onOpenManga(manga)}
              className="p-3.5 flex items-center justify-between hover:bg-[#ede8dc] transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-16 rounded overflow-hidden bg-[#ded8c7] shrink-0 border border-[#b8b09d]">
                  <img
                    src={manga.coverUrl}
                    alt={manga.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-serif font-bold text-base text-[#1a1918] group-hover:underline">
                      {manga.title}
                    </h4>
                    <span className="text-[10px] font-sans uppercase px-1.5 py-0.5 rounded bg-[#e2ddd0] text-[#4a4740] font-semibold">
                      {manga.type}
                    </span>
                  </div>
                  <p className="text-xs text-[#635f56] font-sans mt-0.5">
                    {manga.author} {manga.artist && `• ${manga.artist}`}
                  </p>
                  <p className="text-[11px] text-[#7a766c] font-sans mt-0.5 line-clamp-1">
                    {manga.genres.join(' • ')}
                  </p>
                </div>
              </div>

              {/* Progress and status */}
              <div className="text-right shrink-0 ml-4 font-sans">
                <div className="text-xs font-bold text-[#1a1918]">
                  {manga.progressPercent || 0}% completado
                </div>
                <div className="w-24 bg-[#ded8c7] h-1.5 rounded-full overflow-hidden mt-1 ml-auto">
                  <div
                    className="bg-[#2c2b29] h-full rounded-full"
                    style={{ width: `${manga.progressPercent || 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#7a766c] mt-1 block">
                  {manga.downloaded ? 'Disponible sin conexión' : 'En línea'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
