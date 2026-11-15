/**
 * Sonora Settings Management
 * Handles persistent storage, cross-component reactivity, and DOM styling injection
 * for Lyrics Experience and Deep UI Appearance configurations.
 */

export type LyricsFontSize = 'standard' | 'large' | 'mega';
export type LyricsAlignment = 'left' | 'center';
export type LyricsGlowEffect = 'aura' | 'subtle' | 'minimal';
export type LyricsLineSpacing = 'compact' | 'standard' | 'relaxed';
export type LyricsAutoScroll = 'auto' | 'manual';
export type LyricsCopyFormat = 'plain' | 'lrc';

export interface LyricsSettings {
  fontSize: LyricsFontSize;
  alignment: LyricsAlignment;
  glowEffect: LyricsGlowEffect;
  lineSpacing: LyricsLineSpacing;
  autoScroll: LyricsAutoScroll;
  lightweightMode: boolean;
  romanized: boolean;
  copyFormat: LyricsCopyFormat;
}

export type AuroraIntensity = 'soft' | 'balanced' | 'vibrant'; // 30%, 60%, 90%
export type AuroraPalette = 'dynamic' | 'cyan' | 'coral' | 'violet' | 'emerald';
export type AuroraMotionSpeed = 'calm' | 'fluid' | 'static';

export type VisualizerOpacity = 'subtle' | 'balanced' | 'vivid'; // 15%, 25%, 40%
export type VisualizerStyle = 'spectrum' | 'wave' | 'minimal';

export type ThemeStyle = 'dark' | 'light' | 'amoled'; // Dark Slate, Light Frost, AMOLED Pitch Black
export type GlassmorphismMode = 'full' | 'subtle' | 'flat'; // Full Glass, Subtle Glass, Solid Flat
export type AccentColor = 'sky' | 'purple' | 'rose' | 'emerald' | 'amber'; // Sky Blue, Electric Purple, Rose Pink, Emerald Green, Sunset Amber

export interface UiSettings {
  // Aurora Ambient Engine
  enableAurora: boolean;
  auroraIntensity: AuroraIntensity;
  auroraPalette: AuroraPalette;
  auroraMotionSpeed: AuroraMotionSpeed;

  // PlayerBar Visualizer
  enableVisualizer: boolean;
  visualizerOpacity: VisualizerOpacity;
  visualizerStyle: VisualizerStyle;

  // Surface & Theme Styling
  theme: ThemeStyle;
  glassmorphism: GlassmorphismMode;
  accentColor: AccentColor;
  reducedMotion: boolean;
}

export const SETTINGS_LYRICS_KEY = 'sonora_lyrics_settings';
export const SETTINGS_UI_KEY = 'sonora_ui_settings';
export const SETTINGS_CHANGED_EVENT = 'sonora_settings_changed';

export const DEFAULT_LYRICS_SETTINGS: LyricsSettings = {
  fontSize: 'standard',
  alignment: 'center',
  glowEffect: 'aura',
  lineSpacing: 'standard',
  autoScroll: 'auto',
  lightweightMode: false,
  romanized: false,
  copyFormat: 'plain',
};

export const DEFAULT_UI_SETTINGS: UiSettings = {
  enableAurora: true,
  auroraIntensity: 'balanced',
  auroraPalette: 'dynamic',
  auroraMotionSpeed: 'calm',
  enableVisualizer: true,
  visualizerOpacity: 'balanced',
  visualizerStyle: 'spectrum',
  theme: 'dark',
  glassmorphism: 'full',
  accentColor: 'sky',
  reducedMotion: false,
};

export function getStoredLyricsSettings(): LyricsSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_LYRICS_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_LYRICS_KEY);
    if (!raw) return { ...DEFAULT_LYRICS_SETTINGS };
    const parsed = JSON.parse(raw);
    if (parsed.alignment === 'left' && !localStorage.getItem('sonora_lyrics_alignment_user_set')) {
      parsed.alignment = 'center';
    }
    return {
      ...DEFAULT_LYRICS_SETTINGS,
      ...parsed,
    };
  } catch (e) {
    console.warn('Failed to parse sonora_lyrics_settings', e);
    return { ...DEFAULT_LYRICS_SETTINGS };
  }
}

export function saveLyricsSettings(updates: Partial<LyricsSettings>): LyricsSettings {
  const current = getStoredLyricsSettings();
  const next: LyricsSettings = { ...current, ...updates };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_LYRICS_KEY, JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent(SETTINGS_CHANGED_EVENT, {
          detail: { type: 'lyrics', settings: next },
        })
      );
    } catch (e) {
      console.warn('Failed to save sonora_lyrics_settings', e);
    }
  }
  return next;
}

export function getStoredUiSettings(): UiSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_UI_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_UI_KEY);
    let parsed: Partial<UiSettings> = {};
    if (raw) {
      parsed = JSON.parse(raw);
    }

    // Synchronize legacy sonora_theme if present
    const legacyTheme = localStorage.getItem('sonora_theme');
    if (!parsed.theme && legacyTheme) {
      if (legacyTheme === 'light' || legacyTheme === 'dark' || legacyTheme === 'amoled') {
        parsed.theme = legacyTheme as ThemeStyle;
      }
    }

    return {
      ...DEFAULT_UI_SETTINGS,
      ...parsed,
    };
  } catch (e) {
    console.warn('Failed to parse sonora_ui_settings', e);
    return { ...DEFAULT_UI_SETTINGS };
  }
}

export function applyUiSettingsToDOM(settings: UiSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // 1. Theme application
  root.setAttribute('data-theme', settings.theme);
  if (settings.theme === 'light') {
    root.classList.remove('dark');
    root.classList.remove('amoled');
  } else if (settings.theme === 'amoled') {
    root.classList.add('dark');
    root.classList.add('amoled');
  } else {
    root.classList.add('dark');
    root.classList.remove('amoled');
  }
  localStorage.setItem('sonora_theme', settings.theme);

  // 2. Accent color token
  root.setAttribute('data-accent', settings.accentColor);

  // 3. Glassmorphism mode
  root.setAttribute('data-glass', settings.glassmorphism);

  // 4. Reduced motion & battery saver
  root.setAttribute('data-reduced-motion', settings.reducedMotion ? 'true' : 'false');
  if (settings.reducedMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }

  // 5. Aurora motion speed attribute
  root.setAttribute('data-aurora-motion', settings.auroraMotionSpeed);
}

export function saveUiSettings(updates: Partial<UiSettings>): UiSettings {
  const current = getStoredUiSettings();
  const next: UiSettings = { ...current, ...updates };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_UI_KEY, JSON.stringify(next));
      applyUiSettingsToDOM(next);
      window.dispatchEvent(
        new CustomEvent(SETTINGS_CHANGED_EVENT, {
          detail: { type: 'ui', settings: next },
        })
      );
    } catch (e) {
      console.warn('Failed to save sonora_ui_settings', e);
    }
  }
  return next;
}
