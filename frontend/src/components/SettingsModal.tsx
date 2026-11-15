import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Volume2,
  Mic2,
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
  AlignLeft,
  AlignCenter,
  Type,
  Copy,
  FileCode,
  BatteryCharging,
  Activity,
  Layers,
  Languages,
  Cpu,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AuthStatus } from '../types';
import {
  LyricsSettings,
  UiSettings,
  LyricsFontSize,
  LyricsAlignment,
  LyricsGlowEffect,
  LyricsLineSpacing,
  LyricsAutoScroll,
  LyricsCopyFormat,
  AuroraIntensity,
  AuroraPalette,
  AuroraMotionSpeed,
  VisualizerOpacity,
  VisualizerStyle,
  ThemeStyle,
  GlassmorphismMode,
  AccentColor,
  getStoredLyricsSettings,
  saveLyricsSettings,
  getStoredUiSettings,
  saveUiSettings,
  SETTINGS_CHANGED_EVENT,
} from '../utils/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
  authStatus?: AuthStatus;
}

export type SettingsTab = 'audio' | 'lyrics' | 'appearance' | 'downloads' | 'system';

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

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  authStatus,
}) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('audio');

  // Audio settings
  const [audioQuality, setAudioQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [stationAutoFill, setStationAutoFill] = useState(true);
  const [normalizeVolume, setNormalizeVolume] = useState(true);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [crossfadeDuration, setCrossfadeDuration] = useState<number>(2);

  // Download settings
  const [downloadFormat, setDownloadFormat] = useState<'mp3' | 'm4a' | 'opus' | 'flac' | 'wav'>('opus');
  const [embedLyrics, setEmbedLyrics] = useState(true);
  const [embedArt, setEmbedArt] = useState(true);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Lyrics settings (Persistent)
  const [lyricsSettings, setLyricsSettingsState] = useState<LyricsSettings>(getStoredLyricsSettings);

  // Deep UI / Appearance settings (Persistent)
  const [uiSettings, setUiSettingsState] = useState<UiSettings>(getStoredUiSettings);

  // Sync settings when modal opens or on external event
  useEffect(() => {
    if (isOpen) {
      setLyricsSettingsState(getStoredLyricsSettings());
      setUiSettingsState(getStoredUiSettings());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleChanged = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.type === 'lyrics') {
        setLyricsSettingsState(custom.detail.settings);
      } else if (custom.detail?.type === 'ui') {
        setUiSettingsState(custom.detail.settings);
      }
    };
    window.addEventListener(SETTINGS_CHANGED_EVENT, handleChanged);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handleChanged);
  }, []);

  // Handlers for updating lyrics settings
  const updateLyrics = (patch: Partial<LyricsSettings>) => {
    const next = saveLyricsSettings(patch);
    setLyricsSettingsState(next);
  };

  // Handlers for updating UI settings
  const updateUi = (patch: Partial<UiSettings>) => {
    const next = saveUiSettings(patch);
    setUiSettingsState(next);
    if (patch.theme && patch.theme !== theme) {
      setTheme(patch.theme);
    }
  };

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
    { id: 'lyrics', label: 'Lyrics Experience', icon: <Mic2 className="w-4 h-4" /> },
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-modal-backdrop"
    >
      <div className="relative w-full max-w-3xl rounded-m3-xl bg-gradient-to-b from-m3-surface-container via-m3-surface-container/95 to-m3-surface-container-high/90 border border-m3-outline-variant/30 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(56,189,248,0.12)] overflow-hidden flex flex-col max-h-[90vh] animate-modal-pop before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-m3-primary/50 before:to-transparent">
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
                  v1.2.0
                </span>
              </div>
              <p className="text-[11px] text-m3-on-surface-variant">
                Material Design 3 Linux Audio Experience & Dynamic Atmosphere
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

        {/* Segmented Control Tabs (5 Tabs) */}
        <div className="px-4 sm:px-6 pt-3 pb-2 shrink-0 border-b border-m3-outline-variant/15 bg-m3-surface-container/40">
          <div className="grid grid-cols-2 sm:grid-cols-5 p-1 rounded-m3-full bg-m3-surface-container-highest/60 border border-m3-outline-variant/25 gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-m3-full text-xs font-semibold transition-all duration-200 select-none ${
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
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
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
                            ? 'border-m3-primary bg-m3-primary-container/30 shadow-[0_0_15px_rgba(102,158,248,0.2)] text-m3-on-surface ring-1 ring-m3-primary'
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

          {/* TAB 2: LYRICS EXPERIENCE */}
          {activeTab === 'lyrics' && (
            <div className="space-y-6">
              {/* 1. Default Font Size Visual Cards */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2.5 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-m3-primary" />
                  Default Lyrics Font Size
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'standard' as LyricsFontSize,
                      name: 'Standard (Default)',
                      scale: 'Compact & Crisp',
                      preview: 'text-lg font-bold',
                      desc: 'Balanced readable lyrics for desktop & windowed listening',
                    },
                    {
                      id: 'large' as LyricsFontSize,
                      name: 'Large',
                      scale: 'Sing-Along Focus',
                      preview: 'text-xl font-extrabold',
                      desc: 'Prominent lyrics sizing with comfortable stanza tracking',
                    },
                    {
                      id: 'mega' as LyricsFontSize,
                      name: 'Mega',
                      scale: 'Cinema Stage',
                      preview: 'text-2xl font-black',
                      desc: 'Bold theater display typography for living room screens',
                    },
                  ].map((sizeOpt) => {
                    const isSelected = lyricsSettings.fontSize === sizeOpt.id;
                    return (
                      <div
                        key={sizeOpt.id}
                        onClick={() => updateLyrics({ fontSize: sizeOpt.id })}
                        className={`p-3.5 rounded-m3-lg border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? 'border-m3-primary bg-m3-primary-container/30 shadow-[0_0_15px_rgba(56,189,248,0.2)] text-m3-on-surface ring-1 ring-m3-primary'
                            : 'border-m3-outline-variant/30 bg-m3-surface-container-high/30 hover:bg-m3-surface-container-high/60 text-m3-on-surface-variant'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-m3-on-surface">
                              {sizeOpt.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-m3-surface-container-highest text-m3-primary font-bold">
                              {sizeOpt.scale}
                            </span>
                          </div>
                          <div className="py-2.5 px-3 rounded bg-m3-surface-container-highest/50 my-1 text-center">
                            <span className={`${sizeOpt.preview} text-m3-primary`}>
                              Aa Live Lyrics
                            </span>
                          </div>
                          <p className="text-xs text-m3-on-surface-variant/80 mt-1 leading-snug">
                            {sizeOpt.desc}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-m3-primary">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active Default</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Lyrics Alignment */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2.5 flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-m3-primary" />
                  Lyrics Text Alignment
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      id: 'center' as LyricsAlignment,
                      label: 'Center (Default)',
                      desc: 'Symmetrical center stage alignment for full-screen music video vibe',
                      icon: <AlignCenter className="w-4 h-4" />,
                    },
                    {
                      id: 'left' as LyricsAlignment,
                      label: 'Left',
                      desc: 'Natural reading rhythm and left-anchored typography',
                      icon: <AlignLeft className="w-4 h-4" />,
                    },
                  ].map((alignOpt) => {
                    const isSelected = lyricsSettings.alignment === alignOpt.id;
                    return (
                      <div
                        key={alignOpt.id}
                        onClick={() => {
                          localStorage.setItem('sonora_lyrics_alignment_user_set', 'true');
                          updateLyrics({ alignment: alignOpt.id });
                        }}
                        className={`p-3.5 rounded-m3-lg border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                          isSelected
                            ? 'border-m3-primary bg-m3-primary-container/30 shadow-[0_0_15px_rgba(56,189,248,0.2)] text-m3-on-surface ring-1 ring-m3-primary'
                            : 'border-m3-outline-variant/30 bg-m3-surface-container-high/30 hover:bg-m3-surface-container-high/60 text-m3-on-surface-variant'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-m3-md ${
                              isSelected ? 'bg-m3-primary text-white' : 'bg-m3-surface-container-highest text-m3-on-surface-variant'
                            }`}
                          >
                            {alignOpt.icon}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-m3-on-surface">{alignOpt.label}</p>
                            <p className="text-xs text-m3-on-surface-variant/80">{alignOpt.desc}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-m3-primary text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Active Line Glow Effect */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-m3-primary" />
                  Active Line Highlight Glow
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'aura' as LyricsGlowEffect,
                      title: 'Luminous Aura (Default)',
                      badge: 'Sonora Glow',
                      desc: 'Diffuse atmospheric light aura and font swell on active lines',
                    },
                    {
                      id: 'subtle' as LyricsGlowEffect,
                      title: 'Subtle Pill',
                      badge: 'Contained',
                      desc: 'Clean rounded pill highlight around text without heavy halo',
                    },
                    {
                      id: 'minimal' as LyricsGlowEffect,
                      title: 'Clean Minimal',
                      badge: 'Crisp',
                      desc: 'Pure high-contrast text brightness with zero shadow bloom',
                    },
                  ].map((glowOpt) => {
                    const isSelected = lyricsSettings.glowEffect === glowOpt.id;
                    return (
                      <div
                        key={glowOpt.id}
                        onClick={() => updateLyrics({ glowEffect: glowOpt.id })}
                        className={`p-3.5 rounded-m3-lg border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? 'border-m3-primary bg-m3-primary-container/30 shadow-[0_0_15px_rgba(56,189,248,0.2)] text-m3-on-surface ring-1 ring-m3-primary'
                            : 'border-m3-outline-variant/30 bg-m3-surface-container-high/30 hover:bg-m3-surface-container-high/60 text-m3-on-surface-variant'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-m3-on-surface">
                            {glowOpt.title}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-m3-primary/15 text-m3-primary font-bold">
                            {glowOpt.badge}
                          </span>
                        </div>
                        <p className="text-xs text-m3-on-surface-variant/80">{glowOpt.desc}</p>
                        {isSelected && (
                          <div className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-m3-primary">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active Effect</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Line Spacing & Auto-Scroll Behavior */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Line Spacing */}
                <div className="p-4 rounded-m3-lg bg-m3-surface-container-high/30 border border-m3-outline-variant/20 space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-m3-primary" />
                    Line Spacing (Stanza Breathing)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'compact' as LyricsLineSpacing, label: 'Compact' },
                      { id: 'standard' as LyricsLineSpacing, label: 'Standard (Default)' },
                      { id: 'relaxed' as LyricsLineSpacing, label: 'Relaxed' },
                    ].map((sp) => {
                      const isSelected = lyricsSettings.lineSpacing === sp.id;
                      return (
                        <button
                          key={sp.id}
                          onClick={() => updateLyrics({ lineSpacing: sp.id })}
                          className={`py-2 px-1 rounded-m3-md text-xs font-bold transition-all text-center ${
                            isSelected
                              ? 'bg-m3-primary text-white shadow-xs'
                              : 'bg-m3-surface-container-highest/60 text-m3-on-surface-variant hover:text-m3-on-surface'
                          }`}
                        >
                          {sp.label.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-m3-on-surface-variant">
                    Controls vertical gap distance between consecutive lyrics lines.
                  </p>
                </div>

                {/* Auto-scroll behavior */}
                <div className="p-4 rounded-m3-lg bg-m3-surface-container-high/30 border border-m3-outline-variant/20 space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-m3-primary" />
                    Auto-Scroll Behavior
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'auto' as LyricsAutoScroll, label: 'Auto-center (Default)' },
                      { id: 'manual' as LyricsAutoScroll, label: 'Free manual scroll' },
                    ].map((sc) => {
                      const isSelected = lyricsSettings.autoScroll === sc.id;
                      return (
                        <button
                          key={sc.id}
                          onClick={() => updateLyrics({ autoScroll: sc.id })}
                          className={`py-2 px-1 rounded-m3-md text-xs font-bold transition-all text-center ${
                            isSelected
                              ? 'bg-m3-primary text-white shadow-xs'
                              : 'bg-m3-surface-container-highest/60 text-m3-on-surface-variant hover:text-m3-on-surface'
                          }`}
                        >
                          {sc.label.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-m3-on-surface-variant">
                    {lyricsSettings.autoScroll === 'auto'
                      ? 'Smoothly centers active line into view automatically.'
                      : 'Free manual navigation without automated viewpoint lock.'}
                  </p>
                </div>
              </div>

              {/* 5. Toggles: Lightweight mode & Romanized & Copy Format */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant block">
                  Performance & Translation
                </label>

                <GlowingSwitch
                  checked={lyricsSettings.lightweightMode}
                  onChange={(checked) => updateLyrics({ lightweightMode: checked })}
                  label="Lightweight Render Mode (Low GPU)"
                  description="Enforces ultra-lightweight rendering: disables text shimmers, zero drop-shadows, and background blurs"
                  icon={<Cpu className="w-4 h-4" />}
                  badge="Battery Saver"
                />

                <GlowingSwitch
                  checked={lyricsSettings.romanized}
                  onChange={(checked) => updateLyrics({ romanized: checked })}
                  label="Romanized (Romaji / Pinyin) Lyrics"
                  description="Automatically request phonetic pronunciation transcriptions when available for Japanese/Korean/Chinese tracks"
                  icon={<Languages className="w-4 h-4" />}
                  badge="Phonetic"
                />

                {/* Copy Format Selection */}
                <div className="p-3.5 rounded-m3-lg bg-m3-surface-container-high/40 border border-m3-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-m3-md bg-m3-surface-container-highest text-m3-primary">
                      <Copy className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-m3-on-surface">Clipboard Copy Format</p>
                      <p className="text-xs text-m3-on-surface-variant">
                        Format applied when clicking the copy button in lyrics header
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-m3-surface-container-highest/80 p-1 rounded-m3-full border border-m3-outline-variant/25">
                    {[
                      { id: 'plain' as LyricsCopyFormat, label: 'Plain Text (Default)', icon: <Copy className="w-3 h-3" /> },
                      { id: 'lrc' as LyricsCopyFormat, label: 'LRC with Timestamps', icon: <FileCode className="w-3 h-3" /> },
                    ].map((fmt) => {
                      const isSelected = lyricsSettings.copyFormat === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          onClick={() => updateLyrics({ copyFormat: fmt.id })}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-m3-full text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-m3-primary text-white shadow-xs'
                              : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                          }`}
                        >
                          {fmt.icon}
                          <span>{fmt.label.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPEARANCE (DEEP UI SETTINGS) */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* SECTION A: AURORA AMBIENT ENGINE */}
              <div className="p-4 rounded-m3-xl bg-m3-surface-container-high/30 border border-m3-outline-variant/20 space-y-4">
                <div className="flex items-center justify-between border-b border-m3-outline-variant/15 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-md">
                      <Sparkles className="w-4 h-4 animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-m3-on-surface">Aurora Ambient Engine</h3>
                      <p className="text-xs text-m3-on-surface-variant">
                        Cinematic diffuse atmospheric lighting that breathes with the music
                      </p>
                    </div>
                  </div>
                  <GlowingSwitch
                    checked={uiSettings.enableAurora}
                    onChange={(checked) => updateUi({ enableAurora: checked })}
                    label=""
                  />
                </div>

                {uiSettings.enableAurora && (
                  <div className="space-y-4 pt-1">
                    {/* Aurora Intensity: Soft 30%, Balanced 60%, Vibrant 90% */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2 block">
                        Aurora Ambient Intensity
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'soft' as AuroraIntensity, label: 'Soft (30%)', bar: 'w-[30%]' },
                          { id: 'balanced' as AuroraIntensity, label: 'Balanced (60% Default)', bar: 'w-[60%]' },
                          { id: 'vibrant' as AuroraIntensity, label: 'Vibrant (90%)', bar: 'w-[90%]' },
                        ].map((intOpt) => {
                          const isSelected = uiSettings.auroraIntensity === intOpt.id;
                          return (
                            <button
                              key={intOpt.id}
                              onClick={() => updateUi({ auroraIntensity: intOpt.id })}
                              className={`p-2.5 rounded-m3-lg border text-left transition-all ${
                                isSelected
                                  ? 'border-m3-primary bg-m3-primary-container/30 text-m3-on-surface ring-1 ring-m3-primary'
                                  : 'border-m3-outline-variant/30 bg-m3-surface-container-high/40 text-m3-on-surface-variant hover:bg-m3-surface-container-high/70'
                              }`}
                            >
                              <span className="text-xs font-bold block">{intOpt.label}</span>
                              <div className="w-full h-1.5 rounded-full bg-m3-surface-container-highest mt-2 overflow-hidden">
                                <div className={`h-full bg-m3-primary rounded-full ${intOpt.bar}`} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Aurora Palette Source */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2 block">
                        Aurora Palette Source
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { id: 'dynamic' as AuroraPalette, name: 'Dynamic (Default)', desc: 'From Cover Art', gradient: 'from-sky-400 via-indigo-500 to-rose-400' },
                          { id: 'cyan' as AuroraPalette, name: 'Electric Cyan', desc: '#06B6D4 / #38BDF8', gradient: 'from-cyan-400 to-sky-600' },
                          { id: 'coral' as AuroraPalette, name: 'Sunset Coral', desc: '#F97316 / #FB7185', gradient: 'from-orange-400 to-rose-500' },
                          { id: 'violet' as AuroraPalette, name: 'Deep Violet', desc: '#8B5CF6 / #A855F7', gradient: 'from-purple-500 to-indigo-600' },
                          { id: 'emerald' as AuroraPalette, name: 'Cyber Emerald', desc: '#10B981 / #34D399', gradient: 'from-emerald-400 to-teal-600' },
                        ].map((pal) => {
                          const isSelected = uiSettings.auroraPalette === pal.id;
                          return (
                            <button
                              key={pal.id}
                              onClick={() => updateUi({ auroraPalette: pal.id })}
                              className={`p-2.5 rounded-m3-lg border text-center flex flex-col items-center gap-1.5 transition-all ${
                                isSelected
                                  ? 'border-m3-primary bg-m3-primary-container/30 ring-1 ring-m3-primary shadow-sm'
                                  : 'border-m3-outline-variant/30 bg-m3-surface-container-high/30 hover:bg-m3-surface-container-high/60'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${pal.gradient} shadow-md border border-white/20`} />
                              <span className="text-[11px] font-bold text-m3-on-surface truncate w-full">
                                {pal.name.split(' ')[0]}
                              </span>
                              <span className="text-[9px] text-m3-on-surface-variant truncate w-full">
                                {pal.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Aurora Motion Speed */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2 block">
                        Aurora Motion Speed
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'calm' as AuroraMotionSpeed, label: 'Calm (Default)', desc: '20s slow drift' },
                          { id: 'fluid' as AuroraMotionSpeed, label: 'Fluid', desc: '9s wave flow' },
                          { id: 'static' as AuroraMotionSpeed, label: 'Static', desc: 'Frozen mesh (0% GPU)' },
                        ].map((spd) => {
                          const isSelected = uiSettings.auroraMotionSpeed === spd.id;
                          return (
                            <button
                              key={spd.id}
                              onClick={() => updateUi({ auroraMotionSpeed: spd.id })}
                              className={`p-2.5 rounded-m3-lg border text-left transition-all ${
                                isSelected
                                  ? 'border-m3-primary bg-m3-primary-container/30 text-m3-on-surface ring-1 ring-m3-primary'
                                  : 'border-m3-outline-variant/30 bg-m3-surface-container-high/40 text-m3-on-surface-variant hover:bg-m3-surface-container-high/70'
                              }`}
                            >
                              <span className="text-xs font-bold block">{spd.label}</span>
                              <span className="text-[10px] text-m3-on-surface-variant/80">{spd.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION B: PLAYERBAR VISUALIZER */}
              <div className="p-4 rounded-m3-xl bg-m3-surface-container-high/30 border border-m3-outline-variant/20 space-y-4">
                <div className="flex items-center justify-between border-b border-m3-outline-variant/15 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-m3-primary/20 flex items-center justify-center text-m3-primary shadow-sm">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-m3-on-surface">PlayerBar Background Visualizer</h3>
                      <p className="text-xs text-m3-on-surface-variant">
                        Live audio equalizer rendered inside the bottom persistent music bar
                      </p>
                    </div>
                  </div>
                  <GlowingSwitch
                    checked={uiSettings.enableVisualizer}
                    onChange={(checked) => updateUi({ enableVisualizer: checked })}
                    label=""
                  />
                </div>

                {uiSettings.enableVisualizer && (
                  <div className="space-y-4 pt-1">
                    {/* Visualizer Opacity: Subtle (15%), Balanced (25% Default), Vivid (40%) */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2 block">
                        Visualizer Opacity
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'subtle' as VisualizerOpacity, label: 'Subtle (15%)', bar: 'opacity-15' },
                          { id: 'balanced' as VisualizerOpacity, label: 'Balanced (25% Default)', bar: 'opacity-25' },
                          { id: 'vivid' as VisualizerOpacity, label: 'Vivid (40%)', bar: 'opacity-40' },
                        ].map((op) => {
                          const isSelected = uiSettings.visualizerOpacity === op.id;
                          return (
                            <button
                              key={op.id}
                              onClick={() => updateUi({ visualizerOpacity: op.id })}
                              className={`p-2.5 rounded-m3-lg border text-left transition-all ${
                                isSelected
                                  ? 'border-m3-primary bg-m3-primary-container/30 text-m3-on-surface ring-1 ring-m3-primary'
                                  : 'border-m3-outline-variant/30 bg-m3-surface-container-high/40 text-m3-on-surface-variant hover:bg-m3-surface-container-high/70'
                              }`}
                            >
                              <span className="text-xs font-bold block">{op.label}</span>
                              <div className="w-full h-1.5 rounded-full bg-m3-surface-container-highest mt-2 overflow-hidden">
                                <div className="h-full bg-m3-primary rounded-full w-full" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Visualizer Style: Frequency Spectrum, Ambient Wave, Minimal Line */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2 block">
                        Visualizer Rendering Style
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          {
                            id: 'spectrum' as VisualizerStyle,
                            title: 'Frequency Spectrum (Default)',
                            desc: '48 dynamic equalizer bars with harmonic bell-curve shaping',
                          },
                          {
                            id: 'wave' as VisualizerStyle,
                            title: 'Ambient Wave',
                            desc: 'Fluid dual-sinusoidal bottom ocean wave without discrete bars',
                          },
                          {
                            id: 'minimal' as VisualizerStyle,
                            title: 'Minimal Line',
                            desc: 'Ultra-thin modern baseline with clean acoustic response',
                          },
                        ].map((vs) => {
                          const isSelected = uiSettings.visualizerStyle === vs.id;
                          return (
                            <button
                              key={vs.id}
                              onClick={() => updateUi({ visualizerStyle: vs.id })}
                              className={`p-3 rounded-m3-lg border text-left transition-all flex flex-col justify-between ${
                                isSelected
                                  ? 'border-m3-primary bg-m3-primary-container/30 text-m3-on-surface ring-1 ring-m3-primary'
                                  : 'border-m3-outline-variant/30 bg-m3-surface-container-high/40 text-m3-on-surface-variant hover:bg-m3-surface-container-high/70'
                              }`}
                            >
                              <span className="text-xs font-bold text-m3-on-surface mb-1">
                                {vs.title}
                              </span>
                              <span className="text-[11px] text-m3-on-surface-variant/80">
                                {vs.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION C: SURFACE & THEME STYLING */}
              <div className="space-y-4">
                {/* 1. Theme selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2.5 block">
                    Surface & Theme Selection
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'dark' as ThemeStyle,
                        name: 'Dark Slate',
                        desc: 'M3 Deep OLED Indigo',
                        icon: <Moon className="w-5 h-5 text-blue-400" />,
                        bg: 'bg-[#0F131D]',
                      },
                      {
                        id: 'light' as ThemeStyle,
                        name: 'Light Frost',
                        desc: 'Crisp Material Surface',
                        icon: <Sun className="w-5 h-5 text-amber-500" />,
                        bg: 'bg-amber-100',
                      },
                      {
                        id: 'amoled' as ThemeStyle,
                        name: 'AMOLED Pitch Black',
                        desc: 'True #000000 Black',
                        icon: <Moon className="w-5 h-5 text-purple-400 fill-current" />,
                        bg: 'bg-black border border-white/20',
                      },
                    ].map((th) => {
                      const isSelected = uiSettings.theme === th.id;
                      return (
                        <button
                          key={th.id}
                          onClick={() => updateUi({ theme: th.id })}
                          className={`flex items-center justify-between p-3.5 rounded-m3-lg border transition-all text-left ${
                            isSelected
                              ? 'border-m3-primary bg-m3-primary-container/30 shadow-[0_0_15px_rgba(56,189,248,0.2)] text-m3-on-surface ring-1 ring-m3-primary'
                              : 'border-m3-outline-variant/30 bg-m3-surface-container-high/30 hover:bg-m3-surface-container-high/60 text-m3-on-surface-variant'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-m3-md ${th.bg}`}>{th.icon}</div>
                            <div>
                              <p className="text-xs font-bold text-m3-on-surface">{th.name}</p>
                              <p className="text-[10px] text-m3-on-surface-variant">{th.desc}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-m3-primary text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Glassmorphism & Blur */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2.5 block">
                    Glassmorphism & Frosted Blur
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'full' as GlassmorphismMode,
                        title: 'Full Glass (Backdrop-blur)',
                        desc: 'High-fidelity 20px blur with saturated specular refraction',
                      },
                      {
                        id: 'subtle' as GlassmorphismMode,
                        title: 'Subtle Glass',
                        desc: 'Refined 8px blur with reduced GPU compositing load',
                      },
                      {
                        id: 'flat' as GlassmorphismMode,
                        title: 'Solid Flat (Low GPU)',
                        desc: 'Opaque clean containers with zero blur calculations',
                      },
                    ].map((gm) => {
                      const isSelected = uiSettings.glassmorphism === gm.id;
                      return (
                        <button
                          key={gm.id}
                          onClick={() => updateUi({ glassmorphism: gm.id })}
                          className={`p-3 rounded-m3-lg border text-left transition-all ${
                            isSelected
                              ? 'border-m3-primary bg-m3-primary-container/30 text-m3-on-surface ring-1 ring-m3-primary'
                              : 'border-m3-outline-variant/30 bg-m3-surface-container-high/40 text-m3-on-surface-variant hover:bg-m3-surface-container-high/70'
                          }`}
                        >
                          <span className="text-xs font-bold block mb-1">{gm.title}</span>
                          <span className="text-[10px] text-m3-on-surface-variant/80">{gm.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Accent Color Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2.5 block">
                    Accent Color Theme
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { id: 'sky' as AccentColor, name: 'Sky Blue (Default)', hex: '#38BDF8', border: 'border-sky-400' },
                      { id: 'purple' as AccentColor, name: 'Electric Purple', hex: '#A855F7', border: 'border-purple-400' },
                      { id: 'rose' as AccentColor, name: 'Rose Pink', hex: '#F43F5E', border: 'border-rose-400' },
                      { id: 'emerald' as AccentColor, name: 'Emerald Green', hex: '#10B981', border: 'border-emerald-400' },
                      { id: 'amber' as AccentColor, name: 'Sunset Amber', hex: '#F59E0B', border: 'border-amber-400' },
                    ].map((acc) => {
                      const isSelected = uiSettings.accentColor === acc.id;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => updateUi({ accentColor: acc.id })}
                          className={`p-3 rounded-m3-lg border text-center flex flex-col items-center gap-2 transition-all ${
                            isSelected
                              ? 'border-m3-primary bg-m3-primary-container/30 ring-1 ring-m3-primary'
                              : 'border-m3-outline-variant/30 bg-m3-surface-container-high/30 hover:bg-m3-surface-container-high/60'
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: acc.hex }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-bold text-m3-on-surface truncate w-full">
                            {acc.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Reduced Motion / Battery Saver */}
                <GlowingSwitch
                  checked={uiSettings.reducedMotion}
                  onChange={(checked) => updateUi({ reducedMotion: checked })}
                  label="Reduced Motion / Battery Saver"
                  description="Disables heavy CSS transforms, keyframe loops, and animated mesh layers for maximum battery efficiency"
                  icon={<BatteryCharging className="w-4 h-4" />}
                  badge="Battery Saver"
                />
              </div>
            </div>
          )}

          {/* TAB 4: DOWNLOADS & CACHE */}
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

          {/* TAB 5: SYSTEM & ACCOUNT */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              {/* YouTube Music Account Banner */}
              <div className="p-4 rounded-m3-lg bg-m3-surface-container-high/40 border border-m3-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-m3-on-surface">YouTube Music Account</h3>
                    <p className="text-xs text-m3-on-surface-variant">
                      {authStatus?.authenticated
                        ? `Connected (${authStatus.authType === 'google_oauth' ? 'Google OAuth' : 'Browser Headers'})`
                        : 'Not connected'}
                    </p>
                  </div>
                </div>

                {onOpenAuth && (
                  <button
                    onClick={onOpenAuth}
                    className={`px-4 py-2 rounded-m3-full text-xs font-bold transition-all shadow-xs active:scale-95 ${
                      authStatus?.authenticated
                        ? 'bg-m3-surface-container-highest text-m3-on-surface hover:bg-m3-surface-variant border border-m3-outline-variant/30'
                        : 'bg-red-600 hover:bg-red-500 text-white'
                    }`}
                  >
                    {authStatus?.authenticated ? 'Manage Account' : 'Sign In'}
                  </button>
                )}
              </div>

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
            <span>Settings saved automatically to local storage</span>
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
