import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Heart, 
  Mic2, 
  ListMusic, 
  Download,
  Sparkles
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { handleImageError } from '../services/api';
import {
  getStoredUiSettings,
  SETTINGS_CHANGED_EVENT,
  UiSettings,
} from '../utils/settings';

interface PlayerBarProps {
  onOpenDownloadModal?: () => void;
}

export function formatSeconds(secs: number): string {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

interface PlayerVisualizerProps {
  isPlaying: boolean;
  hasTrack: boolean;
}

const NUM_BARS = 48;

export const PlayerVisualizerBackground: React.FC<PlayerVisualizerProps> = ({ isPlaying, hasTrack }) => {
  const [uiSettings, setUiSettings] = useState<UiSettings>(getStoredUiSettings);

  useEffect(() => {
    const handleSettingsChanged = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.type === 'ui') {
        setUiSettings(custom.detail.settings);
      }
    };
    window.addEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChanged);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChanged);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const currentHeightsRef = useRef<Float32Array>(new Float32Array(NUM_BARS));
  const wavePhaseRef = useRef<number>(0);

  useEffect(() => {
    if (!uiSettings.enableVisualizer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isActive = true;
    const restingHeight = hasTrack ? 3 : 1;
    let lastTime = performance.now();

    const render = (now: number) => {
      if (!isActive || !canvas) return;
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width <= 0 || height <= 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetWidth = Math.floor(width * dpr);
      const targetHeightPx = Math.floor(height * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeightPx) {
        canvas.width = targetWidth;
        canvas.height = targetHeightPx;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const t = now * 0.001;
      if (isPlaying) {
        wavePhaseRef.current += dt * (uiSettings.visualizerStyle === 'wave' ? 2.2 : 1.6);
      }

      // STYLE: Wave
      if (uiSettings.visualizerStyle === 'wave') {
        const wavePoints = 48;
        const waveStep = width / wavePoints;

        // Wave Layer 1
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let p = 0; p <= wavePoints; p++) {
          const wx = p * waveStep;
          let wy = height;
          if (isPlaying && hasTrack) {
            const wAmp = height * 0.45;
            const s1 = Math.sin(wavePhaseRef.current + p * 0.35) * 0.5 + 0.5;
            const c1 = Math.cos(wavePhaseRef.current * 0.8 - p * 0.22) * 0.35;
            wy = height - (wAmp * (s1 + c1) + 6);
          } else {
            wy = height - restingHeight - 2;
          }
          ctx.lineTo(wx, wy);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const grad1 = ctx.createLinearGradient(0, height, 0, height * 0.2);
        grad1.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        grad1.addColorStop(0.5, 'rgba(99, 102, 241, 0.25)');
        grad1.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = grad1;
        ctx.fill();

        // Wave Layer 2 (Crest line)
        ctx.beginPath();
        for (let p = 0; p <= wavePoints; p++) {
          const wx = p * waveStep;
          let wy = height;
          if (isPlaying && hasTrack) {
            const wAmp = height * 0.35;
            const s2 = Math.sin(wavePhaseRef.current * 1.3 - p * 0.4) * 0.5 + 0.5;
            wy = height - (wAmp * s2 + 4);
          } else {
            wy = height - restingHeight;
          }
          if (p === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.restore();
        if (isPlaying) {
          animFrameRef.current = requestAnimationFrame(render);
        }
        return;
      }

      // STYLE: Spectrum OR Minimal
      const isMinimal = uiSettings.visualizerStyle === 'minimal';
      const wavePoints = 32;
      const waveStep = width / wavePoints;
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let p = 0; p <= wavePoints; p++) {
        const wx = p * waveStep;
        let wy = height;
        if (isPlaying && hasTrack) {
          const wAmp = height * (isMinimal ? 0.12 : 0.24);
          const wSin = Math.sin(wavePhaseRef.current + p * 0.42) * 0.5 + 0.5;
          const wCos = Math.cos(wavePhaseRef.current * 0.7 - p * 0.28) * 0.3;
          wy = height - (wAmp * (wSin + wCos) + 3);
        } else {
          wy = height - restingHeight - 1;
        }
        ctx.lineTo(wx, wy);
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(0, height, 0, height * 0.55);
      waveGrad.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
      waveGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.14)');
      waveGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.fillStyle = waveGrad;
      ctx.fill();

      // Equalizer bars
      const currentHeights = currentHeightsRef.current;
      let allSettled = true;

      const step = width / (NUM_BARS + 1);
      const barWidth = isMinimal
        ? Math.max(1.5, Math.min(3, step * 0.25))
        : Math.max(2, Math.min(5.5, step * 0.44));
      const radius = barWidth / 2;

      // Simulated acoustic beat rhythm (~124 BPM)
      const beat = isPlaying ? Math.pow(Math.max(0, Math.sin(t * 3.8)), 4) * 0.32 : 0;

      for (let i = 0; i < NUM_BARS; i++) {
        let targetH = restingHeight;

        if (isPlaying && hasTrack) {
          const norm = i / NUM_BARS;
          const bassBoost = norm < 0.25 ? (1 - norm * 3.2) * 0.3 : 0;
          const f1 = Math.sin(t * 4.3 + i * 0.36) * 0.22;
          const f2 = Math.cos(t * 2.8 - i * 0.24) * 0.18;
          const f3 = Math.sin(t * 6.6 + i * 0.58) * 0.14;
          const spectrumCurve = 0.55 + 0.45 * Math.sin(norm * Math.PI);

          const energy = Math.max(
            0.05,
            Math.min(1, (0.32 + bassBoost + f1 + f2 + f3 + beat) * spectrumCurve)
          );

          const maxBarHeight = height * (isMinimal ? 0.38 : 0.68);
          targetH = restingHeight + energy * (maxBarHeight - restingHeight);
        }

        const currentH = currentHeights[i];
        const diff = targetH - currentH;
        if (Math.abs(diff) > 0.12) {
          allSettled = false;
        }
        currentHeights[i] += diff * 0.14;

        const h = currentHeights[i];
        if (h <= 0.5) continue;

        const x = (i + 1) * step;
        const y = height - h;

        const barGrad = ctx.createLinearGradient(0, height, 0, y);
        barGrad.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
        barGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.75)');
        barGrad.addColorStop(1, 'rgba(165, 180, 252, 0.95)');

        ctx.fillStyle = barGrad;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x - barWidth / 2, y, barWidth, h, [radius, radius, 0, 0]);
        } else {
          ctx.rect(x - barWidth / 2, y, barWidth, h);
        }
        ctx.fill();
      }

      ctx.restore();

      if (isPlaying || !allSettled) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isActive = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, hasTrack, uiSettings.enableVisualizer, uiSettings.visualizerStyle]);

  if (!uiSettings.enableVisualizer) {
    return null;
  }

  const opacityValue =
    uiSettings.visualizerOpacity === 'subtle'
      ? 0.15
      : uiSettings.visualizerOpacity === 'vivid'
      ? 0.40
      : 0.25;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 transition-opacity duration-700"
      style={{
        opacity: opacityValue,
        maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0) 88%)',
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0) 88%)',
      }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export const PlayerBar: React.FC<PlayerBarProps> = ({ onOpenDownloadModal }) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    queue,
    isLyricsOpen,
    isQueueOpen,
    isLiked,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
    toggleLyrics,
    toggleQueue,
  } = usePlayer();

  // Scrubber dragging state
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(currentTime);
  const scrubValueRef = useRef(currentTime);
  const scrubberRef = useRef<HTMLDivElement>(null);

  // Scrubber hover state for tooltip
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  // Volume bar dragging & hover state
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const [isVolDragging, setIsVolDragging] = useState(false);
  const [isVolHovered, setIsVolHovered] = useState(false);

  // Like button heartbeat animation trigger
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  // Sync currentTime to scrubber when not actively dragging
  useEffect(() => {
    if (!isScrubbing) {
      setScrubValue(currentTime);
      scrubValueRef.current = currentTime;
    }
  }, [currentTime, isScrubbing]);

  // ──────────────── Scrubber Pointer Handling ────────────────
  const calculateScrubPosition = useCallback((clientX: number) => {
    if (!scrubberRef.current) return 0;
    const rect = scrubberRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * (duration || 100);
  }, [duration]);

  const handleScrubberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    const newPos = calculateScrubPosition(e.clientX);
    setScrubValue(newPos);
    scrubValueRef.current = newPos;
  };

  const handleScrubberPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scrubberRef.current) {
      const rect = scrubberRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverPercent(ratio * 100);
      setHoverTime(ratio * (duration || 100));
    }
    if (isScrubbing) {
      const newPos = calculateScrubPosition(e.clientX);
      setScrubValue(newPos);
      scrubValueRef.current = newPos;
    }
  };

  const handleScrubberPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored if capture already released
      }
      setIsScrubbing(false);
      seekTo(scrubValueRef.current);
    }
  };

  const handleScrubberPointerLeave = () => {
    if (!isScrubbing) {
      setHoverPercent(null);
      setHoverTime(null);
    }
  };

  // Keyboard navigation on Scrubber
  const handleScrubberKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      seekTo(Math.max(0, currentTime - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      seekTo(Math.min(duration || 100, currentTime + 5));
    }
  };

  // ──────────────── Volume Slider Pointer & Wheel Handling ────────────────
  const calculateVolumePosition = useCallback((clientX: number) => {
    if (!volumeBarRef.current) return 0;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return parseFloat(ratio.toFixed(2));
  }, []);

  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsVolDragging(true);
    const newVol = calculateVolumePosition(e.clientX);
    setVolume(newVol);
  };

  const handleVolumePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isVolDragging) {
      const newVol = calculateVolumePosition(e.clientX);
      setVolume(newVol);
    }
  };

  const handleVolumePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isVolDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
      setIsVolDragging(false);
    }
  };

  const handleVolumeWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const step = 0.05;
    const current = isMuted ? 0 : volume;
    const next = e.deltaY < 0 ? Math.min(1, current + step) : Math.max(0, current - step);
    setVolume(parseFloat(next.toFixed(2)));
  };

  // ──────────────── Heart / Like Animation ────────────────
  const handleLikeToggle = () => {
    setIsLikeAnimating(true);
    toggleLike();
    setTimeout(() => {
      setIsLikeAnimating(false);
    }, 600);
  };

  // Volume icon resolution
  const effectiveVolume = isMuted ? 0 : volume;
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;
  const trackLiked = currentTrack ? isLiked(currentTrack.id) : false;

  // Progress percentage
  const currentProgressPercent = duration > 0 
    ? Math.max(0, Math.min(100, ((isScrubbing ? scrubValue : currentTime) / duration) * 100))
    : 0;

  return (
    <>
      {/* ──────────────── Embedded Custom Keyframe Animations ──────────────── */}
      <style>{`
        @keyframes playerHeartbeat {
          0% { transform: scale(1); }
          20% { transform: scale(1.38) rotate(-6deg); }
          40% { transform: scale(0.92) rotate(4deg); }
          65% { transform: scale(1.22) rotate(-2deg); }
          85% { transform: scale(0.98); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .anim-heartbeat {
          animation: playerHeartbeat 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      <footer className="h-24 px-4 sm:px-6 md:px-8 border-t border-white/[0.08] dark:border-white/[0.07] bg-m3-surface-container-low/85 dark:bg-[#0c101a]/85 backdrop-blur-2xl flex items-center justify-between z-40 relative select-none shadow-[0_-4px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
        {/* Full-width Ambient Audio Visualizer in PlayerBar Background */}
        <PlayerVisualizerBackground isPlaying={isPlaying} hasTrack={!!currentTrack} />

        {/* Subtle Ambient Laser Edge Glow at top of Player Bar */}
        <div className="absolute inset-x-0 -top-px h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/40 dark:via-blue-400/50 to-transparent pointer-events-none z-10" />
        
        {/* Subtle ambient light gradient sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none z-10" />

        {/* ──────────────── Left Section: Current Song Info ──────────────── */}
        <div className="flex items-center gap-3 sm:gap-4 w-1/4 min-w-[200px] lg:min-w-[260px] z-10">
          {currentTrack ? (
            <>
              {/* Album Art with Floating Glow Aura */}
              <div className="relative group shrink-0 w-13 h-13 sm:w-14 sm:h-14 rounded-m3-md">
                {/* Glow aura behind album art when playing */}
                <div 
                  className={`absolute -inset-1 rounded-m3-md bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 blur-sm opacity-0 transition-opacity duration-500 pointer-events-none ${
                    isPlaying ? 'opacity-40 group-hover:opacity-75' : ''
                  }`} 
                />
                
                <div className="relative w-full h-full rounded-m3-md overflow-hidden bg-m3-surface-container-high border border-white/10 shadow-md">
                  <img
                    src={currentTrack.thumbnail || (currentTrack.id ? `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg` : '')}
                    alt={currentTrack.title}
                    onError={(e) => handleImageError(e, currentTrack?.id)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              {/* Title & Artist */}
              <div className="flex flex-col min-w-0 pr-1 sm:pr-2">
                <div className="flex items-center gap-2">
                  <span 
                    className="text-sm font-bold text-m3-on-surface truncate hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    title={currentTrack.title}
                  >
                    {currentTrack.title}
                  </span>
                </div>

                <span 
                  className="text-xs text-m3-on-surface-variant truncate hover:text-m3-on-surface cursor-pointer transition-colors"
                  title={currentTrack.artist}
                >
                  {currentTrack.artist}
                </span>
              </div>

              {/* Like Button & Quick Download */}
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                {/* Heart Button with Heartbeat Micro-Interaction */}
                <button
                  onClick={handleLikeToggle}
                  title={trackLiked ? 'Unlike track' : 'Add to Liked Songs'}
                  className={`p-2 rounded-full transition-all duration-200 relative group/heart ${
                    trackLiked 
                      ? 'text-rose-500 hover:bg-rose-500/10' 
                      : 'text-m3-on-surface-variant hover:text-rose-400 hover:bg-m3-surface-container'
                  }`}
                  aria-label={trackLiked ? 'Unlike song' : 'Like song'}
                >
                  <Heart
                    className={`w-5 h-5 transition-transform ${
                      isLikeAnimating ? 'anim-heartbeat' : 'active:scale-125'
                    } ${trackLiked ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]' : ''}`}
                  />
                  {/* Subtle sparkle on hover when not liked */}
                  {!trackLiked && (
                    <Sparkles className="w-2.5 h-2.5 absolute top-1 right-1 text-rose-400 opacity-0 group-hover/heart:opacity-100 transition-opacity" />
                  )}
                </button>

                {/* Quick Download Button */}
                {onOpenDownloadModal && (
                  <button
                    onClick={onOpenDownloadModal}
                    title="Download track"
                    className="p-2 rounded-full text-m3-on-surface-variant hover:text-blue-500 dark:hover:text-blue-400 hover:bg-m3-surface-container transition-all"
                    aria-label="Download current track"
                  >
                    <Download className="w-4 h-4 hover:scale-110 active:scale-95 transition-transform" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-m3-md bg-m3-surface-container flex items-center justify-center text-m3-on-surface-variant/40">
                <MusicIcon />
              </div>
              <div className="text-xs text-m3-on-surface-variant/70 italic">No track selected</div>
            </div>
          )}
        </div>

        {/* ──────────────── Center Section: Tactile Controls & Scrubber ──────────────── */}
        <div className="flex flex-col items-center justify-center max-w-xl w-2/4 px-2 sm:px-6 z-10">
          {/* Main Control Buttons Row */}
          <div className="flex items-center gap-2 sm:gap-4 mb-2">
            {/* Shuffle Button */}
            <button
              onClick={toggleShuffle}
              title={isShuffle ? 'Shuffle is ON' : 'Shuffle is OFF'}
              className={`p-2 rounded-full transition-all duration-200 relative ${
                isShuffle
                  ? 'text-blue-500 dark:text-blue-400 bg-blue-500/15 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
              }`}
              aria-label="Toggle shuffle"
            >
              <Shuffle className="w-4 h-4 hover:scale-110 active:scale-95 transition-transform" />
              {isShuffle && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500 dark:bg-blue-400" />
              )}
            </button>

            {/* Previous Track Button */}
            <button
              onClick={prevTrack}
              title="Previous Track"
              className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container hover:scale-110 active:scale-95 transition-all"
              aria-label="Previous track"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Tactile Play / Pause Main Button with Glowing Accent */}
            <div className="relative group/play">
              {/* Glowing halo pulse when playing */}
              {isPlaying && (
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 blur-md opacity-50 group-hover/play:opacity-80 transition-opacity animate-pulse pointer-events-none" />
              )}
              
              <button
                onClick={togglePlay}
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-[0_4px_18px_rgba(59,130,246,0.45)] hover:shadow-[0_6px_26px_rgba(59,130,246,0.65)] hover:scale-108 active:scale-92 transition-all duration-200 border border-white/25 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current transition-transform duration-150 active:scale-90" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5 transition-transform duration-150 active:scale-90" />
                )}
              </button>
            </div>

            {/* Next Track Button */}
            <button
              onClick={nextTrack}
              title="Next Track"
              className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container hover:scale-110 active:scale-95 transition-all"
              aria-label="Next track"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat Mode Cycle Button */}
            <button
              onClick={cycleRepeat}
              title={`Repeat: ${repeatMode.toUpperCase()}`}
              className={`p-2 rounded-full transition-all duration-200 relative ${
                repeatMode !== 'off'
                  ? 'text-blue-500 dark:text-blue-400 bg-blue-500/15 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
              }`}
              aria-label="Cycle repeat mode"
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4 hover:scale-110 active:scale-95 transition-transform" />
              ) : (
                <Repeat className="w-4 h-4 hover:scale-110 active:scale-95 transition-transform" />
              )}
              {repeatMode !== 'off' && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500 dark:bg-blue-400" />
              )}
            </button>
          </div>

          {/* Smooth Scrubber Row with Glowing Thumb & Hover Tooltip */}
          <div className="w-full flex items-center gap-2 sm:gap-3 text-xs text-m3-on-surface-variant font-mono">
            {/* Current Elapsed Time */}
            <span className="w-10 text-right font-medium tabular-nums">
              {formatSeconds(isScrubbing ? scrubValue : currentTime)}
            </span>

            {/* Interactive Timeline Track */}
            <div
              ref={scrubberRef}
              role="slider"
              tabIndex={0}
              aria-label="Audio progress scrubber"
              aria-valuemin={0}
              aria-valuemax={duration || 100}
              aria-valuenow={isScrubbing ? scrubValue : currentTime}
              aria-valuetext={formatSeconds(isScrubbing ? scrubValue : currentTime)}
              onPointerDown={handleScrubberPointerDown}
              onPointerMove={handleScrubberPointerMove}
              onPointerUp={handleScrubberPointerUp}
              onPointerLeave={handleScrubberPointerLeave}
              onKeyDown={handleScrubberKeyDown}
              className="relative flex-1 h-7 flex items-center cursor-pointer group/scrubber focus:outline-none"
            >
              {/* Hover Timestamp Tooltip */}
              {hoverPercent !== null && hoverTime !== null && (
                <div
                  className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-m3-sm bg-m3-surface-container-highest/95 dark:bg-[#182133]/95 backdrop-blur-md border border-white/10 shadow-lg text-[10px] font-mono text-m3-on-surface pointer-events-none transition-all duration-75 z-20 flex flex-col items-center"
                  style={{ left: `${hoverPercent}%` }}
                >
                  <span>{formatSeconds(hoverTime)}</span>
                  <div className="w-1.5 h-1.5 bg-m3-surface-container-highest dark:bg-[#182133] rotate-45 -mb-1 border-r border-b border-white/10" />
                </div>
              )}

              {/* Scrubber Base Track Groove */}
              <div className="w-full h-1.5 group-hover/scrubber:h-2.5 bg-m3-surface-variant/35 dark:bg-white/10 rounded-full overflow-hidden transition-all duration-200 relative">
                {/* Dynamic Progress Fill with glowing gradient */}
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-75 relative"
                  style={{ width: `${currentProgressPercent}%` }}
                />
              </div>

              {/* Glowing Seek Thumb with smooth hover / dragging scale */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white border-2 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9),0_0_4px_white] transition-transform duration-100 pointer-events-none ${
                  isScrubbing
                    ? 'w-4 h-4 scale-125'
                    : 'w-3.5 h-3.5 scale-0 group-hover/scrubber:scale-100'
                }`}
                style={{ left: `${currentProgressPercent}%` }}
              />
            </div>

            {/* Total Duration Time */}
            <span className="w-10 text-left font-medium tabular-nums">
              {formatSeconds(duration)}
            </span>
          </div>
        </div>

        {/* ──────────────── Right Section: Active Glow Lyrics, Queue & Volume ──────────────── */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/4 min-w-[200px] lg:min-w-[260px] z-10">
          {/* Synchronized Lyrics Toggle Button with Active Glow */}
          <button
            onClick={() => toggleLyrics()}
            title="Synchronized Lyrics"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-m3-full text-xs font-medium transition-all duration-200 relative ${
              isLyricsOpen
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_18px_rgba(59,130,246,0.55)] border border-blue-400/40 ring-1 ring-blue-400/50 font-semibold'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface bg-m3-surface-container/50 hover:bg-m3-surface-container border border-transparent hover:border-m3-outline-variant/30'
            }`}
            aria-label="Toggle synchronized lyrics"
          >
            <Mic2 className={`w-4 h-4 ${isLyricsOpen ? 'animate-pulse text-cyan-200' : ''}`} />
            <span className="hidden md:inline">Lyrics</span>
          </button>

          {/* Playback Queue Drawer Toggle Button with Active Glow & Counter */}
          <button
            onClick={() => toggleQueue()}
            title="Playback Queue"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-m3-full text-xs font-medium transition-all duration-200 relative ${
              isQueueOpen
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_18px_rgba(59,130,246,0.55)] border border-blue-400/40 ring-1 ring-blue-400/50 font-semibold'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface bg-m3-surface-container/50 hover:bg-m3-surface-container border border-transparent hover:border-m3-outline-variant/30'
            }`}
            aria-label="Toggle playback queue"
          >
            <ListMusic className="w-4 h-4" />
            <span className="hidden md:inline">Queue</span>
            {queue.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                  isQueueOpen 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'bg-m3-surface-variant text-m3-on-surface'
                }`}
              >
                {queue.length}
              </span>
            )}
          </button>

          {/* Volume Slider with Dynamic Fill Gradient, Mute Toggle & Expansion */}
          <div 
            className="flex items-center gap-2 pl-1 sm:pl-2 relative group/volume"
            onMouseEnter={() => setIsVolHovered(true)}
            onMouseLeave={() => setIsVolHovered(false)}
            onWheel={handleVolumeWheel}
          >
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="text-m3-on-surface-variant hover:text-m3-on-surface p-1.5 rounded-full hover:bg-m3-surface-container transition-all active:scale-90"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <VolumeIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${effectiveVolume === 0 ? 'text-m3-error' : ''}`} />
            </button>

            {/* Expandable Custom Volume Bar */}
            <div
              ref={volumeBarRef}
              role="slider"
              tabIndex={0}
              aria-label="Volume slider"
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={effectiveVolume}
              aria-valuetext={`${Math.round(effectiveVolume * 100)}%`}
              onPointerDown={handleVolumePointerDown}
              onPointerMove={handleVolumePointerMove}
              onPointerUp={handleVolumePointerUp}
              className="relative h-6 flex items-center cursor-pointer w-16 sm:w-20 group-hover/volume:w-24 lg:group-hover/volume:w-28 transition-all duration-300 focus:outline-none"
            >
              {/* Volume Percentage Tooltip on Hover */}
              {isVolHovered && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-m3-sm bg-m3-surface-container-highest/95 dark:bg-[#182133]/95 backdrop-blur-md border border-white/10 shadow-md text-[9px] font-mono text-m3-on-surface pointer-events-none whitespace-nowrap z-20">
                  {Math.round(effectiveVolume * 100)}%
                </div>
              )}

              {/* Volume Groove */}
              <div className="w-full h-1.5 group-hover/volume:h-2 bg-m3-surface-variant/35 dark:bg-white/10 rounded-full overflow-hidden transition-all duration-150 relative">
                {/* Dynamic Fill Gradient */}
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-75"
                  style={{ width: `${effectiveVolume * 100}%` }}
                />
              </div>

              {/* Volume Thumb */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white border-2 border-blue-500 shadow-md transition-transform duration-100 pointer-events-none ${
                  isVolDragging 
                    ? 'w-3.5 h-3.5 scale-110' 
                    : 'w-3 h-3 scale-0 group-hover/volume:scale-100'
                }`}
                style={{ left: `${effectiveVolume * 100}%` }}
              />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

// Fallback music icon if no track selected
function MusicIcon() {
  return (
    <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12 0c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
    </svg>
  );
}
