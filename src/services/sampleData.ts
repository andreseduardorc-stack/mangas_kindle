import type { Manga, Chapter } from '../types';

// Helper to create clean Kindle-style demo manga page illustrations as SVG Data URLs
function generateMangaPageSvg(title: string, chapter: string, pageNum: number, total: number, type: 'manga' | 'manhwa'): string {
  const isManhwa = type === 'manhwa';
  const width = isManhwa ? 800 : 900;
  const height = isManhwa ? 1400 : 1300;

  // Manhwa is colorful webtoon, Manga is black & white screentone
  const bg = isManhwa ? '#0f172a' : '#ffffff';
  const panelBorder = isManhwa ? '#334155' : '#111111';
  const ink = isManhwa ? '#f8fafc' : '#18181b';

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <pattern id="screentone-${pageNum}" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1" fill="${isManhwa ? '#1e293b' : '#a1a1aa'}" />
      </pattern>
      <linearGradient id="glow-${pageNum}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${isManhwa ? '#38bdf8' : '#e4e4e7'}" />
        <stop offset="100%" stop-color="${isManhwa ? '#6366f1' : '#71717a'}" />
      </linearGradient>
    </defs>

    <rect width="${width}" height="${height}" fill="${bg}" />

    <!-- Header info Kindle/Manga style -->
    <text x="40" y="45" font-family="-apple-system, sans-serif" font-size="14" fill="${isManhwa ? '#94a3b8' : '#71717a'}" font-weight="600" letter-spacing="1">
      ${title.toUpperCase()} • ${chapter.toUpperCase()}
    </text>
    <text x="${width - 40}" y="45" text-anchor="end" font-family="-apple-system, sans-serif" font-size="14" fill="${isManhwa ? '#94a3b8' : '#71717a'}">
      PÁGINA ${pageNum} / ${total}
    </text>

    <!-- Main Panel 1 (Top) -->
    <rect x="40" y="70" width="${width - 80}" height="${height * 0.42}" rx="6" fill="${isManhwa ? 'url(#glow-' + pageNum + ')' : '#f4f4f5'}" stroke="${panelBorder}" stroke-width="3" />
    <rect x="40" y="70" width="${width - 80}" height="${height * 0.42}" rx="6" fill="url(#screentone-${pageNum})" opacity="0.4" />

    <!-- Panel 1 artwork / silhouettes -->
    <circle cx="${width * 0.5}" cy="${height * 0.28}" r="90" fill="${isManhwa ? '#0f172a' : '#18181b'}" opacity="0.85" />
    <path d="M ${width * 0.4} ${height * 0.32} L ${width * 0.5} ${height * 0.16} L ${width * 0.6} ${height * 0.32} Z" fill="${isManhwa ? '#38bdf8' : '#ffffff'}" />

    <!-- Dialogue Bubble 1 -->
    <rect x="70" y="100" width="280" height="70" rx="14" fill="#ffffff" stroke="#111" stroke-width="2" />
    <polygon points="120,170 140,195 150,170" fill="#ffffff" stroke="#111" stroke-width="2" />
    <polygon points="121,168 140,193 149,168" fill="#ffffff" />
    <text x="85" y="128" font-family="sans-serif" font-size="15" font-weight="700" fill="#111827">
      ${pageNum === 1 ? '¡¿Qué demonios es ese poder?!' : '¡No puedo rendirme ahora!'}
    </text>
    <text x="85" y="150" font-family="sans-serif" font-size="13" fill="#374151">
      ${pageNum === 1 ? '¡La energía está aumentando sin control!' : 'Todo mi entrenamiento me trajo hasta aquí.'}
    </text>

    <!-- Dynamic action lines -->
    <line x1="45" y1="75" x2="${width * 0.3}" y2="${height * 0.28}" stroke="${isManhwa ? '#38bdf8' : '#27272a'}" stroke-width="2" stroke-dasharray="8,6" opacity="0.6" />
    <line x1="${width - 45}" y1="75" x2="${width * 0.7}" y2="${height * 0.28}" stroke="${isManhwa ? '#818cf8' : '#27272a'}" stroke-width="2" stroke-dasharray="8,6" opacity="0.6" />

    <!-- SFX Onomatopoeia in Spanish -->
    <text x="${width * 0.72}" y="${height * 0.26}" font-family="Impact, sans-serif" font-size="44" fill="${isManhwa ? '#f43f5e' : '#18181b'}" transform="rotate(-12, ${width * 0.72}, ${height * 0.26})" stroke="${isManhwa ? '#ffffff' : '#ffffff'}" stroke-width="1.5">
      ${pageNum % 2 === 0 ? '¡¡BOOOOM!!' : '¡¡SWOOOSH!!'}
    </text>

    <!-- Panel 2 (Bottom Left) -->
    <rect x="40" y="${height * 0.52}" width="${(width - 100) * 0.55}" height="${height * 0.42}" rx="6" fill="${isManhwa ? '#1e293b' : '#fafafa'}" stroke="${panelBorder}" stroke-width="3" />
    
    <!-- Character profile box -->
    <rect x="65" y="${height * 0.55}" width="${(width - 100) * 0.55 - 50}" height="100" rx="8" fill="${isManhwa ? '#0f172a' : '#f4f4f5'}" stroke="${panelBorder}" stroke-width="1.5" />
    <text x="85" y="${height * 0.55 + 40}" font-family="sans-serif" font-size="16" font-weight="bold" fill="${ink}">
      [ ESTADO DEL SISTEMA ]
    </text>
    <text x="85" y="${height * 0.55 + 68}" font-family="monospace" font-size="13" fill="${isManhwa ? '#38bdf8' : '#52525b'}">
      Nivel: ${pageNum * 15}  |  Maná: ${pageNum * 240}/999
    </text>

    <!-- Narrative text in panel 2 -->
    <rect x="60" y="${height * 0.78}" width="${(width - 100) * 0.55 - 40}" height="75" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5" rx="4" />
    <text x="75" y="${height * 0.78 + 28}" font-family="sans-serif" font-size="13" font-style="italic" fill="#713f12">
      "En ese instante supe que el destino del reino
    </text>
    <text x="75" y="${height * 0.78 + 50}" font-family="sans-serif" font-size="13" font-style="italic" fill="#713f12">
      estaba en mis manos..."
    </text>

    <!-- Panel 3 (Bottom Right) -->
    <rect x="${(width - 100) * 0.55 + 60}" y="${height * 0.52}" width="${(width - 100) * 0.45}" height="${height * 0.42}" rx="6" fill="${isManhwa ? '#334155' : '#f4f4f5'}" stroke="${panelBorder}" stroke-width="3" />
    
    <!-- Face / Eye closeup art -->
    <ellipse cx="${(width - 100) * 0.55 + 60 + ((width - 100) * 0.225)}" cy="${height * 0.68}" rx="60" ry="35" fill="${isManhwa ? '#0284c7' : '#27272a'}" />
    <circle cx="${(width - 100) * 0.55 + 60 + ((width - 100) * 0.225)}" cy="${height * 0.68}" r="15" fill="#ffffff" />
    <circle cx="${(width - 100) * 0.55 + 60 + ((width - 100) * 0.225)}" cy="${height * 0.68}" r="7" fill="#000000" />

    <!-- Dialogue in Panel 3 -->
    <rect x="${(width - 100) * 0.55 + 75}" y="${height * 0.82}" width="${(width - 100) * 0.45 - 30}" height="55" rx="12" fill="#ffffff" stroke="#111" stroke-width="1.5" />
    <text x="${(width - 100) * 0.55 + 90}" y="${height * 0.82 + 32}" font-family="sans-serif" font-size="14" font-weight="bold" fill="#111827">
      — ¡¡DESPIERTA!!
    </text>

    <!-- Bottom Kindle Page Indicator -->
    <text x="${width / 2}" y="${height - 22}" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="13" fill="${isManhwa ? '#64748b' : '#a1a1aa'}">
      - ${pageNum} -
    </text>
  </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Generate realistic chapter pages
function createDemoChapterPages(title: string, chapterStr: string, count: number, type: 'manga' | 'manhwa'): string[] {
  const pages: string[] = [];
  for (let i = 1; i <= count; i++) {
    pages.push(generateMangaPageSvg(title, chapterStr, i, count, type));
  }
  return pages;
}

export const DEMO_MANGAS: Manga[] = [
  {
    id: 'solo-leveling',
    title: 'Solo Leveling',
    altTitle: 'Na Honjaman Rebeleop',
    author: 'Chugong',
    artist: 'DUBU (REDICE Studio)',
    coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    description: 'En un mundo donde cazadores con poderes mágicos deben luchar contra monstruos letales para proteger a la raza humana, Sung Jinwoo, el cazador más débil de la historia, encuentra una mazmorra oculta que cambiará su vida para siempre. [Traducción oficial al Español]',
    status: 'completed',
    type: 'manhwa',
    genres: ['Acción', 'Fantasía', 'Superpoderes', 'Monstruos', 'Webtoon'],
    chaptersCount: 179,
    source: 'demo',
    defaultReadingMode: 'webtoon-vertical',
    inLibrary: true,
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    lastReadAt: Date.now() - 1000 * 60 * 20,
    currentChapterId: 'sl-cap-1',
    currentPage: 3,
    totalPagesInCurrentChapter: 10,
    progressPercent: 30,
    downloaded: true,
  },
  {
    id: 'chainsaw-man',
    title: 'Chainsaw Man',
    altTitle: 'Hombre Motosierra',
    author: 'Tatsuki Fujimoto',
    artist: 'Tatsuki Fujimoto',
    coverUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    description: 'Denji es un joven que vive sumido en la pobreza extrema, pagando la colosal deuda de su difunto padre trabajando como cazador de demonios junto a Pochita, el demonio motosierra. Tras una trágica traición, renace como un híbrido letal. [Manga en Español]',
    status: 'ongoing',
    type: 'manga',
    genres: ['Acción', 'Sobrenatural', 'Terror', 'Comedia Negra', 'Shonen'],
    chaptersCount: 165,
    source: 'demo',
    defaultReadingMode: 'manga-rtl',
    inLibrary: true,
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    lastReadAt: Date.now() - 1000 * 60 * 120,
    currentChapterId: 'csm-cap-1',
    currentPage: 5,
    totalPagesInCurrentChapter: 12,
    progressPercent: 42,
    downloaded: true,
  },
  {
    id: 'frieren',
    title: 'Frieren: Más allá del final del viaje',
    altTitle: 'Sousou no Frieren',
    author: 'Kanehito Yamada',
    artist: 'Tsukasa Abe',
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    description: 'La maga elfa Frieren y sus valientes compañeros han derrotado al Rey Demonio y traído la paz a las tierras. Sin embargo, para una elfa milenaria, el tiempo fluye de manera distinta. Comienza un conmovedor viaje tras la despedida de sus camaradas humanos. [Español]',
    status: 'ongoing',
    type: 'manga',
    genres: ['Fantasía', 'Aventura', 'Drama', 'Recuentos de vida', 'Shonen'],
    chaptersCount: 130,
    source: 'demo',
    defaultReadingMode: 'manga-rtl',
    inLibrary: true,
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    lastReadAt: Date.now() - 1000 * 60 * 60 * 5,
    currentChapterId: 'fri-cap-1',
    currentPage: 1,
    totalPagesInCurrentChapter: 8,
    progressPercent: 12,
    downloaded: false,
  },
  {
    id: 'tower-of-god',
    title: 'Torre de Dios (Tower of God)',
    altTitle: 'Sin-ui Tap',
    author: 'SIU',
    artist: 'SIU',
    coverUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    description: '¿Qué es lo que más deseas? ¿Dinero y riquezas? ¿Gloria y honor? ¿Poder e influencia? ¿Venganza? ¿O algo que trascienda todo eso? Lo que sea que desees, está aquí, en lo más alto de la Torre. Acompaña a Bam en su ascenso vertical. [Manhwa a color en Español]',
    status: 'ongoing',
    type: 'manhwa',
    genres: ['Fantasía', 'Misterio', 'Aventura', 'Superpoderes', 'Webtoon'],
    chaptersCount: 590,
    source: 'demo',
    defaultReadingMode: 'webtoon-vertical',
    inLibrary: true,
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    lastReadAt: Date.now() - 1000 * 60 * 60 * 30,
    currentChapterId: 'tog-cap-1',
    currentPage: 2,
    totalPagesInCurrentChapter: 9,
    progressPercent: 22,
    downloaded: true,
  },
  {
    id: 'berserk',
    title: 'Berserk',
    altTitle: 'Espadachín Negro',
    author: 'Kentaro Miura',
    artist: 'Studio Gaga',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'Guts, conocido como el Espadachín Negro, busca refugio de las fuerzas demoníacas atraídas hacia él debido a una marca demoníaca grabada en su cuello, y venganza contra Griffith, el hombre al que una vez consideró su hermano de armas. Obra maestra del dark fantasy. [Español]',
    status: 'ongoing',
    type: 'manga',
    genres: ['Fantasía Oscura', 'Acción', 'Tragedia', 'Seinen', 'Épico'],
    chaptersCount: 375,
    source: 'demo',
    defaultReadingMode: 'manga-rtl',
    inLibrary: false,
    addedAt: Date.now() - 1000 * 60 * 60 * 48,
    downloaded: false,
  },
  {
    id: 'omniscient-reader',
    title: 'Punto de Vista del Lector Omnisciente',
    altTitle: 'Omniscient Reader\'s Viewpoint',
    author: 'sing N song',
    artist: 'Sleepy-C (REDICE Studio)',
    coverUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80',
    description: 'Dokja era un empleado de oficina promedio cuyo único pasatiempo era leer su novela web favorita: "Tres maneras de sobrevivir en un mundo en ruinas". Pero de repente, el mundo real se transforma en la novela y solo él conoce el desenlace de la historia. [Manhwa Español]',
    status: 'ongoing',
    type: 'manhwa',
    genres: ['Acción', 'Apocalipsis', 'Fantasía', 'Supervivencia', 'Webtoon'],
    chaptersCount: 210,
    source: 'demo',
    defaultReadingMode: 'webtoon-vertical',
    inLibrary: false,
    addedAt: Date.now() - 1000 * 60 * 60 * 12,
    downloaded: false,
  }
];

export const DEMO_CHAPTERS: Record<string, Chapter[]> = {
  'solo-leveling': [
    {
      id: 'sl-cap-1',
      mangaId: 'solo-leveling',
      chapterNumber: '1',
      title: 'Capítulo 1: La Mazmorra Doble',
      language: 'es',
      pagesCount: 10,
      publishDate: '2024-01-15',
      scanlationGroup: 'Scan Latino Fansub',
      pages: createDemoChapterPages('Solo Leveling', 'Capítulo 1', 10, 'manhwa')
    },
    {
      id: 'sl-cap-2',
      mangaId: 'solo-leveling',
      chapterNumber: '2',
      title: 'Capítulo 2: El Despertar del Monarca',
      language: 'es',
      pagesCount: 8,
      publishDate: '2024-01-22',
      scanlationGroup: 'Scan Latino Fansub',
      pages: createDemoChapterPages('Solo Leveling', 'Capítulo 2', 8, 'manhwa')
    },
    {
      id: 'sl-cap-3',
      mangaId: 'solo-leveling',
      chapterNumber: '3',
      title: 'Capítulo 3: Misión Diaria de Entrenamiento',
      language: 'es',
      pagesCount: 9,
      publishDate: '2024-01-29',
      scanlationGroup: 'Scan Latino Fansub',
      pages: createDemoChapterPages('Solo Leveling', 'Capítulo 3', 9, 'manhwa')
    }
  ],
  'chainsaw-man': [
    {
      id: 'csm-cap-1',
      mangaId: 'chainsaw-man',
      chapterNumber: '1',
      title: 'Capítulo 1: Perro y Motosierra',
      language: 'es',
      pagesCount: 12,
      publishDate: '2024-02-01',
      scanlationGroup: 'MangaPlus Oficial',
      pages: createDemoChapterPages('Chainsaw Man', 'Capítulo 1', 12, 'manga')
    },
    {
      id: 'csm-cap-2',
      mangaId: 'chainsaw-man',
      chapterNumber: '2',
      title: 'Capítulo 2: El Demonio Zombie',
      language: 'es',
      pagesCount: 10,
      publishDate: '2024-02-08',
      scanlationGroup: 'MangaPlus Oficial',
      pages: createDemoChapterPages('Chainsaw Man', 'Capítulo 2', 10, 'manga')
    }
  ],
  'frieren': [
    {
      id: 'fri-cap-1',
      mangaId: 'frieren',
      chapterNumber: '1',
      title: 'Capítulo 1: El Fin de la Aventura',
      language: 'es',
      pagesCount: 8,
      publishDate: '2024-02-10',
      scanlationGroup: 'Ganso Traducciones',
      pages: createDemoChapterPages('Sousou no Frieren', 'Capítulo 1', 8, 'manga')
    }
  ],
  'tower-of-god': [
    {
      id: 'tog-cap-1',
      mangaId: 'tower-of-god',
      chapterNumber: '1',
      title: 'Capítulo 1: Piso 1 - La Prueba de Headon',
      language: 'es',
      pagesCount: 9,
      publishDate: '2024-01-10',
      scanlationGroup: 'Webtoon Oficial ES',
      pages: createDemoChapterPages('Torre de Dios', 'Capítulo 1', 9, 'manhwa')
    }
  ],
  'berserk': [
    {
      id: 'ber-cap-1',
      mangaId: 'berserk',
      chapterNumber: '1',
      title: 'Capítulo 1: El Espadachín Negro',
      language: 'es',
      pagesCount: 10,
      publishDate: '2024-01-05',
      scanlationGroup: 'Hawk Scan',
      pages: createDemoChapterPages('Berserk', 'Capítulo 1', 10, 'manga')
    }
  ],
  'omniscient-reader': [
    {
      id: 'orv-cap-1',
      mangaId: 'omniscient-reader',
      chapterNumber: '1',
      title: 'Capítulo 1: Inicio del Servicio de Pago',
      language: 'es',
      pagesCount: 9,
      publishDate: '2024-01-18',
      scanlationGroup: 'Flaming Scans',
      pages: createDemoChapterPages('Omniscient Reader', 'Capítulo 1', 9, 'manhwa')
    }
  ]
};
