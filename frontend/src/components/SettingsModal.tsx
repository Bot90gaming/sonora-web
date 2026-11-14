import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Volume2,
  Download,
  Radio,
  Sparkles,
  Check,
  Palette,
  HardDrive,
  Headphones,
  Moon,
  Sun,
  Trash2,
  Zap,
  ShieldCheck,
  Music2,
  SlidersHorizontal,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'audio' | 'appearance' | 'downloads' | 'system';

interface GlowingSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
}

const GlowingSwitch: React.FC<GlowingSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  icon,
  badge,
}) => {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="group flex items-center justify-between p-3.5 rounded-m3-lg bg-m3-surface-container-high/40 hover:bg-m3-surface-container-high/70 border border-m3-outline-variant/20 hover:border-m3-outline-variant/40 cursor-pointer transition-all duration-200 select-none"
    >
      <div className="flex items-start gap-3 min-w-0 pr-4">
        {icon && (
          <div
            className={`mt-0.5 p-2 rounded-m3-md transition-colors ${
              checked
                ? 'bg-m3-primary/15 text-m3-primary'
                : 'bg-m3-surface-container-highest text-m3-on-surface-variant group-hover:text-m3-on-surface'
            }`}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-m3-on-surface group-hover:text-m3-primary transition-colors">
              {label}
            </span>
            {badge && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-m3-primary/15 text-m3-primary font-bold uppercase">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-m3-on-surface-variant/80 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Switch Pill */}
      <div className="shrink-0 relative">
        <div
          className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
            checked
              ? 'bg-m3-primary glow-toggle-active'
              : 'bg-m3-surface-variant/80 group-hover:bg-m3-surface-variant'
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center ${
              checked ? 'translate-x-6' : 'translate-x-0'
            }`}
          >
            {checked ? (
              <Check className="w-3 h-3 text-m3-primary stroke-[3]" />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-m3-outline/40" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('audio');

  // Audio settings
  const [audioQuality, setAudioQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [stationAutoFill, setStationAutoFill] = useState(true);
  const [normalizeVolume, setNormalizeVolume] = useState(true);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [crossfadeDuration, setCrossfadeDuration] = useState<number>(2);

  // Appearance settings
  const [enableGlow, setEnableGlow] = useState(true);
  const [dynamicBackdrop, setDynamicBackdrop] = useState(true);
  const [equalizerVisualizer, setEqualizerVisualizer] = useState(true);

  // Download settings
  const [downloadFormat, setDownloadFormat] = useState<'mp3' | 'm4a' | 'opus' | 'flac' | 'wav'>('opus');
  const [embedLyrics, setEmbedLyrics] = useState(true);
  const [embedArt, setEmbedArt] = useState(true);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClearCache = () => {
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'audio', label: 'Audio & Engine', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'downloads', label: 'Downloads & Cache', icon: <Download className="w-4 h-4" /> },
    { id: 'system', label: 'System Info', icon: <SlidersHorizontal className="w-4 h-4" /> },
  ];

  const audioQualityOptions = [
    {
      id: 'high' as const,
      name: 'High Fidelity',
      bitrate: '320 kbps',
      badge: 'FLAC / Opus HQ',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      desc: 'Transparent studio quality with wide dynamic range',
    },
    {
      id: 'medium' as const,
      name: 'Standard Quality',
      bitrate: '192 kbps',
      badge: 'Opus 192k',
      badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      desc: 'Optimal balance of fidelity and low bandwidth',
    },
    {
      id: 'low' as const,
      name: 'Data Saver',
      bitrate: '128 kbps',
      badge: 'AAC 128k',
      badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      desc: 'Lightweight streaming for metered connections',
    },
  ];

  const formatBadges = [
    {
      id: 'mp3' as const,
      name: 'MP3',
      rate: '320 kbps',
      type: 'CBR Audio',
      color: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      desc: 'Universal legacy support',
    },
    {
      id: 'opus' as const,
      name: 'Opus',
      rate: '192 kbps',
      type: 'Next-Gen VBR',
      color: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
      desc: 'Best compression & clarity',
    },
    {
      id: 'flac' as const,
      name: 'FLAC',
      rate: 'Lossless',
      type: '24-bit Hi-Res',
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      desc: 'Audiophile bit-perfect',
    },
    {
      id: 'm4a' as const,
      name: 'M4A',
      rate: '256 kbps',
      type: 'Apple AAC',
      color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      desc: 'Crystal clear vocals',
    },
    {
      id: 'wav' as const,
      name: 'WAV',
      rate: '1411 kbps',
      type: 'Linear PCM',
      color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      desc: 'Raw master uncompressed',
    },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-md animate-modal-backdrop"
    >
      <div className="relative w-full max-w-2xl rounded-m3-xl bg-gradient-to-b from-m3-surface-container via-m3-surface-container/95 to-m3-surface-container-high/90 border border-m3-outline-variant/30 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7),0_0_50px_rgba(45,99,187,0.15)] overflow-hidden flex flex-col max-h-[88vh] animate-modal-pop before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-m3-primary/50 before:to-transparent">
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-m3-outline-variant/20 shrink-0 bg-m3-surface-container/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-m3-md bg-m3-primary/15 flex items-center justify-center text-m3-primary shadow-sm border border-m3-primary/25">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-m3-on-surface tracking-tight">
                  Sonora Preferences
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-m3-primary-container/60 text-m3-on-primary-container border border-m3-primary/20">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-m3-on-surface-variant">
                Material Design 3 Linux Audio Experience
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest transition-all duration-200 active:scale-95 group"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        {/* Segmented Control Tabs */}
        <div className="px-6 pt-4 pb-2 shrink-0 border-b border-m3-outline-variant/15 bg-m3-surface-container/40">
          <div className="grid grid-cols-2 sm:grid-cols-4 p-1 rounded-m3-full bg-m3-surface-container-highest/60 border border-m3-outline-variant/25 gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center justify-center gap-1.5 py-2 px-3 rounded-m3-full text-xs font-semibold transition-all duration-200 select-none ${
                    isActive
                      ? 'bg-m3-primary text-m3-on-primary shadow-md shadow-m3-primary/25'
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high/60'
                  }`}
                >
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* TAB 1: AUDIO & ENGINE */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              {/* Streaming Quality Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2.5 flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-m3-primary" />
                  Streaming Audio Quality
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {audioQualityOptions.map((opt) => {
                    const isSelected = audioQuality === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setAudioQuality(opt.id)}
                        className={`p-3.5 rounded-m3-lg border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? 'border-m3-primary bg-m3-primary-container/30 shadow-[0_0_15px_rgba(102,158,248,0.2)] text-m3-on-surface'
                            : 'border-m3-outline-variant/30 bg-m3-surface-container-high/30 hover:bg-m3-surface-container-high/60 text-m3-on-surface-variant'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <span className="text-sm font-bold text-m3-on-surface">
                            {opt.name}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${opt.badgeColor}`}
                          >
                            {opt.bitrate}
                          </span>
                        </div>
                        <p className="text-xs text-m3-on-surface-variant/80 leading-snug">
                          {opt.desc}
                        </p>
                        {isSelected && (
                          <div className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-m3-primary">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active stream</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Crossfade slider */}
              <div className="p-4 rounded-m3-lg bg-m3-surface-container-high/30 border border-m3-outline-variant/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-m3-on-surface flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-m3-primary" />
                    Gapless Playback & Crossfade
                  </span>
                  <span className="font-mono text-m3-primary font-bold">
                    {crossfadeDuration === 0 ? 'Disabled (Gapless)' : `${crossfadeDuration}s Fade`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="1"
                  value={crossfadeDuration}
                  onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                  className="w-full accent-m3-primary cursor-pointer h-1.5 bg-m3-surface-container-highest rounded-full"
                />
                <p className="text-[11px] text-m3-on-surface-variant">
                  Seamlessly overlaps track transitions for a live radio feel without silence.
                </p>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant block">
                  Playback Dynamics & Automation
                </label>
                <GlowingSwitch
                  checked={stationAutoFill}
                  onChange={setStationAutoFill}
                  label="Sonora Station Mode (Auto-Queue)"
                  description="Automatically fetches and appends related similar songs when reaching the end of queue"
                  icon={<Radio className="w-4 h-4" />}
                  badge="Smart Radio"
                />

                <GlowingSwitch
                  checked={normalizeVolume}
                  onChange={setNormalizeVolume}
                  label="ReplayGain Audio Normalization (-14 LUFS)"
                  description="Dynamically evens out loudness differences across distinct YouTube Music uploads"
                  icon={<Sliders className="w-4 h-4" />}
                  badge="Standard"
                />

                <GlowingSwitch
                  checked={hardwareAcceleration}
                  onChange={setHardwareAcceleration}
                  label="Hardware Audio Pipeline Acceleration"
                  description="Leverages native AudioContext worklet with 24-bit floating point precision"
                  icon={<Zap className="w-4 h-4" />}
                  badge="Hi-Res"
                />
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Mode Segmented Pill */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2.5 block">
                  Color Mode & Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-between p-4 rounded-m3-lg border transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-m3-primary bg-m3-primary-container/30 shadow-[0_0_15px_rgba(102,158,248,0.2)] text-m3-on-surface'
                        : 'border-m3-outline-variant/30 bg-m3-surface-container-high/30 hover:bg-m3-surface-container-high/60 text-m3-on-surface-variant'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-m3-md bg-[#0F131D] text-blue-400 border border-white/10">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-m3-on-surface">Dark Mode</p>
                        <p className="text-xs text-m3-on-surface-variant">M3 Deep OLED Indigo</p>
                      </div>
                    </div>
                    {theme === 'dark' && (
                      <div className="w-6 h-6 rounded-full bg-m3-primary text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-between p-4 rounded-m3-lg border transition-all duration-200 ${
                      theme === 'light'
                        ? 'border-m3-primary bg-m3-primary-container/30 shadow-[0_0_15px_rgba(102,158,248,0.2)] text-m3-on-surface'
                        : 'border-m3-outline-variant/30 bg-m3-surface-container-high/30 hover:bg-m3-surface-container-high/60 text-m3-on-surface-variant'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-m3-md bg-amber-100 text-amber-600 border border-amber-300">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-m3-on-surface">Light Mode</p>
                        <p className="text-xs text-m3-on-surface-variant">Crisp Material Surface</p>
                      </div>
                    </div>
                    {theme === 'light' && (
                      <div className="w-6 h-6 rounded-full bg-m3-primary text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Visual Polish Toggles */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant block">
                  Motion & Visual Effects
                </label>
                <GlowingSwitch
                  checked={enableGlow}
                  onChange={setEnableGlow}
                  label="Luminous Lyrics Aura Glow"
                  description="Cast dynamic glowing light aura and font swell on active synchronized lyrics lines"
                  icon={<Sparkles className="w-4 h-4" />}
                  badge="Sonora Signature"
                />

                <GlowingSwitch
                  checked={dynamicBackdrop}
                  onChange={setDynamicBackdrop}
                  label="Ambient Album Color Reflection"
                  description="Tints drawer backgrounds and player backdrop with dominant hue from currently playing cover art"
                  icon={<Palette className="w-4 h-4" />}
                />

                <GlowingSwitch
                  checked={equalizerVisualizer}
                  onChange={setEqualizerVisualizer}
                  label="Live Equalizer Bars in Player & Queue"
                  description="Real-time multi-band animated soundwave visualizer alongside active tracks"
                  icon={<Sliders className="w-4 h-4" />}
                />
              </div>
            </div>
          )}

          {/* TAB 3: DOWNLOADS & CACHE */}
          {activeTab === 'downloads' && (
            <div className="space-y-6">
              {/* Default Audio Format Pill Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-m3-primary" />
                    Default Audio Download Codec
                  </span>
                  <span className="text-[11px] font-mono text-m3-primary font-bold">
                    FFmpeg & yt-dlp Engine
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {formatBadges.map((fmt) => {
                    const isSelected = downloadFormat === fmt.id;
                    return (
                      <div
                        key={fmt.id}
                        onClick={() => setDownloadFormat(fmt.id)}
                        className={`p-3 rounded-m3-lg border cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-between ${
                          isSelected
                            ? 'border-m3-primary bg-m3-primary-container/40 shadow-[0_0_12px_rgba(102,158,248,0.25)] text-m3-on-surface ring-1 ring-m3-primary'
                            : 'border-m3-outline-variant/30 bg-m3-surface-container-high/30 hover:bg-m3-surface-container-high/60 text-m3-on-surface-variant'
                        }`}
                      >
                        <span
                          className={`text-xs font-mono font-extrabold uppercase px-2 py-0.5 rounded-full border mb-1.5 ${fmt.color}`}
                        >
                          {fmt.name}
                        </span>
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-mono font-bold text-m3-on-surface">
                            {fmt.rate}
                          </p>
                          <p className="text-[10px] text-m3-on-surface-variant/75 truncate">
                            {fmt.type}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="mt-2 w-4 h-4 rounded-full bg-m3-primary text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metadata embedding switches */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant block">
                  Tagging & Audio Enrichment
                </label>
                <GlowingSwitch
                  checked={embedLyrics}
                  onChange={setEmbedLyrics}
                  label="Embed Synced LRC Lyrics into Metadata"
                  description="Writes timed lyrics into ID3v2 USLT / Vorbis comment tags for portable karaoke support"
                  icon={<Music2 className="w-4 h-4" />}
                  badge="LRC"
                />

                <GlowingSwitch
                  checked={embedArt}
                  onChange={setEmbedArt}
                  label="Embed High-Resolution Album Art (1000x1000)"
                  description="Injects front cover art into downloaded files with maximum quality thumbnail extraction"
                  icon={<Sparkles className="w-4 h-4" />}
                />
              </div>

              {/* Cache Management Box */}
              <div className="p-4 rounded-m3-lg bg-m3-surface-container-high/40 border border-m3-outline-variant/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="w-4 h-4 text-m3-primary" />
                    <div>
                      <p className="text-xs font-bold text-m3-on-surface">Local Audio Cache</p>
                      <p className="text-[11px] text-m3-on-surface-variant">
                        Stream segments and cached LRCLIB lyrics
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-m3-on-surface">
                    284.6 MB / 5.0 GB
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-m3-surface-container-highest overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-m3-primary to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: cacheCleared ? '0%' : '14%' }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-m3-on-surface-variant">
                    {cacheCleared ? 'Cache cleared successfully!' : 'Cache automatically prunes files older than 30 days.'}
                  </span>
                  <button
                    onClick={handleClearCache}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-m3-full text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all duration-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cache</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM INFO */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div className="p-4 rounded-m3-lg bg-m3-surface-container-high/40 border border-m3-outline-variant/20 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-m3-primary/20 text-m3-primary flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-m3-on-surface">Sonora Web Architecture</h3>
                    <p className="text-xs text-m3-on-surface-variant">
                      Modernized Linux YouTube Music desktop client ported to Web + React
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2.5 rounded-m3-md bg-m3-surface-container border border-m3-outline-variant/15">
                    <span className="text-m3-on-surface-variant block text-[10px] uppercase font-bold">Frontend Stack</span>
                    <span className="text-m3-on-surface font-semibold">React 18 • TypeScript • Tailwind</span>
                  </div>
                  <div className="p-2.5 rounded-m3-md bg-m3-surface-container border border-m3-outline-variant/15">
                    <span className="text-m3-on-surface-variant block text-[10px] uppercase font-bold">Backend Engine</span>
                    <span className="text-m3-on-surface font-semibold">FastAPI • Python 3.12 • Uvicorn</span>
                  </div>
                  <div className="p-2.5 rounded-m3-md bg-m3-surface-container border border-m3-outline-variant/15">
                    <span className="text-m3-on-surface-variant block text-[10px] uppercase font-bold">Audio Downloader</span>
                    <span className="text-m3-on-surface font-semibold">yt-dlp 2026+ • FFmpeg post-proc</span>
                  </div>
                  <div className="p-2.5 rounded-m3-md bg-m3-surface-container border border-m3-outline-variant/15">
                    <span className="text-m3-on-surface-variant block text-[10px] uppercase font-bold">Synced Lyrics</span>
                    <span className="text-m3-on-surface font-semibold">LRCLIB API • Timestamp parser</span>
                  </div>
                </div>
              </div>

              {/* Keyboard shortcuts */}
              <div className="p-4 rounded-m3-lg bg-m3-surface-container-high/30 border border-m3-outline-variant/20 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant block">
                  Keyboard Shortcuts
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-m3-surface-container/60 border border-m3-outline-variant/10">
                    <span className="text-m3-on-surface-variant">Play / Pause</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-m3-surface-container-highest font-mono text-[11px] font-bold">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-m3-surface-container/60 border border-m3-outline-variant/10">
                    <span className="text-m3-on-surface-variant">Next Track</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-m3-surface-container-highest font-mono text-[11px] font-bold">N / &gt;</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-m3-surface-container/60 border border-m3-outline-variant/10">
                    <span className="text-m3-on-surface-variant">Prev Track</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-m3-surface-container-highest font-mono text-[11px] font-bold">P / &lt;</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-m3-surface-container/60 border border-m3-outline-variant/10">
                    <span className="text-m3-on-surface-variant">Mute / Unmute</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-m3-surface-container-highest font-mono text-[11px] font-bold">M</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-m3-surface-container/60 border border-m3-outline-variant/10">
                    <span className="text-m3-on-surface-variant">Toggle Lyrics</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-m3-surface-container-highest font-mono text-[11px] font-bold">L</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-m3-surface-container/60 border border-m3-outline-variant/10">
                    <span className="text-m3-on-surface-variant">Close Modals</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-m3-surface-container-highest font-mono text-[11px] font-bold">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-16 px-6 border-t border-m3-outline-variant/20 flex items-center justify-between shrink-0 bg-m3-surface-container/70 backdrop-blur-sm">
          <div className="text-xs text-m3-on-surface-variant flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Settings saved automatically</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-m3-full bg-m3-primary text-m3-on-primary text-xs sm:text-sm font-semibold hover:bg-m3-primary/90 shadow-md shadow-m3-primary/25 active:scale-95 transition-all duration-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
