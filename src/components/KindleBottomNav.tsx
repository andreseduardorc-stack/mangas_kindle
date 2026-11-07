import React from 'react';
import { Home, Library, Compass, UploadCloud } from 'lucide-react';

export type TabType = 'home' | 'library' | 'discover' | 'import';

interface KindleBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  libraryCount: number;
}

export const KindleBottomNav: React.FC<KindleBottomNavProps> = ({
  activeTab,
  onTabChange,
  libraryCount,
}) => {
  const tabs = [
    {
      id: 'home' as TabType,
      label: 'Inicio',
      icon: Home,
    },
    {
      id: 'library' as TabType,
      label: `Biblioteca (${libraryCount})`,
      icon: Library,
    },
    {
      id: 'discover' as TabType,
      label: 'Descubrir (ES)',
      icon: Compass,
    },
    {
      id: 'import' as TabType,
      label: 'Importar CBZ',
      icon: UploadCloud,
    },
  ];

  return (
    <nav className="w-full bg-[#f4f2ec] border-t border-[#ded9cb] px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center transition-all ${
              isActive
                ? 'text-[#1a1918] font-bold'
                : 'text-[#6c685e] hover:text-[#2c2b29] font-normal'
            }`}
          >
            <div
              className={`p-1 rounded-full transition-colors ${
                isActive ? 'bg-[#e2ddd0]' : 'hover:bg-[#eae5d8]'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.3 : 1.8} />
            </div>
            <span className="text-[11px] font-sans mt-0.5 tracking-tight">{tab.label}</span>
            {isActive && <div className="w-6 h-0.5 bg-[#2c2b29] rounded-full mt-0.5" />}
          </button>
        );
      })}
    </nav>
  );
};

