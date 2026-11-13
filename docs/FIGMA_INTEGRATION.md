# Sonora Material 3 UI: Figma Integration & Token Synchronization Guide

## 1. Overview

Sonora adopts Google's **Material Design 3 (Material You)** design kit conventions. This document defines the bidirectional bridge between Figma design files and Sonora's native PySide6 / Qt Quick QML implementation.

```
┌───────────────────────────┐                ┌──────────────────────────────┐
│  Figma Design System      │                │  Sonora QML Architecture     │
│  (Material 3 UI Kit)      │                │  (PySide6 / Qt Quick)        │
│                           │                │                              │
│  • Variables (Color/Mode) │   Token Sync   │  • ThemeConfig.qml           │
│  • Typography Styles      ├───────────────►│  • NavRail.qml               │
│  • Auto Layout & Radii    │◄───────────────┤  • PlayerBar.qml             │
│  • Component Variants     │  Bridge Script │  • FullPlayerWindow.qml      │
└───────────────────────────┘                └──────────────────────────────┘
```

---

## 2. Token Architecture & Taxonomy

Sonora's design tokens strictly adhere to the **W3C Design Tokens Community Group (DTCG)** specification and the standard Figma Tokens Studio schema.

### Token Files
- **W3C DTCG Format**: `tokens/sonora_m3_tokens.json`
- **Figma Variables API Payload**: `tokens/figma_variables_payload.json`
- **CSS / Web Variables**: `tokens/sonora_m3_tokens.css`
- **QML Source of Truth**: `ui/qml/config/ThemeConfig.qml`

### Token Taxonomy
1. **Color Tokens (`md/sys/color/*`)**:
   - Primary Roles: `primary`, `onPrimary`, `primaryContainer`, `onPrimaryContainer`, `inversePrimary`
   - Secondary Roles: `secondary`, `onSecondary`, `secondaryContainer`, `onSecondaryContainer`
   - Tertiary Roles: `tertiary`, `onTertiary`, `tertiaryContainer`, `onTertiaryContainer`
   - Error Roles: `error`, `onError`, `errorContainer`, `onErrorContainer`
   - Surface Roles: `surface`, `surfaceDim`, `surfaceBright`, `surfaceVariant`, `onSurface`, `onSurfaceVariant`
   - Surface Containers (5 Elevations): `surfaceContainerLowest`, `surfaceContainerLow`, `surfaceContainer`, `surfaceContainerHigh`, `surfaceContainerHighest`
   - Outlines & Scrim: `outline`, `outlineVariant`, `scrim`, `shadow`
2. **Elevation Tokens (`md/sys/elevation/*`)**:
   - `level0` (0dp), `level1` (1dp), `level2` (3dp), `level3` (6dp), `level4` (8dp), `level5` (12dp)
3. **Shape Tokens (`md/sys/shape/corner/*`)**:
   - `none` (0px), `extra-small` (4px), `small` (8px), `medium` (12px), `large` (16px), `extra-large` (28px), `full` (1000px/pill)
4. **Spacing Tokens (`md/sys/spacing/*`)**:
   - 4dp / 8dp grid: `none` (0px), `xxs` (2px), `xs` (4px), `sm` (8px), `md` (12px), `lg` (16px), `xl` (20px), `xxl` (24px), `xxxl` (32px), `huge` (48px)
5. **Typography Tokens (`md/sys/typescale/*`)**:
   - Material 3 Type Scale: `displayLarge/Medium/Small`, `headlineLarge/Medium/Small`, `titleLarge/Medium/Small`, `bodyLarge/Medium/Small`, `labelLarge/Medium/Small`
6. **Motion & Easing (`md/sys/motion/*`)**:
   - Durations: `short1..4` (50–200ms), `medium1..4` (250–400ms), `long1..2` (450–500ms), `extra-long1` (700ms)
   - Expressive Bezier Curves: `expressive-fast-spatial`, `expressive-default-spatial`, `expressive-slow-spatial`, `expressive-fast-effects`, `expressive-default-effects`

