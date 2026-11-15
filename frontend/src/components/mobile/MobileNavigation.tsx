import React from 'react';
import { Home, Search, Library, ListMusic, Download } from 'lucide-react';
import { NavTab } from '../Sidebar';

interface MobileNavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'search' as NavTab, label: 'Search', icon: Search },
    { id: 'library' as NavTab, label: 'Library', icon: Library },
    { id: 'playlists' as NavTab, label: 'Playlists', icon: ListMusic },
    { id: 'downloads' as NavTab, label: 'Downloads', icon: Download },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-m3-surface/90 backdrop-blur-2xl border-t border-m3-outline-variant/30 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-1 relative min-h-[48px] touch-manipulation group active:scale-95 transition-transform"
            >
              {/* Active Pill Indicator */}
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? 'bg-m3-primary/15 text-m3-primary shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'scale-100 stroke-[1.75]'
                  }`}
                />
              </div>

              {/* Tab Label */}
              <span
                className={`text-[10px] tracking-tight font-medium mt-1 transition-colors duration-200 ${
                  isActive ? 'text-m3-primary font-bold' : 'text-m3-on-surface-variant/80'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
