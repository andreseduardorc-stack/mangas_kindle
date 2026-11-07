import JSZip from 'jszip';
import type { Manga, Chapter } from '../types';

export async function processCbzOrZipFile(file: File): Promise<{ manga: Manga; chapter: Chapter }> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const imageEntries: { name: string; entry: JSZip.JSZipObject }[] = [];
  const imageRegex = /\.(jpe?g|png|webp|avif|gif)$/i;

  loadedZip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && imageRegex.test(relativePath)) {
      imageEntries.push({ name: relativePath, entry: zipEntry });
    }
  });

  if (imageEntries.length === 0) {
    throw new Error('No se encontraron imágenes válidas dentro del archivo .cbz o .zip.');
  }

  // Sort naturally so 1.jpg, 2.jpg, 10.jpg are in order
  imageEntries.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );

  const pageUrls: string[] = [];
  for (const item of imageEntries) {
    const blob = await item.entry.async('blob');
    const objectUrl = URL.createObjectURL(blob);
    pageUrls.push(objectUrl);
  }

  // Generate ID and Name
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const mangaId = `local-${Date.now()}`;
  const chapterId = `local-ch-${Date.now()}`;

  const manga: Manga = {
    id: mangaId,
    title: baseName,
    author: 'Archivo Local',
    coverUrl: pageUrls[0], // First page as cover!
    description: `Manga importado desde archivo local: ${file.name} (${imageEntries.length} páginas).`,
    status: 'completed',
    type: 'manga',
    genres: ['Local', 'CBZ / Cómic'],
    chaptersCount: 1,
    isLocal: true,
    source: 'local',
    defaultReadingMode: 'manga-rtl',
    inLibrary: true,
    addedAt: Date.now(),
    currentChapterId: chapterId,
    currentPage: 1,
    totalPagesInCurrentChapter: pageUrls.length,
    progressPercent: 0,
    downloaded: true,
  };

  const chapter: Chapter = {
    id: chapterId,
    mangaId,
    chapterNumber: '1',
    title: baseName,
    language: 'es',
    pagesCount: pageUrls.length,
    pages: pageUrls,
    publishDate: new Date().toISOString().split('T')[0],
    scanlationGroup: 'Lectura Local',
  };

  return { manga, chapter };
}
