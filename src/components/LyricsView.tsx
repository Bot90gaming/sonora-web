import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  X,
  Sparkles,
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  Copy,
  Check,
  Type,
  Heart,
  Disc3,
  Shuffle,
  Repeat,
  Repeat1,
  Radio,
  Maximize2,
  Minimize2,
  Languages,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { handleImageError } from '../services/api';
import { useThumbnailColors } from '../utils/colorExtractor';
import {
  getStoredLyricsSettings,
  getStoredUiSettings,
  saveLyricsSettings,
  SETTINGS_CHANGED_EVENT,
  LyricsSettings,
  UiSettings,
  LyricsFontSize,
} from '../utils/settings';

// Lightweight pure timestamp formatter
const formatTime = (secs: number) => {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

interface LyricRowProps {
  line: { time: number; text: string };
  idx: number;
  isActive: boolean;
  isHovered: boolean;
  dofClass: string;
  isCenter: boolean;
  isLightweight: boolean;
  glowEffect: string;
  fontSizeClasses: string;
  onLineClick: (time: number) => void;
  onMouseEnter: (idx: number) => void;
  onMouseLeave: () => void;
  activeLineRef: React.RefObject<HTMLDivElement | null>;
}

// Highly optimized memoized lyric row: prevents re-rendering all rows on every audio time update
const LyricRow = React.memo<LyricRowProps>(({
  line,
  idx,
  isActive,
  isHovered,
  dofClass,
  isCenter,
  isLightweight,
  glowEffect,
  fontSizeClasses,
  onLineClick,
  onMouseEnter,
  onMouseLeave,
  activeLineRef,
}) => {
  return (
    <div
      ref={isActive ? (activeLineRef as unknown as React.Ref<HTMLDivElement>) : null}
      onClick={() => onLineClick(line.time)}
      onMouseEnter={() => onMouseEnter(idx)}
      onMouseLeave={onMouseLeave}
      className={`group relative cursor-pointer py-2 sm:py-2.5 px-1 sm:px-2 transition-all duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] ${dofClass} ${
        isCenter ? 'text-center mx-auto' : 'text-left'
      }`}
    >
      {/* Timestamp seek badge on hover (Tactile jump affordance) */}
      <div
        className={`absolute ${isCenter ? 'right-2' : 'right-0'} top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] ${
          isActive
            ? 'opacity-70 text-sky-300 bg-sky-500/15'
            : isHovered
            ? 'opacity-100 text-white bg-white/10 scale-100'
            : 'opacity-0 scale-90 pointer-events-none'
        }`}
      >
        <Play className="w-3 h-3 fill-current" />
        <span>{formatTime(line.time)}</span>
      </div>

      {/* Lyric Text */}
      <p
        className={`transition-all duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] ${
          isCenter ? 'origin-center' : 'origin-left'
        } ${fontSizeClasses}`}
      >
        {isActive ? (
          isLightweight ? (
            <span className="font-extrabold text-sky-300">{line.text}</span>
          ) : glowEffect === 'aura' ? (
            <span className="animate-lyric-shimmer animate-lyric-glow-pulse lyric-glow-aura">
              {line.text}
            </span>
          ) : glowEffect === 'subtle' ? (
            <span className="lyric-glow-subtle font-extrabold text-white">
              {line.text}
            </span>
          ) : (
            <span className="lyric-glow-minimal font-extrabold text-white">
              {line.text}
            </span>
          )
        ) : (
          <span className="hover:text-white transition-colors">
            {line.text}
          </span>
        )}
      </p>
    </div>
  );
});

export const LyricsView: React.FC = () => {
  const {
    currentTrack,
    currentTime,
    duration,
    isPlaying,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    lyrics,
    lyricsLoading,
    toggleLyrics,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    repeatMode,
    cycleRepeat,
    isShuffle,
    toggleShuffle,
    isLiked,
    toggleLike,
  } = usePlayer();

  // Persistent settings state
  const [lyricsSettings, setLyricsSettings] = useState<LyricsSettings>(getStoredLyricsSettings);
  const [uiSettings, setUiSettings] = useState<UiSettings>(getStoredUiSettings);

  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const hasMountedRef = useRef(false);

  // Sync settings when external event triggers
  useEffect(() => {
    const handleSettingsChanged = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.type === 'lyrics') {
        setLyricsSettings(custom.detail.settings);
      } else if (custom.detail?.type === 'ui') {
        setUiSettings(custom.detail.settings);
      }
    };
    window.addEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChanged);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChanged);
  }, []);

  // Cycle font size from the quick-header button and persist
  const cycleFontSize = () => {
    const order: LyricsFontSize[] = ['standard', 'large', 'mega'];
    const nextIdx = (order.indexOf(lyricsSettings.fontSize) + 1) % order.length;
    const nextSize = order[nextIdx];
    const next = saveLyricsSettings({ fontSize: nextSize });
    setLyricsSettings(next);
  };

  // Exact lyrics sync calculation
  const activeIndex = useMemo(() => {
    if (!lyrics.lines || lyrics.lines.length === 0) return -1;
    // Song intro before first lyrics: strictly -1
    if (currentTime < lyrics.lines[0].time) {
      return -1;
    }
    for (let i = lyrics.lines.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics.lines[i].time) {
        return i;
      }
    }
    return -1;
  }, [currentTime, lyrics.lines]);

  // Check if current moment is an instrumental break (>6s gap before next line)
  const isInstrumentalBreak = useMemo(() => {
    if (!lyrics.lines || lyrics.lines.length === 0) return false;
    if (activeIndex === -1 && currentTime > 2.5 && lyrics.lines[0]?.time > 6) {
      return true; // Intro instrumental
    }
    const currentLine = lyrics.lines[activeIndex];
    const nextLine = lyrics.lines[activeIndex + 1];
    if (currentLine && nextLine) {
      const gap = nextLine.time - currentLine.time;
      if (gap > 6 && currentTime > currentLine.time + 3 && currentTime < nextLine.time - 0.8) {
        return true;
      }
    }
    return false;
  }, [activeIndex, currentTime, lyrics.lines]);

  // Smooth auto-scroll active lyric into exact vertical center of view
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

  // Auto-scroll when active line updates, unless user manually scrolled or manual mode enabled
  useEffect(() => {
    if (lyricsSettings.autoScroll !== 'manual' && !isUserScrolled) {
      if (activeIndex >= 0) {
        const isFirst = !hasMountedRef.current;
        hasMountedRef.current = true;
        const raf = requestAnimationFrame(() => {
          scrollToActive(!isFirst);
        });
        return () => cancelAnimationFrame(raf);
      } else {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [activeIndex, isUserScrolled, scrollToActive, lyricsSettings.autoScroll]);

  // Recenter active lyric immediately if window resizes
  useEffect(() => {
    const handleResize = () => {
      if (activeIndex >= 0 && !isUserScrolled) {
        scrollToActive(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex, isUserScrolled, scrollToActive]);

  // Detect user manual scroll to pause auto-scrolling temporarily
  const handleUserInteraction = useCallback(() => {
    setIsUserScrolled(true);

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    // Auto-resume sync after 5 seconds of idle user scrolling (if auto mode enabled)
    if (lyricsSettings.autoScroll !== 'manual') {
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsUserScrolled(false);
        scrollToActive(true);
      }, 5000);
    }
  }, [scrollToActive, lyricsSettings.autoScroll]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    handleUserInteraction();
  }, [handleUserInteraction]);

  // Resume manual sync immediately
  const handleResumeSync = useCallback(() => {
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    setIsUserScrolled(false);
    scrollToActive(true);
  }, [scrollToActive]);

  // Keyboard shortcuts: Escape to close, Space to play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleLyrics(false);
      } else if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLyrics, togglePlay]);

  // Copy plain lyrics or synced LRC to clipboard according to copyFormat preference
  const handleCopyLyrics = () => {
    let textToCopy = '';
    if (lyricsSettings.copyFormat === 'lrc' && lyrics.lines && lyrics.lines.length > 0) {
      textToCopy = lyrics.lines
        .map((l) => {
          const mins = Math.floor(l.time / 60);
          const secs = (l.time % 60).toFixed(2);
          const padM = String(mins).padStart(2, '0');
          const padS = String(secs).padStart(5, '0');
          return `[${padM}:${padS}] ${l.text}`;
        })
        .join('\n');
    } else {
      textToCopy =
        lyrics.plainLyrics ||
        (lyrics.lines && lyrics.lines.length > 0 ? lyrics.lines.map((l) => l.text).join('\n') : '');
    }
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Interactive seek on lyric line click
  const handleLineClick = useCallback((lineTime: number) => {
    seekTo(lineTime);
    if (!isPlaying) {
      togglePlay();
    }
    setIsUserScrolled(false);
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
  }, [seekTo, isPlaying, togglePlay]);

  // Scrubber interactive seek
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    seekTo(pos * (duration || 1));
  };

  // Volume slider interaction
  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(pos);
  };

  const hasSyncedLyrics = lyrics.lines && lyrics.lines.length > 0;
  const isCurrentTrackLiked = currentTrack ? isLiked(currentTrack.id) : false;

  // Font size classes based on user setting
  const getFontSizeClasses = useCallback((isActive: boolean) => {
    switch (lyricsSettings.fontSize) {
      case 'standard':
        return isActive
          ? 'text-xl sm:text-2xl font-bold tracking-tight text-white'
          : 'text-base sm:text-lg font-normal text-white/60';
      case 'mega':
        return isActive
          ? 'text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white'
          : 'text-2xl sm:text-3xl lg:text-4xl font-semibold leading-relaxed text-white/60';
      case 'large':
      default:
        return isActive
          ? 'text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug text-white'
          : 'text-lg sm:text-xl lg:text-2xl font-medium text-white/60';
    }
  }, [lyricsSettings.fontSize]);

  // Depth of field class calculation
  const getDofClass = useCallback((idx: number, activeIdx: number) => {
    if (idx === activeIdx) return 'lyric-dof-active';
    const distance = Math.abs(idx - (activeIdx >= 0 ? activeIdx : 0));
    if (distance <= 2) return 'lyric-dof-near';
    return 'lyric-dof-distant';
  }, []);

  const handleMouseLeave = useCallback(() => setHoveredIndex(null), []);

  const currentThumbnail = currentTrack?.thumbnail || (currentTrack?.id ? `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg` : '');
  const dynamicThumbnailColors = useThumbnailColors(currentThumbnail, currentTrack?.id);

  // Aurora colors resolved from palette source setting
  const auroraColors = useMemo(() => {
    switch (uiSettings.auroraPalette) {
      case 'cyan':
        return {
          primary: '#06b6d4',
          secondary: '#0284c7',
          tertiary: '#38bdf8',
          accent: '#0891b2',
          backgroundRgba: 'rgba(4, 20, 32, 0.96)',
        };
      case 'coral':
        return {
          primary: '#f97316',
          secondary: '#fb7185',
          tertiary: '#e11d48',
          accent: '#ea580c',
          backgroundRgba: 'rgba(28, 12, 16, 0.96)',
        };
      case 'violet':
        return {
          primary: '#8b5cf6',
          secondary: '#6366f1',
          tertiary: '#a855f7',
          accent: '#7c3aed',
          backgroundRgba: 'rgba(18, 10, 32, 0.96)',
        };
      case 'emerald':
        return {
          primary: '#10b981',
          secondary: '#059669',
          tertiary: '#34d399',
          accent: '#047857',
          backgroundRgba: 'rgba(6, 24, 18, 0.96)',
        };
      case 'dynamic':
      default:
        return dynamicThumbnailColors;
    }
  }, [uiSettings.auroraPalette, dynamicThumbnailColors]);

  // Aurora intensity multiplier (Soft 30% -> 0.45, Balanced 60% -> 1.0, Vibrant 90% -> 1.4)
  const auroraIntensityFactor = useMemo(() => {
    if (!uiSettings.enableAurora || lyricsSettings.lightweightMode) return 0;
    switch (uiSettings.auroraIntensity) {
      case 'soft':
        return 0.45;
      case 'vibrant':
        return 1.4;
      case 'balanced':
      default:
        return 1.0;
    }
  }, [uiSettings.enableAurora, uiSettings.auroraIntensity, lyricsSettings.lightweightMode]);

  const isStaticMotion =
    uiSettings.auroraMotionSpeed === 'static' ||
    uiSettings.reducedMotion ||
    lyricsSettings.lightweightMode;

  const isFluidMotion = uiSettings.auroraMotionSpeed === 'fluid';
  const isCenter = lyricsSettings.alignment === 'center';

  const spacingClass =
    lyricsSettings.lineSpacing === 'compact'
      ? 'space-y-3 sm:space-y-4'
      : lyricsSettings.lineSpacing === 'relaxed'
      ? 'space-y-8 sm:space-y-10'
      : 'space-y-6 sm:space-y-7';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col select-none overflow-hidden text-white animate-in fade-in duration-300 transition-colors duration-700 bg-[#07090e] ${
        lyricsSettings.lightweightMode ? 'lyric-lightweight' : ''
      }`}
      style={{ backgroundColor: auroraColors.backgroundRgba }}
    >
      {/* ─── DYNAMIC AURORA AMBIENT LIGHTS BACKGROUND (GPU NATIVE GRADIENTS) ─── */}
      {uiSettings.enableAurora && !lyricsSettings.lightweightMode && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-700 -z-15 overflow-hidden"
          style={{ opacity: auroraIntensityFactor }}
        >
          {/* Primary Fluid Aurora Waves */}
          <div
            className={`absolute -inset-[30%] opacity-65 transform-gpu transition-all duration-1000 ${
              isStaticMotion ? '' : 'animate-aurora-drift'
            }`}
            style={{
              background: `
                radial-gradient(ellipse 65% 55% at 20% 25%, ${auroraColors.primary} 0%, transparent 68%),
                radial-gradient(ellipse 60% 60% at 80% 75%, ${auroraColors.secondary} 0%, transparent 65%)
              `,
              animationDuration: isFluidMotion ? '12s' : '22s',
            }}
          />

          {/* Secondary Counter-Swaying Aurora Waves */}
          <div
            className={`absolute -inset-[30%] opacity-50 transform-gpu transition-all duration-1000 ${
              isStaticMotion ? '' : 'animate-aurora-sway'
            }`}
            style={{
              background: `
                radial-gradient(ellipse 55% 50% at 75% 20%, ${auroraColors.tertiary} 0%, transparent 65%),
                radial-gradient(ellipse 60% 55% at 28% 85%, ${auroraColors.accent} 0%, transparent 68%)
              `,
              animationDuration: isFluidMotion ? '16s' : '28s',
            }}
          />
        </div>
      )}

      {/* Dark Vignette & Contrast Overlay (guarantees crisp lyrics legibility) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/85 pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.65)_100%)] pointer-events-none -z-10" />

      {/* 2. Top Header Navigation Bar */}
      <header className="h-16 px-6 sm:px-10 flex items-center justify-between border-b border-white/10 shrink-0 z-20 bg-gradient-to-b from-white/5 to-transparent">
        {/* Brand / View Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Music className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Sonora Live Lyrics</span>
              {hasSyncedLyrics && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.3)]">
                  <Sparkles className="w-3 h-3 text-sky-400 animate-spin-slow" />
                  Synced
                </span>
              )}
              {lyricsSettings.romanized && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  <Languages className="w-3 h-3 text-purple-300" />
                  Romaji
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 text-white/70">
          {/* Font Size Adjuster */}
          <button
            onClick={cycleFontSize}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            title="Adjust Lyrics Font Size"
          >
            <Type className="w-3.5 h-3.5 text-sky-400" />
            <span className="capitalize">{lyricsSettings.fontSize}</span>
          </button>

          {/* Copy Plain / Synced Lyrics */}
          <button
            onClick={handleCopyLyrics}
            className="p-2.5 rounded-full hover:text-white hover:bg-white/10 transition-all duration-200"
            title={lyricsSettings.copyFormat === 'lrc' ? 'Copy synced LRC format' : 'Copy plain lyrics'}
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>

          {/* Theater Mode Toggle */}
          <button
            onClick={() => setIsTheaterMode((prev) => !prev)}
            className="p-2.5 rounded-full hover:text-white hover:bg-white/10 transition-all duration-200"
            title={isTheaterMode ? 'Windowed mode' : 'Full-bleed mode'}
          >
            {isTheaterMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Close Button */}
          <button
            onClick={() => toggleLyrics(false)}
            className="p-2.5 rounded-full hover:text-white hover:bg-white/10 transition-all duration-200 group"
            title="Close Lyrics (Esc)"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </header>

      {/* 3. Main Split Player Screen (Two Columns on Desktop) */}
      <div
        className={`flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden z-10 transition-all duration-500 ${
          isTheaterMode ? 'max-w-none' : 'max-w-7xl mx-auto w-full'
        }`}
      >
        {/* Left Column (Approx 44% width): Large Artwork & Full Playback Controls */}
        <div className="w-full lg:w-[44%] xl:w-[42%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 lg:border-r lg:border-white/10 shrink-0 overflow-y-auto">
          <div className="w-full max-w-[400px] flex flex-col items-center space-y-6">
            {/* Song Artwork Thumbnail (Clean Sharp Display - No Ambient Glow) */}
            <div className="relative w-64 h-64 sm:w-76 sm:h-76 md:w-80 md:h-80 xl:w-96 xl:h-96 aspect-square shrink-0">
              {currentThumbnail ? (
                <img
                  src={currentThumbnail}
                  alt={currentTrack?.title || 'Sonora Track'}
                  onError={(e) => handleImageError(e, currentTrack?.id)}
                  className="w-full h-full object-cover rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.85)] border border-white/15"
                />
              ) : (
                <div className="w-full h-full rounded-3xl bg-white/10 flex items-center justify-center text-white/40 shadow-inner border border-white/10">
                  <Music className="w-20 h-20" />
                </div>
              )}
            </div>

            {/* Song Title, Artist, Album, Like Button */}
            <div className="w-full text-center space-y-2">
              <div className="flex items-center justify-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight line-clamp-1">
                  {currentTrack?.title || 'Sonora Audio'}
                </h2>
                <button
                  onClick={() => toggleLike(currentTrack || undefined)}
                  className={`p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                    isCurrentTrackLiked
                      ? 'text-rose-500 bg-rose-500/10'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  title={isCurrentTrackLiked ? 'Remove from Liked' : 'Add to Liked'}
                >
                  <Heart className={`w-5 h-5 ${isCurrentTrackLiked ? 'fill-current' : ''}`} />
                </button>
              </div>

              <p className="text-base sm:text-lg font-semibold text-white/70 truncate">
                {currentTrack?.artist || 'Unknown Artist'}
              </p>
              {currentTrack?.album && (
                <p className="text-xs sm:text-sm font-medium text-white/45 truncate">
                  {currentTrack.album}
                </p>
              )}
            </div>

            {/* Complete Playback Controls */}
            <div className="w-full space-y-5 pt-2">
              {/* Interactive Scrubber with Timestamps */}
              <div className="w-full space-y-1.5">
                <div
                  onClick={handleScrubberClick}
                  className="relative w-full h-2 bg-white/15 hover:bg-white/25 rounded-full cursor-pointer group transition-all"
                >
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full relative group-hover:shadow-[0_0_12px_rgba(56,189,248,0.8)] transition-all"
                    style={{
                      width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-white/50">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Transport Playback Controls */}
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                <button
                  onClick={toggleShuffle}
                  className={`p-2.5 rounded-full transition-all duration-200 ${
                    isShuffle
                      ? 'text-sky-400 bg-sky-500/15 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <button
                  onClick={prevTrack}
                  className="p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 active:scale-90"
                  title="Previous Track"
                >
                  <SkipBack className="w-6 h-6" />
                </button>

                <button
                  onClick={togglePlay}
                  className="p-4 sm:p-5 rounded-full bg-white text-slate-950 hover:bg-sky-400 hover:text-white shadow-[0_0_24px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(56,189,248,0.6)] transition-all duration-200 active:scale-95"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={nextTrack}
                  className="p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 active:scale-90"
                  title="Next Track"
                >
                  <SkipForward className="w-6 h-6" />
                </button>

                <button
                  onClick={cycleRepeat}
                  className={`p-2.5 rounded-full transition-all duration-200 ${
                    repeatMode !== 'off'
                      ? 'text-sky-400 bg-sky-500/15 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  title={`Repeat: ${repeatMode}`}
                >
                  {repeatMode === 'one' ? (
                    <Repeat1 className="w-4 h-4" />
                  ) : (
                    <Repeat className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Volume Slider with Mute Toggle */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <div
                  onClick={handleVolumeClick}
                  className="relative w-32 h-1.5 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer group transition-all"
                >
                  <div
                    className="h-full bg-white rounded-full relative group-hover:bg-sky-400 transition-colors"
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  />
                </div>

                <span className="text-[11px] font-mono text-white/50 w-8">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Approx 56% width): Vertically Scrolling Synced Lyrics */}
        <div className="w-full lg:w-[56%] xl:w-[58%] flex-1 relative flex flex-col min-h-0 overflow-hidden">
          <div
            ref={containerRef}
            onScroll={handleScroll}
            onWheel={handleUserInteraction}
            onTouchMove={handleUserInteraction}
            style={{
              paddingTop: 'calc(50vh - 3rem)',
              paddingBottom: 'calc(50vh - 3rem)',
            }}
            className={`relative flex-1 overflow-y-auto px-8 sm:px-14 lg:px-18 xl:px-20 ${spacingClass} ${
              isCenter ? 'text-center' : 'text-left'
            } scrollbar-none select-text focus:outline-none`}
          >
            {lyricsLoading && (!lyrics.lines || lyrics.lines.length === 0) ? (
              /* Loading State with Shimmer */
              <div className="h-full flex flex-col items-center justify-center gap-6 text-white/70 py-24">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin" />
                  <Disc3 className="w-8 h-8 text-sky-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-lg font-bold text-white animate-pulse">
                    Synchronizing lyrics from LRCLIB...
                  </p>
                  <p className="text-xs text-white/50">Fetching beat-by-beat vocal timestamps</p>
                </div>
                <div className="w-full max-w-md space-y-4 pt-4 opacity-35">
                  <div className="h-7 bg-white/20 rounded-2xl animate-pulse w-3/4" />
                  <div className="h-8 bg-white/30 rounded-2xl animate-pulse w-5/6" />
                  <div className="h-7 bg-white/20 rounded-2xl animate-pulse w-2/3" />
                </div>
              </div>
            ) : hasSyncedLyrics ? (
              /* Synced Lyrics Display */
              <>
                {/* Intro Section Indicator before first lyric line */}
                {activeIndex === -1 && currentTime < lyrics.lines[0].time && (
                  <div
                    className={`py-8 flex items-center gap-2.5 text-sky-400/85 ${
                      isCenter ? 'justify-center' : 'pl-4'
                    }`}
                  >
                    <Music className="w-4 h-4 text-sky-400 animate-pulse" />
                    <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-sky-300">
                      Intro Instrumental
                    </span>
                  </div>
                )}

                {lyrics.lines.map((line, idx) => {
                  const isActive = idx === activeIndex;
                  const isHovered = hoveredIndex === idx;
                  const dofClass = getDofClass(idx, activeIndex);

                  return (
                    <LyricRow
                      key={idx}
                      line={line}
                      idx={idx}
                      isActive={isActive}
                      isHovered={isHovered}
                      dofClass={dofClass}
                      isCenter={isCenter}
                      isLightweight={lyricsSettings.lightweightMode}
                      glowEffect={lyricsSettings.glowEffect}
                      fontSizeClasses={getFontSizeClasses(isActive)}
                      onLineClick={handleLineClick}
                      onMouseEnter={setHoveredIndex}
                      onMouseLeave={handleMouseLeave}
                      activeLineRef={activeLineRef}
                    />
                  );
                })}

                {/* Instrumental Break Notice */}
                {isInstrumentalBreak && (
                  <div
                    className={`py-6 flex items-center gap-2 animate-in fade-in duration-300 ${
                      isCenter ? 'justify-center' : 'pl-4'
                    }`}
                  >
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-xs font-bold uppercase tracking-wider text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.2)] backdrop-blur-md">
                      <Radio className="w-3.5 h-3.5 text-sky-400" />
                      <span>Solo / Instrumental Break</span>
                    </div>
                  </div>
                )}
              </>
            ) : lyrics.plainLyrics ? (
              /* Plain Unsynced Lyrics */
              <div className={`py-12 px-4 max-w-xl ${isCenter ? 'mx-auto text-center' : ''}`}>
                <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-semibold">
                  <Music className="w-3.5 h-3.5" />
                  Plain Lyrics (Timestamps not yet available)
                </div>
                <div className="whitespace-pre-line text-lg sm:text-2xl text-white/90 leading-loose font-medium select-text">
                  {lyrics.plainLyrics}
                </div>
              </div>
            ) : (
              /* No Lyrics Available */
              <div className="h-full flex flex-col items-center justify-center gap-4 text-white/60 py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 shadow-inner">
                  <Music className="w-8 h-8" />
                </div>
                <p className="text-xl font-bold text-white">No lyrics available for this track</p>
                <p className="text-sm text-white/50 max-w-sm">
                  This track might be an instrumental or has not yet been transcribed on LRCLIB.
                </p>
              </div>
            )}
          </div>

          {/* Floating "Resume Lyrics Sync" Button */}
          {isUserScrolled && hasSyncedLyrics && lyricsSettings.autoScroll !== 'manual' && (
            <div className="absolute bottom-10 right-10 z-30 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <button
                onClick={handleResumeSync}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(56,189,248,0.6)] hover:bg-sky-400 hover:scale-105 active:scale-95 transition-all duration-200 border border-sky-300/40"
              >
                <RotateCcw className="w-4 h-4 animate-spin-slow" />
                <span>Resume Lyrics Sync</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
