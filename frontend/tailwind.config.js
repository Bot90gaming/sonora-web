/** @type {import('tailwindcss').Config} */

function colorToken(name) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(--md-sys-color-${name}-rgb) / ${opacityValue})`;
    }
    return `var(--md-sys-color-${name}, rgb(var(--md-sys-color-${name}-rgb)))`;
  };
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Material Design 3 Core Tokens (with full alpha opacity modifier support)
        'm3-primary': colorToken('primary'),
        'm3-on-primary': colorToken('onPrimary'),
        'm3-primary-container': colorToken('primaryContainer'),
        'm3-on-primary-container': colorToken('onPrimaryContainer'),
        'm3-inverse-primary': colorToken('inversePrimary'),

        'm3-secondary': colorToken('secondary'),
        'm3-on-secondary': colorToken('onSecondary'),
        'm3-secondary-container': colorToken('secondaryContainer'),
        'm3-on-secondary-container': colorToken('onSecondaryContainer'),

        'm3-tertiary': colorToken('tertiary'),
        'm3-on-tertiary': colorToken('onTertiary'),
        'm3-tertiary-container': colorToken('tertiaryContainer'),
        'm3-on-tertiary-container': colorToken('onTertiaryContainer'),

        'm3-surface': colorToken('surface'),
        'm3-surface-dim': colorToken('surfaceDim'),
        'm3-surface-bright': colorToken('surfaceBright'),
        'm3-surface-container-lowest': colorToken('surfaceContainerLowest'),
        'm3-surface-container-low': colorToken('surfaceContainerLow'),
        'm3-surface-container': colorToken('surfaceContainer'),
        'm3-surface-container-high': colorToken('surfaceContainerHigh'),
        'm3-surface-container-highest': colorToken('surfaceContainerHighest'),
        'm3-surface-variant': colorToken('surfaceVariant'),

        'm3-on-surface': colorToken('onSurface'),
        'm3-on-surface-variant': colorToken('onSurfaceVariant'),
        'm3-inverse-surface': colorToken('inverseSurface'),
        'm3-inverse-on-surface': colorToken('inverseOnSurface'),

        'm3-outline': colorToken('outline'),
        'm3-outline-variant': colorToken('outlineVariant'),

        'm3-error': colorToken('error'),
        'm3-on-error': colorToken('onError'),
        'm3-error-container': colorToken('errorContainer'),
        'm3-on-error-container': colorToken('onErrorContainer'),

        'm3-shadow': colorToken('shadow'),
        'm3-scrim': colorToken('scrim'),

        // Sonora Neon Soundstage Accents
        'sonora-cyan': {
          DEFAULT: '#38BDF8',
          400: '#38BDF8',
          500: '#0EA5E9',
          glow: 'rgba(56, 189, 248, 0.5)',
        },
        'sonora-violet': {
          DEFAULT: '#A855F7',
          400: '#C084FC',
          500: '#A855F7',
          glow: 'rgba(168, 85, 247, 0.5)',
        },
        'sonora-rose': {
          DEFAULT: '#F43F5E',
          400: '#FB7185',
          500: '#F43F5E',
          glow: 'rgba(244, 63, 94, 0.5)',
        },
        'sonora-amber': {
          DEFAULT: '#F59E0B',
          400: '#FBBF24',
          500: '#F59E0B',
        },
        'sonora-emerald': {
          DEFAULT: '#10B981',
          400: '#34D399',
          500: '#10B981',
        },
      },
      borderRadius: {
        'm3-xs': 'var(--md-sys-shape-corner-xs, 4px)',
        'm3-sm': 'var(--md-sys-shape-corner-sm, 8px)',
        'm3-md': 'var(--md-sys-shape-corner-md, 12px)',
        'm3-lg': 'var(--md-sys-shape-corner-lg, 16px)',
        'm3-xl': 'var(--md-sys-shape-corner-xl, 24px)',
        'm3-2xl': 'var(--md-sys-shape-corner-2xl, 32px)',
        'm3-full': 'var(--md-sys-shape-corner-full, 9999px)',
      },
      boxShadow: {
        'm3-1': '0 1px 3px 1px rgba(0, 0, 0, 0.15), 0 1px 2px 0 rgba(0, 0, 0, 0.30)',
        'm3-2': '0 2px 6px 2px rgba(0, 0, 0, 0.15), 0 1px 2px 0 rgba(0, 0, 0, 0.30)',
        'm3-3': '0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px 0 rgba(0, 0, 0, 0.30)',
        'm3-4': '0 6px 10px 4px rgba(0, 0, 0, 0.15), 0 2px 3px 0 rgba(0, 0, 0, 0.30)',
        'm3-5': '0 8px 12px 6px rgba(0, 0, 0, 0.15), 0 4px 4px 0 rgba(0, 0, 0, 0.30)',
        'glow-primary': '0 0 20px -3px rgba(56, 189, 248, 0.45)',
        'glow-primary-lg': '0 0 35px -2px rgba(56, 189, 248, 0.65)',
        'glow-secondary': '0 0 20px -3px rgba(168, 85, 247, 0.45)',
        'glow-accent': '0 0 25px -4px rgba(244, 63, 94, 0.5)',
        'glass-border': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)',
        'glass-elevated': '0 12px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
      },
      transitionTimingFunction: {
        'm3-standard': 'cubic-bezier(0.2, 0.0, 0, 1.0)',
        'm3-emphasized-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
        'm3-emphasized-accelerate': 'cubic-bezier(0.3, 0.0, 0.8, 0.15)',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'equalizer-1': 'equalizer 0.8s ease-in-out infinite alternate',
        'equalizer-2': 'equalizer 1.1s ease-in-out infinite alternate 0.2s',
        'equalizer-3': 'equalizer 0.9s ease-in-out infinite alternate 0.4s',
        'equalizer-4': 'equalizer 1.2s ease-in-out infinite alternate 0.1s',
        'aurora-glow': 'auroraGlow 12s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2.2s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'scale-bounce': 'scaleBounce 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'soundwave': 'soundwave 1.4s ease-in-out infinite alternate',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.88', transform: 'scale(1.02)' },
        },
        glow: {
          '0%': { textShadow: '0 0 10px rgba(56, 189, 248, 0.4), 0 0 20px rgba(56, 189, 248, 0.2)' },
          '100%': { textShadow: '0 0 20px rgba(56, 189, 248, 0.9), 0 0 35px rgba(56, 189, 248, 0.55)' },
        },
        equalizer: {
          '0%': { height: '15%' },
          '100%': { height: '100%' },
        },
        auroraGlow: {
          '0%': { transform: 'translate(0px, 0px) scale(1)', opacity: '0.45' },
          '50%': { transform: 'translate(30px, -20px) scale(1.15)', opacity: '0.75' },
          '100%': { transform: 'translate(-20px, 15px) scale(0.95)', opacity: '0.55' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        scaleBounce: {
          '0%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)' },
        },
        soundwave: {
          '0%': { transform: 'scaleY(0.3)' },
          '100%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
};
