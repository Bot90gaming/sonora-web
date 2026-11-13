# Sonora Desktop UI: Material 3 Design Specifications & Architecture

## 1. Executive Summary & Design System Philosophy

Sonora is a native YouTube Music desktop client engineered with **PySide6** and **Qt Quick / QML**. This specification establishes Sonora's modern interface redesign adhering strictly to **Google's Material Design 3 (Material You)** guidelines and design kit conventions.

The redesign achieves:
- **Dynamic Color Harmony**: Real-time extraction of seed colors from album artwork or user preferences to generate complete tonal palettes (Primary, Secondary, Tertiary, Neutral, Error, and Surface containers).
- **Material 3 Surface Elevation Architecture**: Transitioning from arbitrary drop-shadows to standard tonal elevation surfaces (Level 0 through Level 5) with dark-mode ambient depth.
- **Expressive Micro-interactions & Motion**: Squircle-morphing playback buttons, continuous subpixel typography swell for synced lyrics, luminous diffuse glow auras, and smooth spatial cubic-bezier transitions.
- **Strict Accessibility (WCAG AAA)**: Contrast-adaptive typography calculations ensuring legible text across dynamic palette shifts.
- **Figma Token Synchronization**: Full interoperability with Figma Tokens Studio and the Figma REST Variables API via a dedicated bridge tool.

---

## 2. Material 3 Design Tokens

Sonora’s tokens are implemented in `ui/qml/config/ThemeConfig.qml` and exported via `tools/figma_token_bridge.py` to `tokens/sonora_m3_tokens.json`.

### 2.1 Color & Surface Elevation System

| Token Name | Role / Description | Dark Theme Formula | Light Theme Formula |
| :--- | :--- | :--- | :--- |
| `primary` | Key accent & CTA fill | `lighten(rawSeed, 0.22)` | `darken(rawSeed, 0.24)` |
| `onPrimary` | High-contrast text on primary | Contrast formula (`#091024` or `#FFFFFF`) | Contrast formula (`#091024` or `#FFFFFF`) |
| `primaryContainer` | Highlighted active list row / badge | `darken(rawSeed, 0.42)` | `lighten(rawSeed, 0.72)` |
| `onPrimaryContainer` | Text/icon inside primary container | `lighten(rawSeed, 0.75)` | `darken(rawSeed, 0.60)` |
| `surface` (Level 0) | Base app surface | `blend("#16181E", rawSeed, 0.07)` | `blend("#FAF9FD", rawSeed, 0.04)` |
| `surfaceContainerLow` (Level 1) | Sidebar rail, inactive card surfaces | `blend("#191C22", rawSeed, 0.06)` | `blend("#F5EFF7", rawSeed, 0.05)` |
| `surfaceContainer` (Level 2) | Docked player bar | `blend("#20232A", rawSeed, 0.08)` | `blend("#EFE7F4", rawSeed, 0.07)` |
| `surfaceContainerHigh` (Level 3) | Lyrics container card, dialog cards | `blend("#2A2D35", rawSeed, 0.09)` | `blend("#E9E1EF", rawSeed, 0.09)` |
| `surfaceContainerHighest` (Level 4)| Inactive progress tracks, search bar | `blend("#353841", rawSeed, 0.11)` | `blend("#E3DBE9", rawSeed, 0.11)` |
| `surfaceVariant` | Secondary surface accents | `blend("#44474F", rawSeed, 0.14)` | `blend("#E1E2EC", rawSeed, 0.14)` |
| `outline` | Card borders, dividers | `#9DA0AA` | `#6B6772` |
| `outlineVariant` | Subtle card borders & separators | `blend("#30333C", rawSeed, 0.12)` | `blend("#C0BAC6", rawSeed, 0.12)` |

### 2.2 Shape Scale (Corner Radii)

| Token | Radius | Usage in Sonora |
| :--- | :--- | :--- |
| `shape.none` | `0px` | Full bleed backgrounds |
| `shape.extraSmall` | `4px` | Small tooltips, volume bar indicators |
| `shape.small` | `8px` | Filter chips, queue badges |
| `shape.medium` | `12px` | Track thumbnails, menu popups, dialog items |
| `shape.large` | `16px` | Track row cards, carousel items, paused squircle button |
| `shape.extraLarge` | `28px` | Synced lyrics container card, hero banner cards, dialogs |
| `shape.full` | `1000px` | Navigation rail indicator pill, search bar, active FAB |

### 2.3 Typography Scale

Follows Google Material 3 Type Scale:
- **Display**: Large (57px), Medium (45px), Small (36px) — Hero titles
- **Headline**: Large (32px), Medium (28px), Small (24px) — Now playing track titles
- **Title**: Large (22px), Medium (16px), Small (14px) — Section headers, navigation entries
- **Body**: Large (16px), Medium (14px), Small (12px) — Metadata, artist names, descriptions
- **Label**: Large (14px), Medium (12px), Small (11px) — Chips, badges, timestamps, collapsed rail labels

### 2.4 Motion & Animation Curves

