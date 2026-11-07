import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Check,
  Loader2,
  Sparkles,
  BookOpen,
  Globe,
  RotateCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Manga } from '../types';
import { searchMangaDex } from '../services/mangaDexApi';
import { getFullOlympusCatalog } from '../services/olympusService';
import { DEMO_MANGAS } from '../services/sampleData';

interface DiscoverViewProps {
  library: Manga[];
  onAddToLibrary: (manga: Manga) => void;
  onOpenManga: (manga: Manga) => void;
}

const ITEMS_PER_PAGE = 24;

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  library,
  onAddToLibrary,
  onOpenManga,
}) => {
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'olympus' | 'all' | 'mangadex'>('olympus');
  const [typeFilter, setTypeFilter] = useState<'all' | 'manga' | 'manhwa'>('all');
  const [allOlympusSeries, setAllOlympusSeries] = useState<Manga[]>([]);
  const [filteredResults, setFilteredResults] = useState<Manga[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load Olympus full catalog
  const loadOlympusCatalog = async (forceSync = false) => {
    if (forceSync) setSyncing(true);
    else setLoading(true);

    try {
      const fullCatalog = await getFullOlympusCatalog();
      setAllOlympusSeries(fullCatalog);
      setFilteredResults(fullCatalog);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadOlympusCatalog();
  }, []);

  // Filter effect
  useEffect(() => {
    setCurrentPage(1);
    const q = query.trim().toLowerCase();

    let pool: Manga[] = [];
    if (sourceFilter === 'olympus') {
      pool = allOlympusSeries;
    } else if (sourceFilter === 'mangadex') {
      pool = DEMO_MANGAS;
    } else {
      pool = [...allOlympusSeries, ...DEMO_MANGAS];
    }

    if (typeFilter !== 'all') {
      pool = pool.filter((m) => m.type === typeFilter);
    }

    if (q) {
      pool = pool.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q))
      );
    }

    setFilteredResults(pool);
  }, [query, sourceFilter, typeFilter, allOlympusSeries]);

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (sourceFilter === 'mangadex' || sourceFilter === 'all') {
      setLoading(true);
      try {
        const fetched = await searchMangaDex(query, typeFilter);
        if (sourceFilter === 'mangadex') {
          setFilteredResults(fetched);
        } else {
          // Merge with filtered olympus
          const q = query.trim().toLowerCase();
          const olympusMatches = allOlympusSeries.filter((m) =>
            m.title.toLowerCase().includes(q)
          );
          setFilteredResults([...olympusMatches, ...fetched]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const isAlreadyInLibrary = (id: string) => {
    return library.some((m) => m.id === id && m.inLibrary);
  };

  // Pagination calculation
  const totalItems = filteredResults.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentBatch = filteredResults.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 text-[#1f1e1c]">
      {/* Title & Sync header */}
      <div className="pb-4 border-b border-[#ded8c7] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-serif font-black tracking-tight text-[#1a1918]">
              Catálogo Completo en Español
            </h1>
            <span className="bg-[#2c2b29] text-white text-[11px] font-sans font-bold px-2 py-0.5 rounded-full">
              {allOlympusSeries.length} títulos de Olympus
            </span>
          </div>
          <p className="text-xs text-[#635f56] font-sans mt-0.5">
            Explora las más de 890 series oficiales de <span className="font-bold text-[#1a1918]">Olympus Scanlation (olympusxyz.com)</span> con lectura instantánea
          </p>
        </div>

        {/* Source selector & Sync Button */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-1 bg-[#ede8dc] p-1 rounded-xl border border-[#d6cfbd] text-xs font-sans">
            <button
              onClick={() => setSourceFilter('olympus')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 transition-all ${
                sourceFilter === 'olympus'
                  ? 'bg-[#1a1918] text-white shadow-xs'
                  : 'text-[#55524c] hover:text-[#1a1918]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Olympus ({allOlympusSeries.length})</span>
            </button>
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                sourceFilter === 'all'
                  ? 'bg-[#1a1918] text-white shadow-xs'
                  : 'text-[#55524c] hover:text-[#1a1918]'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSourceFilter('mangadex')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                sourceFilter === 'mangadex'
                  ? 'bg-[#1a1918] text-white shadow-xs'
                  : 'text-[#55524c] hover:text-[#1a1918]'
              }`}
            >
              MangaDex
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={() => loadOlympusCatalog(true)}
            disabled={syncing}
            className="p-2 rounded-xl bg-[#ede8dc] hover:bg-[#e4decb] border border-[#d6cfbd] text-[#2c2b29] transition-colors"
            title="Sincronizar catálogo en vivo de olympusxyz.com"
          >
            <RotateCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Input & Filters */}
      <form onSubmit={handleSearchSubmit} className="space-y-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78746a]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar entre los más de 890 mangas y manhwas de Olympus..."
              className="w-full bg-[#f4f1e8] text-[#1e1d1b] placeholder-[#78746a] text-sm font-sans pl-10 pr-4 py-2.5 rounded-xl border border-[#d6cfbd] focus:outline-none focus:ring-2 focus:ring-[#2c2b29]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#78746a] hover:text-[#1a1918]"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#2c2b29] text-white px-5 py-2.5 rounded-xl text-xs font-sans font-bold hover:bg-[#1a1918] transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Buscar</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="text-[#635f56] font-medium mr-1">Formato:</span>
          {[
            { id: 'all', label: 'Todos los formatos' },
            { id: 'manhwa', label: 'Manhwas / Webtoons' },
            { id: 'manga', label: 'Mangas' },
          ].map((type) => (
            <button
              type="button"
              key={type.id}
              onClick={() => setTypeFilter(type.id as any)}
              className={`px-3 py-1 rounded-full transition-all ${
                typeFilter === type.id
                  ? 'bg-[#2c2b29] text-white font-medium'
                  : 'bg-[#ede8dc] text-[#55524c] hover:bg-[#e4decb]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </form>

      {/* Popular Tag suggestions */}
      <div className="mb-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] font-sans pb-1">
        <Sparkles className="w-3.5 h-3.5 text-[#8c8577] shrink-0" />
        <span className="text-[#635f56] font-medium mr-1 shrink-0">Etiquetas:</span>
        {['Espada', 'Villano', 'Mago', 'Regresor', 'Artes Marciales', 'Gacha', 'Murim', 'Monstruos', 'Nivel'].map(
          (tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="bg-[#ede8dc] hover:bg-[#e2ddd0] text-[#4a4740] px-2.5 py-1 rounded-md shrink-0 transition-colors"
            >
              {tag}
            </button>
          )
        )}
      </div>

      {/* Catalog status line */}
      <div className="flex items-center justify-between text-xs font-sans text-[#635f56] mb-4 pb-2 border-b border-[#ded8c7]">
        <span>
          Mostrando {totalItems > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} de{' '}
          <strong className="text-[#1a1918]">{totalItems} series</strong>
        </span>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className="p-1 rounded bg-[#ede8dc] hover:bg-[#ded8c7] disabled:opacity-30 disabled:hover:bg-[#ede8dc]"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-[#1a1918]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-[#ede8dc] hover:bg-[#ded8c7] disabled:opacity-30 disabled:hover:bg-[#ede8dc]"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#635f56]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2c2b29] mb-3" />
          <p className="text-sm font-sans">Cargando catálogo completo de Olympus...</p>
        </div>
      ) : currentBatch.length === 0 ? (
        <div className="text-center py-16 bg-[#f7f4ed] border border-dashed border-[#d6cfbd] rounded-2xl">
          <BookOpen className="w-10 h-10 text-[#9e988a] mx-auto mb-2" />
          <p className="font-serif font-bold text-base text-[#2c2b29]">
            No se encontraron series para "{query}" en Olympus
          </p>
          <button
            onClick={() => setQuery('')}
            className="mt-3 text-xs text-[#2c2b29] font-sans font-bold underline"
          >
            Limpiar búsqueda y ver todo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {currentBatch.map((manga) => {
            const inLib = isAlreadyInLibrary(manga.id);
            return (
              <div
                key={manga.id}
                onClick={() => onOpenManga(manga)}
                className="bg-[#f5f2e9] border border-[#d6cfbd] rounded-xl p-2 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer group"
              >
                {/* Cover */}
                <div className="relative aspect-[3/4.2] rounded-lg overflow-hidden bg-[#ded8c7] mb-2 shadow-xs border border-[#cfc8b5]">
                  <img
                    src={manga.coverUrl}
                    alt={manga.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-1 left-1 bg-black/80 text-white text-[8px] font-sans px-1 py-0.5 rounded uppercase font-bold tracking-wider">
                    {manga.source === 'olympus' ? 'OLYMPUS' : manga.type.toUpperCase()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToLibrary(manga);
                    }}
                    title={inLib ? 'En tu Kindle' : 'Añadir a mi biblioteca Kindle'}
                    className={`absolute bottom-1.5 right-1.5 p-1 rounded-full shadow-xs transition-colors ${
                      inLib
                        ? 'bg-emerald-800 text-white'
                        : 'bg-black/60 text-white hover:bg-black'
                    }`}
                  >
                    {inLib ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  </button>
                </div>

                {/* Details */}
                <div>
                  <h4 className="font-serif font-bold text-xs text-[#1a1918] line-clamp-2 group-hover:underline leading-snug">
                    {manga.title}
                  </h4>
                  <p className="text-[10px] text-[#635f56] font-sans truncate mt-0.5">
                    {manga.author}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-3 mt-8 pt-4 border-t border-[#ded8c7] text-xs font-sans text-[#635f56]">
          <button
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg bg-[#ede8dc] hover:bg-[#ded8c7] font-semibold text-[#1a1918] disabled:opacity-30 disabled:hover:bg-[#ede8dc] flex items-center space-x-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Página anterior</span>
          </button>

          <span className="font-medium text-[#1a1918]">
            Página <strong>{currentPage}</strong> de {totalPages} ({totalItems} series)
          </span>

          <button
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg bg-[#ede8dc] hover:bg-[#ded8c7] font-semibold text-[#1a1918] disabled:opacity-30 disabled:hover:bg-[#ede8dc] flex items-center space-x-1"
          >
            <span>Página siguiente</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