---

## 3. Figma Automation via Rube MCP

When connected to Rube MCP with the Composio Figma toolkit (see `/home/hoshirun/.gemini/config/skills/figma-automation`):

### Extracting Tokens from Figma
```python
# 1. Extract tokens from Figma design file
tokens_result = FIGMA_EXTRACT_DESIGN_TOKENS(
    file_key="<figma_file_key>",
    include_local_styles=True,
    include_variables=True
)

# 2. Synchronize extracted tokens into Sonora
# Feed JSON into tools/figma_token_bridge.py
```

### Exporting Tokens into Figma Variables
Use `tools/figma_token_bridge.py`:
```bash
# Generate Figma Variables REST API payload from Sonora
python3 tools/figma_token_bridge.py --seed "#3B82F6" --export-figma tokens/figma_variables_payload.json

# Post payload to Figma REST API endpoint:
# POST https://api.figma.com/v1/files/{file_key}/variables
```

### Visual Regression & Frame Rendering
To verify that QML components visually match Figma components:
1. Call `FIGMA_RENDER_IMAGES_OF_FILE_NODES` with node IDs of the Navigation Rail, Player Bar, and Synced Lyrics frames.
2. Run `test_live_lyrics_runner.py` to capture offscreen native Qt Quick renders.
3. Perform pixel-diff comparison to ensure subpixel fidelity.

---

## 4. Figma to QML Component Mapping Matrix

| Material 3 Component | Figma Component Name | Sonora QML File | Key Tokens & Behaviors |
| :--- | :--- | :--- | :--- |
| **Navigation Rail** | `M3/Navigation-Rail/Standard` | `ui/components/NavRail.qml` | 80dp collapsed width, 56x32dp active pill indicator, 256dp expanded drawer, expressive cubic bezier expand/collapse |
| **Docked Player Bar** | `Sonora/Player/Docked-Bar` | `ui/components/PlayerBar.qml` | `surfaceContainer` card, squircle morphing play button (radius 18dp <-> 27dp), live equalizer indicator, expanding seek thumb |
| **Full Player Sheet** | `Sonora/Player/Fullscreen-Modal` | `ui/components/FullPlayerWindow.qml` | Fullscreen modal with blurred album art background + gradient scrim, vinyl turntable frame, Esc dismiss |
| **Synced Lyrics Card** | `Sonora/Lyrics/Synced-Container` | `ui/components/FullPlayerWindow.qml` | `surfaceContainerHigh` card (extra-large 28dp radius), active line diffuse luminous aura, active beacon pill, subpixel typography swell |
| **Filter / Genre Chips** | `M3/Chip/Filter` | `ui/components/FilterChip.qml` | 32dp height, check icon on select, `secondaryContainer` fill, 8dp radius |
| **Track List Item** | `M3/List/Two-Line` | `ui/components/TrackList.qml` | 84dp height, 16dp rounded card, `surfaceContainerLow` / `primaryContainer` active state, live equalizer |
| **Featured Carousel** | `M3/Card/Elevated-Hero` | `ui/components/FeaturedCarousel.qml` | 28dp extra-large radius, horizontal flickable snap, dynamic gradient scrim |
| **State Layer** | `M3/State-Layer` | `ui/components/StateLayer.qml` | Hover (8%), Focus (12%), Pressed (12%), Dragged (16%) |

---

## 5. Running the Figma Token Bridge

```bash
# Export tokens for default blue accent
python3 tools/figma_token_bridge.py

# Export tokens for YouTube Music red accent
python3 tools/figma_token_bridge.py --seed "#FF0000" --export-tokens tokens/sonora_m3_tokens_red.json

# Export CSS custom properties
python3 tools/figma_token_bridge.py --export-css tokens/sonora_m3_tokens.css
```
