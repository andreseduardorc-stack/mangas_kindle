import React from 'react';
import {
  Plane,
  RotateCw,
  Sun,
  Flame,
  Moon,
  Sparkles,
  X,
  BookOpen,
} from 'lucide-react';
import type { KindleSystemSettings, ReaderSettings } from '../types';

interface KindleQuickSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  systemSettings: KindleSystemSettings;
  onUpdateSystemSettings: (updated: Partial<KindleSystemSettings>) => void;
  readerSettings: ReaderSettings;
  onUpdateReaderSettings: (updated: Partial<ReaderSettings>) => void;
}

export const KindleQuickSettingsDrawer: React.FC<KindleQuickSettingsDrawerProps> = ({
  isOpen,
  onClose,
  systemSettings,
  onUpdateSystemSettings,
  readerSettings,
  onUpdateReaderSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-start items-center bg-black/40 backdrop-blur-[2px]">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-[#f8f6f0] border-b-2 border-x border-[#cfc9b8] shadow-2xl rounded-b-2xl p-6 transition-all duration-300 font-serif text-[#1e1d1b]">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e2ddd0]">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#2c2b29]" />
            <h2 className="text-lg font-bold tracking-tight">Ajustes Rápidos de Kindle</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#eae5d8] transition-colors"
            title="Cerrar panel"
          >
            <X className="w-5 h-5 text-[#4a4740]" />
          </button>
        </div>

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-4 gap-3 my-4">
          {/* Airplane mode */}
          <button
            onClick={() =>
              onUpdateSystemSettings({ airplaneMode: !systemSettings.airplaneMode })
            }
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
              systemSettings.airplaneMode
                ? 'bg-[#2c2b29] text-white border-[#2c2b29]'
                : 'bg-[#eeebd9] text-[#2c2b29] border-[#d8d2be] hover:bg-[#e4dfcd]'
            }`}
          >
            <Plane className="w-5 h-5 mb-1.5" />
            <span className="text-[11px] font-sans font-medium">Modo Avión</span>
            <span className="text-[9px] opacity-75 font-sans mt-0.5">
              {systemSettings.airplaneMode ? 'Activado' : 'Desactivado'}
            </span>
          </button>

          {/* Sync */}
          <button
            onClick={() => {
              onUpdateSystemSettings({
                deviceSyncTime:
                  'Sincronizado a las ' +
                  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              });
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl border bg-[#eeebd9] text-[#2c2b29] border-[#d8d2be] hover:bg-[#e4dfcd] transition-all"
          >
            <RotateCw className="w-5 h-5 mb-1.5 text-[#2c2b29]" />
            <span className="text-[11px] font-sans font-medium">Sincronizar</span>
            <span className="text-[9px] text-[#6b675e] font-sans mt-0.5">Mis Mangas</span>
          </button>

          {/* Dark / Invert mode */}
          <button
            onClick={() =>
              onUpdateReaderSettings({
                theme: readerSettings.theme === 'dark' ? 'paperwhite' : 'dark',
              })
            }
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
              readerSettings.theme === 'dark'
                ? 'bg-[#2c2b29] text-white border-[#2c2b29]'
                : 'bg-[#eeebd9] text-[#2c2b29] border-[#d8d2be] hover:bg-[#e4dfcd]'
            }`}
          >
            <Moon className="w-5 h-5 mb-1.5" />
            <span className="text-[11px] font-sans font-medium">Modo Noche</span>
            <span className="text-[9px] opacity-75 font-sans mt-0.5">
              {readerSettings.theme === 'dark' ? 'Invertido' : 'Normal'}
            </span>
          </button>

          {/* E-Ink Paper High Contrast */}
          <button
            onClick={() =>
              onUpdateReaderSettings({
                theme: readerSettings.theme === 'eink' ? 'paperwhite' : 'eink',
                eInkFilter: !readerSettings.eInkFilter,
              })
            }
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
              readerSettings.theme === 'eink'
                ? 'bg-[#2c2b29] text-white border-[#2c2b29]'
                : 'bg-[#eeebd9] text-[#2c2b29] border-[#d8d2be] hover:bg-[#e4dfcd]'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-1.5" />
            <span className="text-[11px] font-sans font-medium">Tinta E-Ink</span>
            <span className="text-[9px] opacity-75 font-sans mt-0.5">Alto contraste</span>
          </button>
        </div>

        {/* Sliders: Brightness & Warmth */}
        <div className="space-y-4 pt-2">
          {/* Brightness */}
          <div>
            <div className="flex items-center justify-between text-xs font-sans font-medium mb-1.5 text-[#4a4740]">
              <span className="flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-[#2c2b29]" />
                Brillo de pantalla
              </span>
              <span>{readerSettings.brightness}%</span>
            </div>
            <div className="flex items-center space-x-3">
              <Sun className="w-3.5 h-3.5 text-[#8f8a7e]" />
              <input
                type="range"
                min="30"
                max="100"
                value={readerSettings.brightness}
                onChange={(e) =>
                  onUpdateReaderSettings({ brightness: Number(e.target.value) })
                }
                className="w-full h-2 bg-[#dcd7cb] rounded-lg appearance-none cursor-pointer accent-[#2c2b29]"
              />
              <Sun className="w-5 h-5 text-[#2c2b29]" />
            </div>
          </div>

          {/* Warmth (Luz Cálida Kindle) */}
          <div>
            <div className="flex items-center justify-between text-xs font-sans font-medium mb-1.5 text-[#4a4740]">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#c26217]" />
                Luz Cálida (Tono Ámbar/Sepia)
              </span>
              <span>{readerSettings.warmth}%</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8f8a7e]">Fría</span>
              <input
                type="range"
                min="0"
                max="80"
                value={readerSettings.warmth}
                onChange={(e) =>
                  onUpdateReaderSettings({ warmth: Number(e.target.value) })
                }
                className="w-full h-2 bg-[#dcd7cb] rounded-lg appearance-none cursor-pointer accent-[#b45309]"
              />
              <span className="text-xs font-sans font-bold text-[#b45309]">Cálida</span>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="mt-5 pt-3 border-t border-[#e2ddd0] flex items-center justify-between text-[11px] font-sans text-[#78746a]">
          <span>{systemSettings.deviceSyncTime}</span>
          <span>Batería: {systemSettings.battery}% • Memoria: 8.2 GB libres</span>
        </div>
      </div>
    </div>
  );
};
