import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Sliders, ChevronDown } from 'lucide-react';
import type { KindleSystemSettings } from '../types';

interface KindleStatusBarProps {
  settings: KindleSystemSettings;
  onToggleDrawer: () => void;
  isDrawerOpen: boolean;
}

export const KindleStatusBar: React.FC<KindleStatusBarProps> = ({
  settings,
  onToggleDrawer,
  isDrawerOpen,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-[#f4f2ec] text-[#2c2b29] border-b border-[#ded9cb] px-4 pt-[max(0.35rem,env(safe-area-inset-top))] pb-1.5 flex items-center justify-between text-xs font-serif select-none transition-colors">
      <div className="flex items-center space-x-2">
        <span className="font-semibold tracking-wide text-sm">{timeStr}</span>
        {settings.airplaneMode && (
          <span className="bg-[#2c2b29] text-white text-[10px] px-1.5 py-0.5 rounded font-sans">
            MODO AVIÓN
          </span>
        )}
      </div>

      {/* Center drop handle */}
      <button
        onClick={onToggleDrawer}
        title="Ajustes rápidos de Kindle"
        className="flex items-center space-x-1 px-3 py-0.5 rounded-full hover:bg-[#eae5d8] transition-colors border border-transparent hover:border-[#cfc9b8]"
      >
        <span className="font-sans font-medium text-[11px] text-[#55524c]">Ajustes rápidos</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#55524c] transition-transform duration-200 ${
            isDrawerOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Right status: Wi-Fi, battery */}
      <div className="flex items-center space-x-3 text-[#3d3b37]">
        {settings.airplaneMode || !settings.wifiEnabled ? (
          <WifiOff className="w-3.5 h-3.5 text-[#88857e]" />
        ) : (
          <Wifi className="w-3.5 h-3.5" />
        )}

        <div className="flex items-center space-x-1 font-sans text-[11px]">
          <span>{settings.battery}%</span>
          <div className="relative w-5 h-2.5 border border-[#3d3b37] rounded-xs p-0.5 flex items-center">
            <div
              className="bg-[#2c2b29] h-full rounded-xs transition-all"
              style={{ width: `${Math.min(100, Math.max(10, settings.battery))}%` }}
            />
            <div className="absolute -right-1 top-0.5 w-0.5 h-1.5 bg-[#3d3b37] rounded-r-xs" />
          </div>
        </div>

        <button
          onClick={onToggleDrawer}
          className="p-1 hover:bg-[#eae5d8] rounded transition-colors"
          title="Menú del sistema"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
