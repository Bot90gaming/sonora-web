# 🎵 Sonora Design System: Material Design 3 & YouTube Music Expressive

Welcome to the **Sonora Design System**, an expressive, audio-first design specification inspired by modern **YouTube Music** and **Material Design 3 (M3) Expressive**.

Sonora is engineered for maximum visual clarity, tactile depth, cinematic immersion, and seamless contrast across both Dark (Midnight Obsidian Soundstage) and Light (Luminous Slate) modes.

---

## 🎨 1. Color Palette & Tonal System

Sonora uses high-contrast electric neon accents against deep obsidian tonal layers in dark mode, and a luminous cool-slate palette in light mode.

### 🌌 Dark Mode: Midnight Obsidian Soundstage (`[data-theme='dark']`)

| Token | Class | CSS Var | Hex | RGB | Usage |
|---|---|---|---|---|---|
| **Primary** | `text-m3-primary`, `bg-m3-primary` | `--md-sys-color-primary` | `#38BDF8` | `56 189 248` | Electric Cyan-Azure: Play buttons, active indicators, scrubber progress, hero glow |
| **On Primary** | `text-m3-on-primary` | `--md-sys-color-onPrimary` | `#031726` | `3 23 38` | Ultra-deep navy text for contrast on bright cyan pills |
| **Primary Container** | `bg-m3-primary-container` | `--md-sys-color-primaryContainer` | `#0F3B66` | `15 59 102` | Deep cobalt backing for active navigation items |
| **On Primary Container** | `text-m3-on-primary-container` | `--md-sys-color-onPrimaryContainer` | `#E0F2FE` | `224 242 254` | Glowing soft cyan text on primary containers |
| **Secondary** | `text-m3-secondary` | `--md-sys-color-secondary` | `#A855F7` | `168 85 247` | Radiant Electric Violet: Station / Radio mode, badges |
| **Tertiary** | `text-m3-tertiary` | `--md-sys-color-tertiary` | `#F43F5E` | `244 63 94` | Neon Hot Rose: Favorites, Liked songs, active recording |
| **Surface (Base)** | `bg-m3-surface` | `--md-sys-color-surface` | `#0A0E17` | `10 14 23` | Deepest pitch void indigo (main background) |
| **Surface Dim** | `bg-m3-surface-dim` | `--md-sys-color-surfaceDim` | `#06090F` | `6 9 15` | Recessed stage background |
| **Surface Container Lowest**| `bg-m3-surface-container-lowest` | `--md-sys-color-surfaceContainerLowest` | `#04060A` | `4 6 10` | Nav rail & sidebar background |
| **Surface Container Low** | `bg-m3-surface-container-low` | `--md-sys-color-surfaceContainerLow` | `#0E1320` | `14 19 32` | Player bar, search suggestion panels |
| **Surface Container** | `bg-m3-surface-container` | `--md-sys-color-surfaceContainer` | `#141B2D` | `20 27 45` | Standard card surfaces, list rows, dialogue panels |
| **Surface Container High**| `bg-m3-surface-container-high` | `--md-sys-color-surfaceContainerHigh` | `#1A233A` | `26 35 58` | Hovered items, elevated cards |
| **Surface Container Highest**| `bg-m3-surface-container-highest`| `--md-sys-color-surfaceContainerHighest`| `#232F4C` | `35 47 76` | Active chips, elevated modals |
| **Surface Variant** | `bg-m3-surface-variant` | `--md-sys-color-surfaceVariant` | `#2A3757` | `42 55 87` | Track progress rail, subtle dividers |
| **On Surface (Text Primary)**| `text-m3-on-surface` | `--md-sys-color-onSurface` | `#F8FAFC` | `248 250 252` | Crisp off-white text (Slate 50) |
| **On Surface Variant** | `text-m3-on-surface-variant` | `--md-sys-color-onSurfaceVariant` | `#94A3B8` | `148 163 184` | Secondary text, artists, timestamps (Slate 400) |
| **Outline** | `border-m3-outline` | `--md-sys-color-outline` | `#475569` | `71 85 105` | Active focus borders, clear borders |
| **Outline Variant** | `border-m3-outline-variant` | `--md-sys-color-outlineVariant` | `#1E293B` | `30 41 59` | Ultra-fine translucent borders (supports `/10`, `/20`, `/30`) |

### ☀️ Light Mode: Luminous Slate (`[data-theme='light']`)

| Token | Class | Hex | RGB | Usage |
|---|---|---|---|---|
| **Primary** | `text-m3-primary`, `bg-m3-primary` | `#0284C7` | `2 132 199` | Sky 600 royal electric blue |
| **Primary Container** | `bg-m3-primary-container` | `#E0F2FE` | `224 242 254` | Soft sky blue backing |
| **On Primary Container** | `text-m3-on-primary-container` | `#0369A1` | `3 105 161` | Sky 700 text |
| **Surface (Base)** | `bg-m3-surface` | `#F8FAFC` | `248 250 252` | Slate 50 clean surface |
| **Surface Container Low** | `bg-m3-surface-container-low` | `#F1F5F9` | `241 245 249` | Subtle dock & bar container |
| **Surface Container** | `bg-m3-surface-container` | `#E8EEF5` | `232 238 245` | Main card background |
| **On Surface** | `text-m3-on-surface` | `#0F172A` | `15 23 42` | Slate 900 high contrast text |
| **On Surface Variant** | `text-m3-on-surface-variant` | `#475569` | `71 85 105` | Slate 600 secondary text |
| **Outline Variant** | `border-m3-outline-variant` | `#E2E8F0` | `226 232 240` | Subtle clean borders |

