import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { ChevronDown, Sparkles, Music, RotateCcw } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useThumbnailColors } from '../../utils/colorExtractor';

interface MobileLyricsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileLyricsSheet: React.FC<MobileLyricsSheetProps> = ({ isOpen, onClose }) => {
  const { currentTrack, currentTime, isPlaying, togglePlay, seekTo, lyrics, lyricsLoading } = usePlayer();
  const [isUserScrolled, setIsUserScrolled] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  const thumbnail = currentTrack?.thumbnail || (currentTrack?.id ? `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg` : '');
  const colors = useThumbnailColors(thumbnail, currentTrack?.id);

  // Active Line Index
  const activeIndex = useMemo(() => {
    if (!lyrics.lines || lyrics.lines.length === 0) return -1;
    if (currentTime < lyrics.lines[0].time) return -1;
    for (let i = lyrics.lines.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics.lines[i].time) {
        return i;
      }
    }
    return -1;
  }, [currentTime, lyrics.lines]);

  // Center Scrolling Logic
  const scrollToActive = useCallback((smooth = true) => {
    if (!containerRef.current || !activeLineRef.current) return;
    const container = containerRef.current;
    const el = activeLineRef.current;

    isProgrammaticScrollRef.current = true;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    const currentElCenter = elRect.top + elRect.height / 2;
    const containerCenter = containerRect.top + containerRect.height / 2;
    const diff = currentElCenter - containerCenter;

    const targetScroll = container.scrollTop + diff;

    container.scrollTo({
      top: targetScroll,
      behavior: smooth ? 'smooth' : 'auto',
    });

    if ('onscrollend' in window) {
      container.addEventListener(
        'scrollend',
        () => {
          isProgrammaticScrollRef.current = false;
        },
        { once: true }
      );
    }

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 700);
  }, []);

  // Auto scroll when active line changes
  useEffect(() => {
    if (isOpen && !isUserScrolled) {
      if (activeIndex >= 0) {
        const raf = requestAnimationFrame(() => {
          scrollToActive(true);
        });
        return () => cancelAnimationFrame(raf);
      } else {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [isOpen, activeIndex, isUserScrolled, scrollToActive]);

  const handleUserInteraction = useCallback(() => {
    setIsUserScrolled(true);

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsUserScrolled(false);
      scrollToActive(true);
    }, 5000);
  }, [scrollToActive]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    handleUserInteraction();
  }, [handleUserInteraction]);

  const handleLineClick = (time: number) => {
    seekTo(time);
    if (!isPlaying) togglePlay();
    setIsUserScrolled(false);
  };

  if (!isOpen || !currentTrack) return null;

  const hasSyncedLyrics = lyrics.lines && lyrics.lines.length > 0;

  return (
    <div
      className="fixed inset-0 z-55 flex flex-col justify-between overflow-hidden select-none text-white animate-in slide-in-from-bottom duration-300"
      style={{
        background: `radial-gradient(ellipse 100% 70% at 50% 15%, ${colors.primary}44 0%, #07090e 90%)`,
      }}
    >
      {/* Header */}
      <header className="px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between border-b border-white/10 shrink-0 z-20 backdrop-blur-md bg-black/20">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/80 active:scale-90 transition-transform"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center px-4 min-w-0 flex-1">
          <p className="text-sm font-extrabold text-white truncate">{currentTrack.title}</p>
          <p className="text-xs text-white/60 truncate">{currentTrack.artist}</p>
        </div>

        <div className="w-10 flex justify-end">
          {hasSyncedLyrics && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-400/30">
              <Sparkles className="w-3 h-3 text-sky-400" />
            </span>
          )}
        </div>
      </header>

      {/* Main Lyrics Scroll Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onWheel={handleUserInteraction}
        onTouchMove={handleUserInteraction}
        style={{
          paddingTop: 'calc(50vh - 3rem)',
          paddingBottom: 'calc(50vh - 3rem)',
        }}
        className="flex-1 overflow-y-auto px-6 space-y-7 text-center scrollbar-none select-text focus:outline-none relative"
      >
        {lyricsLoading && (!lyrics.lines || lyrics.lines.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-white/70 py-24">
            <div className="w-12 h-12 rounded-full border-3 border-sky-500/20 border-t-sky-400 animate-spin" />
            <p className="text-sm font-bold text-white animate-pulse">Syncing lyrics...</p>
          </div>
        ) : hasSyncedLyrics ? (
          <>
            {activeIndex === -1 && currentTime < lyrics.lines[0].time && (
              <div className="py-6 flex items-center justify-center gap-2 text-sky-400/85">
                <Music className="w-4 h-4 text-sky-400 animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase text-sky-300">
                  Intro Instrumental
                </span>
              </div>
            )}

            {lyrics.lines.map((line, idx) => {
              const isActive = idx === activeIndex;
              const distance = Math.abs(idx - (activeIndex >= 0 ? activeIndex : 0));
              const opacityClass = isActive
                ? 'opacity-100 scale-105 font-extrabold text-white text-2xl sm:text-3xl tracking-tight'
                : distance <= 2
                ? 'opacity-65 scale-98 font-semibold text-white/70 text-lg sm:text-xl'
                : 'opacity-35 scale-95 font-medium text-white/50 text-base sm:text-lg';

              return (
                <div
                  key={idx}
                  ref={isActive ? (activeLineRef as unknown as React.Ref<HTMLDivElement>) : null}
                  onClick={() => handleLineClick(line.time)}
                  className={`group relative cursor-pointer py-2 px-2 transition-all duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] origin-center active:scale-95 ${opacityClass}`}
                >
                  <p className="leading-snug">
                    {isActive ? (
                      <span className="text-sky-300 drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]">
                        {line.text}
                      </span>
                    ) : (
                      line.text
                    )}
                  </p>
                </div>
              );
            })}
          </>
        ) : lyrics.plainLyrics ? (
          <div className="py-12 whitespace-pre-line text-lg text-white/90 leading-loose font-medium">
            {lyrics.plainLyrics}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-white/60 py-24 text-center">
            <Music className="w-10 h-10 opacity-30 text-white" />
            <p className="text-base font-bold text-white">No lyrics available</p>
            <p className="text-xs text-white/50">Instrumental or not yet transcribed.</p>
          </div>
        )}
      </div>

      {/* Floating Resume Button */}
      {isUserScrolled && hasSyncedLyrics && (
        <div className="absolute bottom-6 right-6 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={() => {
              setIsUserScrolled(false);
              scrollToActive(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      )}
    </div>
  );
};