- **Durations**:
  - `short1` (50ms) .. `short4` (200ms): State layers, hover tooltips, click ripples.
  - `medium1` (250ms) .. `medium4` (400ms): Navigation rail expansion, player bar squircle morphing.
  - `long1` (450ms) .. `long2` (500ms): Page cross-fades, lyrics auto-scroll.
  - `extraLong1` (700ms): Ambient background art pulse.
- **Expressive Easing**:
  - `expressiveDefaultSpatialCurve`: `[0.05, 0.7, 0.1, 1.0, 1.0, 1.0]` (springy, responsive positioning)
  - `expressiveFastSpatialCurve`: `[0.2, 0.0, 0.0, 1.0, 1.0, 1.0]` (swift snap)
  - `expressiveDefaultEffectsCurve`: `[0.2, 0.0, 0.0, 1.0, 1.0, 1.0]` (opacity & color fade)

---

## 3. UI Component Redesign Specifications

### 3.1 Collapsible & Expanded Navigation Rail (`NavRail.qml`)

- **Standard Dimensions**:
  - **Collapsed**: 80dp width (standard M3 rail). Centered 56x32dp active indicator pill, 24dp icons, 11dp label underneath.
  - **Expanded**: 256dp width (standard M3 navigation drawer). Horizontal layout with 240x48dp active indicator pill, icon left, 14dp label right.
- **Micro-interactions**:
  - Smooth Bezier transition between 80dp and 256dp.
  - Header hamburger toggle morphs between `menu` and `menu_open`.
  - Settings destination pinned to bottom with dynamic outline separator.
  - Hover and active state layers conform to MD3 opacities (8% hover, 12% pressed).

### 3.2 Docked Player Bar (`PlayerBar.qml`)

- **Surface**: `surfaceContainer` (Level 2 elevation) with 104dp height.
- **Track Artwork & Metadata**:
  - 56x56dp artwork card with animated squircle radius morphing (24dp paused -> 16dp playing).
  - Animated multi-bar equalizer when playing.
  - Smooth metadata cross-fade animation when track changes.
- **Play / Pause FAB Button**:
  - 54x54dp FAB with squircle morphing: smoothly interpolates radius from 27dp (circle) when paused/idle to 18dp (squircle) when active playing.
  - Scale micro-interaction: `1.0` -> `1.05` on hover, `0.92` on press.
  - Integrated loading spinner indicator during track resolution.
- **Expressive Seek Slider**:
  - Expanding track height (8dp idle -> 12dp hovered/pressed).
  - Pill thumb expanding from 18dp to 26dp with white high-contrast border.
- **Secondary Controls**:
  - Heart like button with spring scale pop animation (`1.0` -> `1.35` -> `1.0`).
  - Queue button with active track count badge.
  - Volume slider with interactive mute/unmute icon.
  - Expand button to launch FullPlayerWindow.

### 3.3 Fullscreen Now Playing & Synced Lyrics View (`FullPlayerWindow.qml`)

- **Modal Presentation**:
  - Fullscreen slide-up presentation from bottom with `Escape` shortcut dismiss.
  - Full-bleed ambient blurred album art (`FastBlur`, radius 96) combined with 3-stop vertical gradient scrim.
- **Left Column (Vinyl Turntable & Controls)**:
  - Circular framed artwork with inner vinyl groove border and drop shadow.
  - Interactive linear progress seek bar.
  - Full transport controls, volume slider, and repeat/shuffle/radio buttons.
- **Right Column (Synced Lyrics Container)**:
  - Material 3 `surfaceContainerHigh` card with `shape.extraLarge` (28dp) radius and subtle outline.
  - Auto-scrolling `ListView` synced to playback position (`positionMs`).
  - **Active Line Highlighting**:
    1. **Ambient Diffuse Glowing Light Beam Aura**: Horizontal gradient aura pulsing between 55% and 100% opacity.
    2. **Core Focused Luminous Pill**: Border highlight (`border.width: 1.5`) with left vertical beacon indicator pill.
    3. **Subpixel Typography Swell & Glide**: Active text smoothly swells by +4.0 font size equivalent with cubic ease-out, then gently glides back over the duration of the lyric phrase.
    4. **Interactive Seek**: Clicking any lyric line immediately seeks playback to that exact timestamp.
    5. **Loading & Empty States**: Clean M3 illustrations and circular loading spinner.

---

## 4. Figma Integration Workflow

1. **Tokens Studio Export**:
   Run `tools/figma_token_bridge.py` to produce `tokens/sonora_m3_tokens.json`. Import this file into Figma via the Tokens Studio plugin or Figma Variables API.
2. **Dynamic Tonal Palette Preview**:
   Specify `--seed <hex>` to preview how the interface dynamically adapts to artist artwork colors (e.g. YouTube Red `#E50914`, Emerald Green `#1DB954`, Ocean Blue `#3B82F6`).
3. **Automated Verification**:
   Run `python3 test_m3_design_showcase.py` to generate native Qt Quick renders and verify against Figma component designs.
