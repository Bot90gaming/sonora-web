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
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { handleImageError } from '../services/api';

type FontSizePreference = 'standard' | 'large' | 'mega';

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

  const [fontSize, setFontSize] = useState<FontSizePreference>('large');
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef(false);

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

  // Smooth auto-scroll active lyric into center of view
  const scrollToActive = useCallback((smooth = true) => {
    if (!containerRef.current || !activeLineRef.current) return;
    const container = containerRef.current;
    const el = activeLineRef.current;

    isProgrammaticScrollRef.current = true;
    const targetScroll = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;

    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: smooth ? 'smooth' : 'auto',
    });

    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 450);
  }, []);

  // Auto-scroll when active line updates, unless user manually scrolled
  useEffect(() => {
    if (!isUserScrolled) {
      if (activeIndex >= 0) {
        scrollToActive(true);
      } else {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [activeIndex, isUserScrolled, scrollToActive]);

  // Detect user manual scroll to pause auto-scrolling temporarily
  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;

    setIsUserScrolled(true);

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    // Auto-resume sync after 5 seconds of idle user scrolling
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsUserScrolled(false);
      scrollToActive(true);
    }, 5000);
  }, [scrollToActive]);

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

  // Format mm:ss helper
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Copy plain lyrics to clipboard
  const handleCopyLyrics = () => {
    const textToCopy =
      lyrics.plainLyrics ||
      (lyrics.lines && lyrics.lines.length > 0 ? lyrics.lines.map((l) => l.text).join('\n') : '');
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Interactive seek on lyric line click
  const handleLineClick = (lineTime: number) => {
    seekTo(lineTime);
    if (!isPlaying) {
      togglePlay();
    }
    setIsUserScrolled(false);
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
  };

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
  const getFontSizeClasses = (isActive: boolean) => {
    switch (fontSize) {
      case 'standard':
        return isActive
          ? 'text-xl sm:text-2xl lg:text-3xl font-black tracking-tight'
          : 'text-base sm:text-lg lg:text-xl font-medium';
      case 'mega':
        return isActive
          ? 'text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight'
          : 'text-2xl sm:text-3xl lg:text-4xl font-semibold leading-relaxed';
      case 'large':
      default:
        return isActive
          ? 'text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug'
          : 'text-lg sm:text-xl lg:text-2xl font-medium';
    }
  };

  // Depth of field class calculation
  const getDofClass = (idx: number, activeIdx: number) => {
    if (idx === activeIdx) return 'lyric-dof-active';
    const distance = Math.abs(idx - (activeIdx >= 0 ? activeIdx : 0));
    if (distance <= 2) return 'lyric-dof-near';
    return 'lyric-dof-distant';
  };

  const currentThumbnail = currentTrack?.thumbnail || (currentTrack?.id ? `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg` : '');

  return (
    <div className="fixed inset-0 z-50 flex flex-col backdrop-blur-3xl bg-black/80 select-none overflow-hidden text-white animate-in fade-in duration-300">
      {/* 1. Dynamic Ambient Background Glows reflecting Album Art */}
      {currentThumbnail && (
        <>
          {/* Primary High-Blur Canvas */}
          <div
            className="absolute -inset-10 opacity-35 filter blur-[100px] pointer-events-none -z-20 bg-cover bg-center transition-all duration-1000 scale-125 transform-gpu"
            style={{ backgroundImage: `url(${currentThumbnail})` }}
          />
          {/* Secondary Counter-Rotated Bloom */}
          <div
            className="absolute inset-0 opacity-20 filter blur-[150px] pointer-events-none -z-20 bg-cover bg-center transition-all duration-1000 scale-150 rotate-180 transform-gpu"
            style={{ backgroundImage: `url(${currentThumbnail})` }}
          />
        </>
      )}

      {/* Radiant Neon Aura Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-500/20 filter blur-[90px] pointer-events-none -z-10 animate-pulse duration-700" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/20 filter blur-[90px] pointer-events-none -z-10 animate-pulse duration-1000" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/10 filter blur-[130px] pointer-events-none -z-10" />

      {/* Dark Vignette Overlay for Crisp Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/85 pointer-events-none -z-10" />

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
            </h1>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 text-white/70">
          {/* Font Size Adjuster */}
          <button
            onClick={() =>
              setFontSize((curr) =>
                curr === 'standard' ? 'large' : curr === 'large' ? 'mega' : 'standard'
              )
            }
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            title="Adjust Lyrics Font Size"
          >
            <Type className="w-3.5 h-3.5 text-sky-400" />
            <span className="capitalize">{fontSize}</span>
          </button>

          {/* Copy Plain Lyrics */}
          <button
            onClick={handleCopyLyrics}
            className="p-2.5 rounded-full hover:text-white hover:bg-white/10 transition-all duration-200"
            title="Copy plain lyrics"
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
            {/* Song Artwork Thumbnail with Dynamic Ambient Backlight */}
            <div className="relative group w-64 h-64 sm:w-76 sm:h-76 md:w-80 md:h-80 xl:w-96 xl:h-96 aspect-square shrink-0">
              {currentThumbnail && (
                <div
                  className="absolute inset-0 rounded-3xl bg-cover bg-center filter blur-2xl opacity-60 scale-105 -z-10 transition-all duration-700 group-hover:opacity-85 group-hover:blur-3xl animate-ambient-orb-pulse"
                  style={{ backgroundImage: `url(${currentThumbnail})` }}
                />
              )}

              {currentThumbnail ? (
                <img
                  src={currentThumbnail}
                  alt={currentTrack?.title || 'Sonora Track'}
                  onError={(e) => handleImageError(e, currentTrack?.id)}
                  className="w-full h-full object-cover rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/15"
                />
              ) : (
                <div className="w-full h-full rounded-3xl bg-white/10 flex items-center justify-center text-white/40 shadow-inner">
                  <Music className="w-20 h-20" />
                </div>
              )}

              {/* Animated Soundwave Equalizer Badge on Artwork */}
              {isPlaying && (
                <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center gap-1.5 shadow-lg">
                  <span className="w-1 h-3 bg-sky-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-4.5 bg-sky-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-2.5 bg-sky-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  <span className="text-[11px] font-bold text-sky-300 ml-1">PLAYING</span>
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
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md scale-0 group-hover:scale-100 transition-transform" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-white/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Playback Buttons (Shuffle, Prev, Play/Pause, Next, Repeat) */}
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={toggleShuffle}
                  className={`p-2.5 rounded-full transition-all duration-200 ${
                    isShuffle
                      ? 'text-sky-400 bg-sky-500/15 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  title="Shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <button
                  onClick={prevTrack}
                  className="p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all hover:scale-105 active:scale-95"
                  title="Previous Track"
                >
                  <SkipBack className="w-6 h-6" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 shadow-[0_0_28px_rgba(255,255,255,0.4)] transition-all duration-200"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  className="p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all hover:scale-105 active:scale-95"
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
          {/* Ethereal Floating Ambient Spotlight Orb behind active vocal area */}
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-tr from-sky-500/15 via-indigo-500/10 to-violet-500/15 filter blur-[100px] pointer-events-none -z-10 animate-ambient-orb-pulse" />

          <div
            ref={containerRef}
            onScroll={handleScroll}
            style={{
              maskImage:
                'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 6%, black 16%, black 84%, rgba(0,0,0,0.85) 94%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 6%, black 16%, black 84%, rgba(0,0,0,0.85) 94%, transparent 100%)',
            }}
            className="relative flex-1 overflow-y-auto px-8 sm:px-14 lg:px-18 xl:px-20 py-32 space-y-6 sm:space-y-7 text-left scrollbar-none select-text focus:outline-none"
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
                  <div className="py-10 flex flex-col items-start gap-3 text-sky-400/85 animate-pulse pl-4">
                    <div className="flex items-center gap-1.5 h-6">
                      <span className="w-1.5 h-3 bg-sky-400/80 rounded-full animate-pulse [animation-delay:0ms]" />
                      <span className="w-1.5 h-6 bg-sky-400 rounded-full animate-bounce [animation-delay:120ms]" />
                      <span className="w-1.5 h-8 bg-indigo-400 rounded-full animate-bounce [animation-delay:240ms]" />
                      <span className="w-1.5 h-10 bg-purple-400 rounded-full animate-bounce [animation-delay:360ms]" />
                      <span className="w-1.5 h-8 bg-indigo-400 rounded-full animate-bounce [animation-delay:480ms]" />
                      <span className="w-1.5 h-6 bg-sky-400 rounded-full animate-bounce [animation-delay:600ms]" />
                      <span className="w-1.5 h-3 bg-sky-400/80 rounded-full animate-pulse [animation-delay:720ms]" />
                    </div>
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
                    <div
                      key={idx}
                      ref={isActive ? activeLineRef : null}
                      onClick={() => handleLineClick(line.time)}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className={`group relative cursor-pointer py-3.5 px-6 sm:px-8 rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${dofClass} ${
                        isActive
                          ? 'scale-[1.05] sm:scale-[1.08] origin-left -translate-y-0.5 bg-sky-500/15 border border-sky-400/35 shadow-[0_0_35px_rgba(56,189,248,0.35)]'
                          : isHovered
                          ? 'bg-white/10 border border-white/15 scale-[1.01] origin-left'
                          : 'border border-transparent hover:bg-white/5'
                      }`}
                    >
                      {/* Ambient Spotlight Orb strictly behind the active line */}
                      {isActive && (
                        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-sky-500/25 via-indigo-500/20 to-purple-500/25 filter blur-xl -z-10 animate-ambient-orb-pulse pointer-events-none" />
                      )}

                      {/* Active Line Left 4-Bar Soundwave Equalizer */}
                      {isActive && (
                        <div className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sky-400">
                          <span className="w-1 h-3 bg-sky-400 rounded-full animate-bounce [animation-delay:0ms] shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                          <span className="w-1 h-5.5 bg-sky-300 rounded-full animate-bounce [animation-delay:150ms] shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                          <span className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms] shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                          <span className="w-1 h-2.5 bg-sky-400 rounded-full animate-bounce [animation-delay:450ms] shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                        </div>
                      )}

                      {/* Timestamp seek badge on hover (Tactile jump affordance) */}
                      <div
                        className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all duration-200 ${
                          isActive
                            ? 'opacity-85 text-sky-300 bg-sky-500/20'
                            : isHovered
                            ? 'opacity-100 text-white bg-white/15 scale-100'
                            : 'opacity-0 scale-90 pointer-events-none'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{formatTime(line.time)}</span>
                      </div>

                      {/* Lyric Text with Shimmer Sweep & Sonora Glow Aura */}
                      <p
                        className={`transition-all duration-500 origin-left ${
                          isActive ? 'pl-6 sm:pl-8' : ''
                        } ${getFontSizeClasses(isActive)}`}
                      >
                        {isActive ? (
                          <span className="animate-lyric-shimmer animate-lyric-glow-pulse font-black drop-shadow-[0_0_20px_rgba(56,189,248,0.95)]">
                            {line.text}
                          </span>
                        ) : (
                          <span className="text-white/80 hover:text-white transition-colors">
                            {line.text}
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}

                {/* Instrumental Break Notice with undulating ripple wave */}
                {isInstrumentalBreak && (
                  <div className="py-8 flex flex-col items-start gap-3 pl-4 animate-in fade-in duration-500">
                    <div className="flex items-center gap-1.5 h-6">
                      <span className="w-1.5 h-3 bg-sky-400/80 rounded-full animate-pulse [animation-delay:0ms]" />
                      <span className="w-1.5 h-6 bg-sky-400 rounded-full animate-bounce [animation-delay:120ms]" />
                      <span className="w-1.5 h-8 bg-indigo-400 rounded-full animate-bounce [animation-delay:240ms]" />
                      <span className="w-1.5 h-10 bg-purple-400 rounded-full animate-bounce [animation-delay:360ms]" />
                      <span className="w-1.5 h-8 bg-indigo-400 rounded-full animate-bounce [animation-delay:480ms]" />
                      <span className="w-1.5 h-6 bg-sky-400 rounded-full animate-bounce [animation-delay:600ms]" />
                      <span className="w-1.5 h-3 bg-sky-400/80 rounded-full animate-pulse [animation-delay:720ms]" />
                    </div>
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-xs font-bold uppercase tracking-wider text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.3)] backdrop-blur-md">
                      <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                      <span>Solo / Instrumental Break</span>
                    </div>
                  </div>
                )}
              </>
            ) : lyrics.plainLyrics ? (
              /* Plain Unsynced Lyrics */
              <div className="py-12 px-4 max-w-xl">
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
          {isUserScrolled && hasSyncedLyrics && (
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