> [!TIP]
> **Full Opacity Modifier Support**:
> Every M3 color class now natively supports Tailwind opacity modifiers (e.g. `bg-m3-surface-container/60`, `border-m3-outline-variant/30`, `text-m3-on-surface-variant/70`, `bg-m3-primary/10`).

---

## 🔤 2. Typography Hierarchy

Sonora pairs **Plus Jakarta Sans** for modern geometric UI typography with **JetBrains Mono** for numerical accuracy and audio scrubbers.

- **Primary Font**: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
  - Enabled font features: `'cv02', 'cv03', 'cv04', 'cv11', 'tnum'` (tabular numbers for non-jittering timers).
- **Monospace Font**: `'JetBrains Mono', ui-monospace, monospace` (track timers, bitrates, audio formats).

### Typography Scale
- **Display Large** (`text-3xl sm:text-4xl font-extrabold tracking-tight`): Hero album & playlist titles.
- **Headline Medium** (`text-2xl font-bold tracking-tight text-m3-on-surface`): Section headers (e.g. "Quick Picks", "Trending Now").
- **Title Medium** (`text-base font-semibold text-m3-on-surface`): Track card titles, modal titles.
- **Body Medium** (`text-sm text-m3-on-surface-variant`): Artist credits, playlist descriptions.
- **Caption / Label** (`text-xs font-medium text-m3-on-surface-variant`): Timers, format badges, track count.
- **Overline** (`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider`): Category headers, "SYNCED" badges.

---

## 🫧 3. Glassmorphism, Shadows & Glow Tokens

### 🔮 Surface Elevations & Shadows
- `shadow-m3-1`: Elevation 1 — Subtle card resting state
- `shadow-m3-2`: Elevation 2 — Floating bar, tooltip
- `shadow-m3-3`: Elevation 3 — Elevated card hover, popover
- `shadow-m3-4`: Elevation 4 — Drawer, modal dialogue
- `shadow-m3-5`: Elevation 5 — Maximum elevation, spotlight overlays

### 💡 Glow Aura Tokens
- `shadow-glow-primary`: `0 0 20px -3px rgba(56, 189, 248, 0.45)` (Play button glow, active focus)
- `shadow-glow-primary-lg`: `0 0 35px -2px rgba(56, 189, 248, 0.65)` (Now playing hero aura)
- `shadow-glow-secondary`: `0 0 20px -3px rgba(168, 85, 247, 0.45)` (Station / Radio aura)
- `shadow-glow-accent`: `0 0 25px -4px rgba(244, 63, 94, 0.5)` (Liked songs / Heart pulse)

### 🪟 Glass Utilities
- `.glass-panel`: Translucent 20px blurred backdrop (`backdrop-filter: blur(20px) saturate(180%)`) with fine 1px border and specular highlight.
- `.glass-pill`: Pill button for chips, search suggestions, and filter tags.
- `.glass-card`: Card element with smooth hover lift (`translateY(-2px)`) and subtle cyan glow border.
- `.ambient-stage-glow`: Soft radial mesh spotlight for atmospheric warmth behind albums and lyrics.

---

## 🎧 4. Audio-Specific Visual Components

1. **Synchronized Lyrics Active Glow (`.lyric-active-glow`)**:
   - High-luminance text glow: `text-shadow: 0 0 14px rgba(56, 189, 248, 0.8), 0 0 32px rgba(56, 189, 248, 0.45)`
   - Scaling: `scale(1.04)` with smooth cubic-bezier easing (`0.16, 1, 0.3, 1`).
2. **Dynamic Range Slider Thumb (`input[type="range"]`)**:
   - Custom 12px pill thumb with `var(--md-sys-color-primary)`.
   - Hover zoom: `scale(1.25)` with glowing shadow aura (`0 0 14px rgba(56, 189, 248, 0.8)`).
3. **Equalizer Soundwave Animations**:
   - `animate-equalizer-1`: 0.8s rhythmic alternate
   - `animate-equalizer-2`: 1.1s rhythmic alternate
   - `animate-equalizer-3`: 0.9s rhythmic alternate
   - `animate-equalizer-4`: 1.2s rhythmic alternate

---

## 🎬 5. Easing & Animation Tokens (For @animator)

| Token | Class / Value | Easing Curve | Purpose |
|---|---|---|---|
| **M3 Standard** | `ease-m3-standard` | `cubic-bezier(0.2, 0.0, 0, 1.0)` | Default UI transitions (color, borders, transforms) |
| **M3 Emphasized Decelerate** | `ease-m3-emphasized-decelerate` | `cubic-bezier(0.05, 0.7, 0.1, 1.0)` | Opening animations, drawers sliding in |
| **M3 Emphasized Accelerate** | `ease-m3-emphasized-accelerate` | `cubic-bezier(0.3, 0.0, 0.8, 0.15)` | Elements dismissing or fading out |
| **Aurora Glow** | `animate-aurora-glow` | `auroraGlow 12s infinite alternate` | Ambient background soundstage motion |
| **Float** | `animate-float` | `float 4s ease-in-out infinite` | Floating artwork badges |
| **Scale Bounce** | `animate-scale-bounce` | `scaleBounce 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)` | Micro-interaction click feedback |
| **Shimmer** | `animate-shimmer` | `shimmer 2.2s linear infinite` | Skeleton loading & glass reflections |

---

## 📐 6. Border Radiuses (M3 Shape Scale)
- `rounded-m3-xs`: 4px (small badges, tags)
- `rounded-m3-sm`: 8px (thumbnail covers, inner badges)
- `rounded-m3-md`: 12px (album art cards, input fields)
- `rounded-m3-lg`: 16px (dialog cards, view sections)
- `rounded-m3-xl`: 24px (drawers, modal sheets)
- `rounded-m3-2xl`: 32px (large hero containers)
- `rounded-m3-full`: 9999px (circular buttons, pills, search bar)
