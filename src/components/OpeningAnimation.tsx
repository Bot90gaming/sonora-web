import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';

interface OpeningAnimationProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export const OpeningAnimation: React.FC<OpeningAnimationProps> = ({
  onComplete,
  forceShow = false,
}) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Check URL query parameters for freeze or manual control
  const isFrozen = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('opening') === 'freeze' || params.get('freeze') === 'true';
    }
    return false;
  }, []);

  useEffect(() => {
    // If frozen via URL for automated screenshot capture, set to rich reveal state and halt
    if (isFrozen) {
      setProgress(85);
      return;
    }

    // Progress counter animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const delta = Math.floor(Math.random() * 8) + 4;
        return Math.min(100, prev + delta);
      });
    }, 90);

    const timerExit = setTimeout(() => {
      handleComplete();
    }, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(timerExit);
    };
  }, [isFrozen]);

  const handleComplete = () => {
    if (isFrozen && !forceShow) return;
    setIsExiting(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 650);
  };

  // Status message based on progress
  const statusMessage = useMemo(() => {
    if (progress < 25) return 'Calibrating acoustic dynamics...';
    if (progress < 60) return 'Loading high-fidelity audio engine...';
    if (progress < 90) return 'Synthesizing synced lyric stream...';
    return 'Welcome to Sonora';
  }, [progress]);

  // Array of 28 dynamic equalizer bars with varied heights and speeds
  const equalizerBars = useMemo(
    () => [
      { h: 35, d: '0.6s' }, { h: 55, d: '0.8s' }, { h: 80, d: '0.5s' }, { h: 40, d: '0.9s' },
      { h: 70, d: '0.7s' }, { h: 95, d: '0.6s' }, { h: 60, d: '0.8s' }, { h: 85, d: '0.5s' },
      { h: 50, d: '0.9s' }, { h: 100, d: '0.7s' }, { h: 75, d: '0.6s' }, { h: 90, d: '0.8s' },
      { h: 65, d: '0.5s' }, { h: 80, d: '0.7s' }, { h: 70, d: '0.6s' }, { h: 95, d: '0.8s' },
      { h: 85, d: '0.5s' }, { h: 60, d: '0.9s' }, { h: 100, d: '0.7s' }, { h: 75, d: '0.6s' },
      { h: 90, d: '0.8s' }, { h: 50, d: '0.5s' }, { h: 85, d: '0.7s' }, { h: 65, d: '0.9s' },
      { h: 45, d: '0.6s' }, { h: 70, d: '0.8s' }, { h: 55, d: '0.5s' }, { h: 30, d: '0.7s' },
    ],
    []
  );

  return (
    <div
      onClick={handleComplete}
      onTouchStart={handleComplete}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden bg-[#0A0D14] text-white transition-all duration-700 ease-out cursor-pointer ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full bg-blue-600/15 blur-[120px] animate-float-ambient" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[70vw] h-[70vw] rounded-full bg-indigo-600/15 blur-[140px] animate-float-ambient" style={{ animationDelay: '-6s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-purple-600/10 blur-[100px] animate-pulse-subtle" />
      </div>

      {/* Acoustic concentric soundwave rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-[280px] h-[280px] rounded-full border border-blue-500/20 animate-soundwave-ripple" style={{ animationDelay: '0s' }} />
        <div className="w-[280px] h-[280px] rounded-full border border-indigo-500/20 animate-soundwave-ripple" style={{ animationDelay: '0.9s' }} />
        <div className="w-[280px] h-[280px] rounded-full border border-purple-500/15 animate-soundwave-ripple" style={{ animationDelay: '1.8s' }} />
      </div>

      {/* Center Cinematic Container */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6">
        {/* Sonora Squircle Logo with Soundwave Equalizer */}
        <div className="relative mb-8 group">
          {/* Luminous blur aura */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 rounded-[28px] blur-2xl opacity-75 animate-pulse-subtle" />
          
          {/* Outer Squircle Container */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] bg-gradient-to-b from-[#251C48] to-[#0F0C1E] p-1 shadow-2xl border border-white/15 flex items-center justify-center overflow-hidden">
            {/* Gloss sheen overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-white/5 to-transparent pointer-events-none rounded-[27px]" />

            {/* Central Equalizer Soundwaves (Authentic Sonora 7-bar wave from icon.svg) */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 h-16 w-full px-4 z-10">
              <span className="w-1.5 sm:w-2 bg-gradient-to-t from-indigo-500 via-purple-300 to-white rounded-full animate-eq-bar-1 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
              <span className="w-1.5 sm:w-2 bg-gradient-to-t from-indigo-500 via-purple-300 to-white rounded-full animate-eq-bar-2 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
              <span className="w-1.5 sm:w-2 bg-gradient-to-t from-indigo-500 via-purple-300 to-white rounded-full animate-eq-bar-3 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />
              <span className="w-2 sm:w-2.5 bg-gradient-to-t from-blue-400 via-indigo-300 to-white rounded-full animate-eq-bar-4 shadow-[0_0_14px_rgba(196,181,253,1)]" />
              <span className="w-1.5 sm:w-2 bg-gradient-to-t from-indigo-500 via-purple-300 to-white rounded-full animate-eq-bar-3 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />
              <span className="w-1.5 sm:w-2 bg-gradient-to-t from-indigo-500 via-purple-300 to-white rounded-full animate-eq-bar-2 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
              <span className="w-1.5 sm:w-2 bg-gradient-to-t from-indigo-500 via-purple-300 to-white rounded-full animate-eq-bar-1 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
            </div>
          </div>
        </div>

        {/* Sonora Typography */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-purple-200 drop-shadow-[0_0_24px_rgba(99,102,241,0.5)]">
            SONORA
          </h1>
          <p className="text-xs sm:text-sm tracking-[0.18em] uppercase text-indigo-200/80 font-medium flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>High Fidelity Music System</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          </p>
        </div>

        {/* Acoustic Spectrum Frequency Bar Visualizer */}
        <div className="flex items-end justify-center gap-[3px] h-9 w-64 mb-6">
          {equalizerBars.map((bar, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-gradient-to-t from-blue-600 via-indigo-400 to-purple-300 opacity-80"
              style={{
                height: `${bar.h}%`,
                animation: `eqBar ${bar.d} ease-in-out infinite alternate`,
                animationDelay: `${(i % 5) * 0.15}s`,
              }}
            />
          ))}
        </div>

        {/* Neon Progress Bar Container */}
        <div className="w-64 sm:w-72 space-y-2">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-[1px] backdrop-blur-md">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-200 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono">
            <span className="truncate">{statusMessage}</span>
            <span className="text-indigo-300 font-semibold">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Hint / Skip Action */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2 text-xs text-gray-500 font-sans">
        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          Click anywhere or tap to start
        </span>
      </div>
    </div>
  );
};
