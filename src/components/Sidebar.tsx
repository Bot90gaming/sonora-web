import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { 
  Home, 
  Search, 
  Library, 
  ListMusic, 
  Heart, 
  Download, 
  Radio, 
  Sparkles,
  Waves,
  Music2,
  Check,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { AuthStatus } from '../types';

export type NavTab = 'home' | 'search' | 'library' | 'playlists' | 'liked' | 'downloads';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAuth?: () => void;
  authStatus?: AuthStatus;
}

interface NavItemDef {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: 'discover' | 'collection';
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onOpenAuth, authStatus }) => {
  const { likedTracks, downloads, isStationMode, toggleStationMode } = usePlayer();

  const activeDownloadsCount = downloads.filter((d) => d.status === 'downloading').length;
  const totalDownloadsCount = downloads.length;
  const likedCount = likedTracks.length;

  // Pulse animations when badge counts update
  const [likedPulsing, setLikedPulsing] = useState(false);
  const prevLikedCount = useRef(likedCount);
  useEffect(() => {
    if (prevLikedCount.current !== likedCount) {
      prevLikedCount.current = likedCount;
      setLikedPulsing(true);
      const timer = setTimeout(() => setLikedPulsing(false), 800);
      return () => clearTimeout(timer);
    }
  }, [likedCount]);

  const [downloadsPulsing, setDownloadsPulsing] = useState(false);
  const prevDownloadsCount = useRef(activeDownloadsCount);
  useEffect(() => {
    if (prevDownloadsCount.current !== activeDownloadsCount) {
      prevDownloadsCount.current = activeDownloadsCount;
      setDownloadsPulsing(true);
      const timer = setTimeout(() => setDownloadsPulsing(false), 800);
      return () => clearTimeout(timer);
    }
  }, [activeDownloadsCount]);

  // Navigation Items definition
  const navItems: NavItemDef[] = [
    { id: 'home', label: 'Discover', icon: Home, section: 'discover' },
    { id: 'search', label: 'Search', icon: Search, section: 'discover' },
    { id: 'library', label: 'Library', icon: Library, section: 'collection' },
    { id: 'playlists', label: 'Playlists', icon: ListMusic, section: 'collection' },
    { id: 'liked', label: 'Liked Songs', icon: Heart, section: 'collection' },
    { id: 'downloads', label: 'Downloads', icon: Download, section: 'collection' },
  ];

  // Animated sliding pill indicator state and refs
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{
    top: number;
    height: number;
    ready: boolean;
  }>({
    top: 0,
    height: 44,
    ready: false,
  });

  const updateIndicator = useCallback(() => {
    const activeEl = itemRefs.current[currentTab];
    if (activeEl) {
      setIndicatorStyle({
        top: activeEl.offsetTop,
        height: activeEl.offsetHeight,
        ready: true,
      });
    }
  }, [currentTab]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    updateIndicator();
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  // Initial delay ticks to ensure font load & dynamic layout measurement accuracy
  useEffect(() => {
    const t1 = setTimeout(updateIndicator, 30);
    const t2 = setTimeout(updateIndicator, 120);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [updateIndicator]);

  return (
    <aside className="w-64 h-full flex flex-col border-r border-m3-outline-variant/15 bg-m3-surface-container-lowest/80 dark:bg-[#090D16]/90 backdrop-blur-xl select-none shrink-0 relative z-20 transition-all duration-300">
      
      {/* Brand Logo & Name with subtle ambient hover glow */}
      <div 
        onClick={() => onSelectTab('home')}
        className="group relative cursor-pointer px-5 py-4 flex items-center gap-3.5 border-b border-m3-outline-variant/15 overflow-hidden transition-all duration-300 hover:bg-m3-surface-container/30"
      >
        {/* Ambient radial glow backdrop */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

        {/* Logo Badge */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 p-[1.5px] shadow-lg shadow-blue-500/25 group-hover:shadow-[0_0_24px_rgba(59,130,246,0.55)] group-hover:scale-105 transition-all duration-300 flex items-center justify-center relative">
          <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-blue-700/80 to-indigo-900/90 flex items-center justify-center relative overflow-hidden">
            {/* Ambient gloss sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Waves className="w-5 h-5 text-white/95 group-hover:text-white transition-colors" />
            {/* Sparkle badge */}
            <Sparkles className="w-2.5 h-2.5 text-cyan-300 absolute top-1 right-1 animate-pulse" />
          </div>
        </div>

        {/* Brand Text */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg tracking-wider bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-cyan-300 transition-colors duration-300">
              SONORA
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-500 dark:text-blue-400 border border-blue-500/25 uppercase tracking-wide">
              Web
            </span>
          </div>
          <span className="text-[10px] tracking-widest uppercase font-semibold text-m3-on-surface-variant/70 flex items-center gap-1">
            Music Reimagined
          </span>
        </div>
      </div>

      {/* Main Navigation rail with animated sliding pill */}
      <div 
        ref={navContainerRef}
        className="flex-1 px-3 py-3 overflow-y-auto relative scrollbar-none"
      >
        {/* Animated Active Tab Indicator Pill - anchored at top-0 left-3 right-3 with exact offsetTop */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-3 right-3 rounded-2xl pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] bg-gradient-to-r from-blue-600/15 via-indigo-600/20 to-purple-600/15 dark:from-blue-500/20 dark:via-indigo-500/25 dark:to-purple-500/20 border border-blue-500/30 dark:border-blue-400/40 shadow-sm shadow-blue-500/10"
          style={{
            transform: `translate3d(0, ${indicatorStyle.top}px, 0)`,
            height: `${indicatorStyle.height}px`,
            opacity: indicatorStyle.ready ? 1 : 0,
          }}
        >
          {/* Subtle glowing left vertical accent bar */}
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.85)]" />
        </div>

        {/* Section 1: Discover */}
        <div className="mb-4">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-m3-on-surface-variant/60 flex items-center gap-1.5">
            <span>Discover</span>
          </div>
          <div className="space-y-1">
            {navItems
              .filter((item) => item.section === 'discover')
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    ref={(el) => (itemRefs.current[item.id] = el)}
                    onClick={() => onSelectTab(item.id)}
                    className={`relative z-10 w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150 group ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container/40 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Fallback inline active pill before sliding measurement is ready */}
                    {isActive && !indicatorStyle.ready && (
                      <div 
                        aria-hidden="true"
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/15 via-indigo-600/20 to-purple-600/15 dark:from-blue-500/20 dark:via-indigo-500/25 dark:to-purple-500/20 border border-blue-500/30 dark:border-blue-400/40 -z-10"
                      >
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.85)]" />
                      </div>
                    )}

                    <div className="flex items-center gap-3.5">
                      <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-blue-500 dark:text-blue-400' : 'text-inherit opacity-85'
                      }`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Section Divider */}
        <div className="h-px bg-m3-outline-variant/15 mx-2 my-2" />

        {/* Section 2: Your Collection */}
        <div className="mt-2">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-m3-on-surface-variant/60 flex items-center gap-1.5">
            <Music2 className="w-3 h-3 text-m3-on-surface-variant/60" />
            <span>Your Collection</span>
          </div>
          <div className="space-y-1">
            {navItems
              .filter((item) => item.section === 'collection')
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isLikedItem = item.id === 'liked';
                const isDownloadsItem = item.id === 'downloads';

                return (
                  <button
                    key={item.id}
                    ref={(el) => (itemRefs.current[item.id] = el)}
                    onClick={() => onSelectTab(item.id)}
                    className={`relative z-10 w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150 group ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container/40 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Fallback inline active pill before sliding measurement is ready */}
                    {isActive && !indicatorStyle.ready && (
                      <div 
                        aria-hidden="true"
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/15 via-indigo-600/20 to-purple-600/15 dark:from-blue-500/20 dark:via-indigo-500/25 dark:to-purple-500/20 border border-blue-500/30 dark:border-blue-400/40 -z-10"
                      >
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.85)]" />
                      </div>
                    )}

                    <div className="flex items-center gap-3.5">
                      <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-blue-500 dark:text-blue-400' : 'text-inherit opacity-85'
                      }`} />
                      <span>{item.label}</span>
                    </div>

                    {/* Liked Songs Counter Badge with Pulse */}
                    {isLikedItem && likedCount > 0 && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-all duration-300 flex items-center gap-1 ${
                          likedPulsing
                            ? 'bg-rose-500 text-white scale-110 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
                            : isActive
                            ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30'
                            : 'bg-m3-surface-container-high/80 text-m3-on-surface-variant/90 border border-m3-outline-variant/20'
                        }`}
                      >
                        <Heart className={`w-2.5 h-2.5 fill-current ${likedPulsing ? 'animate-ping' : ''}`} />
                        <span>{likedCount}</span>
                      </span>
                    )}

                    {/* Downloads Counter Badge with Pulse / Progress */}
                    {isDownloadsItem && activeDownloadsCount > 0 && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-all duration-300 flex items-center gap-1.5 bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] ${
                          downloadsPulsing ? 'scale-110' : ''
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>{activeDownloadsCount}</span>
                      </span>
                    )}

                    {isDownloadsItem && activeDownloadsCount === 0 && totalDownloadsCount > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-m3-surface-container-high/70 text-m3-on-surface-variant/80 border border-m3-outline-variant/20">
                        {totalDownloadsCount}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* YouTube Music Account / Sign-In Quick Card */}
      {onOpenAuth && (
        <div className="px-3 pt-2">
          {authStatus?.authenticated ? (
            <div
              onClick={onOpenAuth}
              className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 cursor-pointer transition-all duration-200 flex items-center justify-between group shadow-xs select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-m3-on-surface truncate group-hover:text-emerald-400 transition-colors">
                    YouTube Connected
                  </p>
                  <p className="text-[10px] text-emerald-400 font-medium truncate">
                    Library Sync Active
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                Manage
              </span>
            </div>
          ) : (
            <div
              onClick={onOpenAuth}
              className="p-3 rounded-2xl bg-gradient-to-r from-red-600/15 via-red-500/10 to-transparent hover:from-red-600/20 hover:to-red-500/15 border border-red-500/25 cursor-pointer transition-all duration-200 flex items-center justify-between group shadow-xs select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-m3-on-surface truncate group-hover:text-red-400 transition-colors">
                    YouTube Sign In
                  </p>
                  <p className="text-[10px] text-m3-on-surface-variant truncate">
                    Sync your library
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 font-bold uppercase tracking-wider group-hover:bg-red-600/30 transition-colors">
                Connect
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sonora Station Mode Toggle Card with Glowing Active Soundwave Badge */}
      <div className="p-3">
        <div
          className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden backdrop-blur-md ${
            isStationMode
              ? 'bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-500/35 dark:border-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
              : 'bg-m3-surface-container/50 hover:bg-m3-surface-container/80 border-m3-outline-variant/20'
          }`}
        >
          {/* Active ambient glow */}
          {isStationMode && (
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
          )}

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Radio className={`w-4 h-4 transition-colors duration-300 ${
                  isStationMode ? 'text-blue-500 dark:text-blue-400' : 'text-m3-on-surface-variant'
                }`} />
                {isStationMode && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                )}
              </div>
              <span className="text-xs font-bold text-m3-on-surface">Sonora Station</span>

              {/* Active Station Mode Live Badge */}
              {isStationMode && (
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30 text-[9px] font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(59,130,246,0.25)]"
                  title="Live recommendation engine active"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>

            {/* Material Design 3 Switch Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={isStationMode}
              onClick={toggleStationMode}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isStationMode
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                  : 'bg-m3-outline-variant/40 hover:bg-m3-outline-variant/60'
              }`}
            >
              <span className="sr-only">Toggle Sonora Station Mode</span>
              <span
                className={`pointer-events-none inline-flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isStationMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                {isStationMode ? (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                )}
              </span>
            </button>
          </div>

          <p className="text-[11px] text-m3-on-surface-variant/80 leading-relaxed">
            {isStationMode ? (
              <span className="flex items-center gap-1.5 text-blue-500 dark:text-blue-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-queuing similar tracks endlessly
              </span>
            ) : (
              <span>Queue stops when current playlist ends</span>
            )}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 px-4 flex items-center justify-between border-t border-m3-outline-variant/15 text-[11px] text-m3-on-surface-variant/60 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
          <span>Sonora Web</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-m3-surface-container-high/50 font-semibold border border-m3-outline-variant/20">
          MD3 Edition
        </span>
      </div>

    </aside>
  );
};