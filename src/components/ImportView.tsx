import React, { useState, useRef } from 'react';
import { UploadCloud, FileArchive, CheckCircle2, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import type { Manga, Chapter } from '../types';
import { processCbzOrZipFile } from '../services/localFileManager';

interface ImportViewProps {
  onImportSuccess: (manga: Manga, chapter: Chapter) => void;
  onOpenReader: (manga: Manga, chapter: Chapter) => void;
}

export const ImportView: React.FC<ImportViewProps> = ({
  onImportSuccess,
  onOpenReader,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importedItem, setImportedItem] = useState<{ manga: Manga; chapter: Chapter } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      setStatusMessage(`Descomprimiendo y procesando "${file.name}"...`);
      const result = await processCbzOrZipFile(file);
      onImportSuccess(result.manga, result.chapter);
      setImportedItem(result);
      setStatusMessage(`¡"${result.manga.title}" se importó exitosamente con ${result.chapter.pagesCount} páginas!`);
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el archivo. Asegúrate de que sea un .cbz o .zip válido con imágenes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 text-[#1f1e1c]">
      <div className="pb-4 border-b border-[#ded8c7] mb-6">
        <h1 className="text-2xl font-serif font-black tracking-tight text-[#1a1918]">
          Importar Mangas y Cómics Locales
        </h1>
        <p className="text-xs text-[#635f56] font-sans mt-0.5">
          Agrega archivos .CBZ, .ZIP o carpetas desde tu computadora para leerlos con la interfaz Kindle
        </p>
      </div>

      {/* Drag & Drop Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#1a1918] bg-[#ebe6d8]'
            : 'border-[#cfc8b5] bg-[#f7f4ed] hover:bg-[#f1ece0] hover:border-[#a8a18e]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".cbz,.zip,.cbr"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="w-16 h-16 rounded-full bg-[#eae4d5] flex items-center justify-center mx-auto mb-4 text-[#2c2b29]">
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>

        <h3 className="font-serif font-bold text-lg text-[#1a1918] mb-1">
          Arrastra tu archivo .CBZ o .ZIP aquí
        </h3>
        <p className="text-xs font-sans text-[#635f56] max-w-md mx-auto mb-4 leading-relaxed">
          O haz clic para seleccionar un archivo desde tu explorador de Windows. Las imágenes serán ordenadas y optimizadas instantáneamente en tu navegador.
        </p>

        <button
          type="button"
          className="bg-[#2c2b29] text-white px-5 py-2.5 rounded-xl text-xs font-sans font-bold hover:bg-[#1a1918] transition-colors shadow-xs"
        >
          Seleccionar archivo desde el equipo
        </button>
      </div>

      {/* Progress / Status notifications */}
      {statusMessage && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center space-x-3 text-xs font-sans">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">{statusMessage}</p>
          </div>
          {importedItem && (
            <button
              onClick={() => onOpenReader(importedItem.manga, importedItem.chapter)}
              className="bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-sans font-semibold hover:bg-emerald-900 transition-colors shrink-0"
            >
              Comenzar a leer ahora
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-900 rounded-xl flex items-center space-x-3 text-xs font-sans">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Features checklist */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#f2efe6] border border-[#ded8c7] rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-1.5">
            <FileArchive className="w-4 h-4 text-[#2c2b29]" />
            <h4 className="font-serif font-bold text-sm text-[#1a1918]">Formato .CBZ / .ZIP</h4>
          </div>
          <p className="text-xs text-[#635f56] font-sans">
            Compatible con la mayoría de cómics y tomos descargados en JPG, PNG o WebP.
          </p>
        </div>

        <div className="bg-[#f2efe6] border border-[#ded8c7] rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#2c2b29]" />
            <h4 className="font-serif font-bold text-sm text-[#1a1918]">100% Privado y Offline</h4>
          </div>
          <p className="text-xs text-[#635f56] font-sans">
            Tus archivos no se envían a ningún servidor externo. Todo se procesa localmente en tu memoria.
          </p>
        </div>

        <div className="bg-[#f2efe6] border border-[#ded8c7] rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-1.5">
            <BookOpen className="w-4 h-4 text-[#2c2b29]" />
            <h4 className="font-serif font-bold text-sm text-[#1a1918]">Experiencia Kindle</h4>
          </div>
          <p className="text-xs text-[#635f56] font-sans">
            Guarda automáticamente tu punto de lectura exacto y marcadores favoritos.
          </p>
        </div>
      </div>
    </div>
  );
};
