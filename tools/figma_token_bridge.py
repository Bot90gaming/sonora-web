#!/usr/bin/env python3
"""
Sonora Material 3 Design Tokens & Figma Integration Bridge
Exports, validates, and synchronizes Material 3 design tokens between Sonora (PySide6 / QML)
and Figma (Tokens Studio DTCG format & Figma REST Variables API format).
"""

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple


def hex_to_rgb(hex_str: str) -> Tuple[float, float, float]:
    hex_clean = hex_str.lstrip("#")
    if len(hex_clean) == 3:
        hex_clean = "".join(c * 2 for c in hex_clean)
    r = int(hex_clean[0:2], 16) / 255.0
    g = int(hex_clean[2:4], 16) / 255.0
    b = int(hex_clean[4:6], 16) / 255.0
    return r, g, b


def rgb_to_hex(r: float, g: float, b: float) -> str:
    r_int = max(0, min(255, round(r * 255.0)))
    g_int = max(0, min(255, round(g * 255.0)))
    b_int = max(0, min(255, round(b * 255.0)))
    return f"#{r_int:02X}{g_int:02X}{b_int:02X}"


def blend_colors(c1_hex: str, c2_hex: str, weight: float) -> str:
    r1, g1, b1 = hex_to_rgb(c1_hex)
    r2, g2, b2 = hex_to_rgb(c2_hex)
    r = r1 * (1.0 - weight) + r2 * weight
    g = g1 * (1.0 - weight) + g2 * weight
    b = b1 * (1.0 - weight) + b2 * weight
    return rgb_to_hex(r, g, b)


def lighten_color(c_hex: str, factor: float) -> str:
    r, g, b = hex_to_rgb(c_hex)
    r = min(1.0, r + (1.0 - r) * factor)
    g = min(1.0, g + (1.0 - g) * factor)
    b = min(1.0, b + (1.0 - b) * factor)
    return rgb_to_hex(r, g, b)


def darken_color(c_hex: str, factor: float) -> str:
    r, g, b = hex_to_rgb(c_hex)
    r = max(0.0, r * (1.0 - factor))
    g = max(0.0, g * (1.0 - factor))
    b = max(0.0, b * (1.0 - factor))
    return rgb_to_hex(r, g, b)


def get_contrast_text(c_hex: str, is_dark: bool = True) -> str:
    r, g, b = hex_to_rgb(c_hex)
    luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return "#091024" if luminance > 0.42 else "#FFFFFF"


def generate_m3_palette(seed_hex: str = "#3B82F6", is_dark: bool = True) -> Dict[str, str]:
    """Generates the full Material 3 tonal palette matching Sonora's ThemeConfig.qml."""
    if is_dark:
        primary = lighten_color(seed_hex, 0.22)
        primary_container = darken_color(seed_hex, 0.42)
        on_primary = get_contrast_text(primary, is_dark=True)
        on_primary_container = lighten_color(seed_hex, 0.75)
        inverse_primary = darken_color(seed_hex, 0.25)

        secondary = blend_colors("#D8D0E6", seed_hex, 0.15)
        secondary_container = blend_colors("#3C4352", seed_hex, 0.18)
        on_secondary = "#282334"
        on_secondary_container = blend_colors("#E4ECFF", seed_hex, 0.20)

        tertiary = "#F5C2D1"
        tertiary_container = "#5D3744"
        on_tertiary = "#3F1E2A"
        on_tertiary_container = "#FFDCE6"

        error = "#F8B4B4"
        error_container = "#8C1D18"
        on_error = "#560000"
        on_error_container = "#F9DEDC"

        surface = blend_colors("#16181E", seed_hex, 0.07)
        surface_dim = blend_colors("#0E1015", seed_hex, 0.05)
        surface_bright = blend_colors("#363941", seed_hex, 0.09)

        surface_container_lowest = blend_colors("#0A0C10", seed_hex, 0.04)
        surface_container_low = blend_colors("#191C22", seed_hex, 0.06)
        surface_container = blend_colors("#20232A", seed_hex, 0.08)
        surface_container_high = blend_colors("#2A2D35", seed_hex, 0.09)
        surface_container_highest = blend_colors("#353841", seed_hex, 0.11)
        surface_variant = blend_colors("#44474F", seed_hex, 0.14)

        on_surface = "#F4F4FA"
        on_surface_variant = "#D6D8E4"
        inverse_surface = "#F4F4FA"
        inverse_on_surface = "#16181E"

        outline = "#9DA0AA"
        outline_variant = blend_colors("#30333C", seed_hex, 0.12)
        scrim = "#000000"
        shadow = "#000000"
        disabled_surface = "#26262D"
        disabled_text = "#8C8996"
    else:
        primary = darken_color(seed_hex, 0.24)
        primary_container = lighten_color(seed_hex, 0.72)
        on_primary = get_contrast_text(primary, is_dark=False)
        on_primary_container = darken_color(seed_hex, 0.60)
        inverse_primary = lighten_color(seed_hex, 0.35)

        secondary = blend_colors("#4F495E", seed_hex, 0.20)
        secondary_container = blend_colors("#E2D6F5", seed_hex, 0.25)
        on_secondary = "#FFFFFF"
        on_secondary_container = blend_colors("#141021", seed_hex, 0.25)

        tertiary = "#6E4554"
        tertiary_container = "#FFD8E4"
        on_tertiary = "#FFFFFF"
        on_tertiary_container = "#280A16"

        error = "#B3261E"
        error_container = "#F9DEDC"
        on_error = "#FFFFFF"
        on_error_container = "#410E0B"

        surface = blend_colors("#FAF9FD", seed_hex, 0.04)
        surface_dim = blend_colors("#DDD7E0", seed_hex, 0.06)
        surface_bright = "#FFFFFF"

        surface_container_lowest = "#FFFFFF"
        surface_container_low = blend_colors("#F5EFF7", seed_hex, 0.05)
        surface_container = blend_colors("#EFE7F4", seed_hex, 0.07)
        surface_container_high = blend_colors("#E9E1EF", seed_hex, 0.09)
        surface_container_highest = blend_colors("#E3DBE9", seed_hex, 0.11)
        surface_variant = blend_colors("#E1E2EC", seed_hex, 0.14)

        on_surface = "#111216"
        on_surface_variant = "#373A42"
        inverse_surface = "#111216"
        inverse_on_surface = "#F4EFF7"

        outline = "#6B6772"
        outline_variant = blend_colors("#C0BAC6", seed_hex, 0.12)
        scrim = "#000000"
        shadow = "#00000040"
        disabled_surface = "#E2E2E8"
        disabled_text = "#6E6B76"

    return {
        "seed": seed_hex,
        "primary": primary,
        "onPrimary": on_primary,
        "primaryContainer": primary_container,
        "onPrimaryContainer": on_primary_container,
        "inversePrimary": inverse_primary,
        "secondary": secondary,
        "onSecondary": on_secondary,
        "secondaryContainer": secondary_container,
        "onSecondaryContainer": on_secondary_container,
        "tertiary": tertiary,
        "onTertiary": on_tertiary,
        "tertiaryContainer": tertiary_container,
        "onTertiaryContainer": on_tertiary_container,
        "error": error,
        "onError": on_error,
        "errorContainer": error_container,
        "onErrorContainer": on_error_container,
        "surface": surface,
        "surfaceDim": surface_dim,
        "surfaceBright": surface_bright,
        "surfaceContainerLowest": surface_container_lowest,
        "surfaceContainerLow": surface_container_low,
        "surfaceContainer": surface_container,
        "surfaceContainerHigh": surface_container_high,
        "surfaceContainerHighest": surface_container_highest,
        "surfaceVariant": surface_variant,
        "onSurface": on_surface,
        "onSurfaceVariant": on_surface_variant,
        "inverseSurface": inverse_surface,
        "inverseOnSurface": inverse_on_surface,
        "outline": outline,
        "outlineVariant": outline_variant,
        "scrim": scrim,
        "shadow": shadow,
        "disabledSurface": disabled_surface,
        "disabledText": disabled_text,
    }


def build_w3c_design_tokens(seed_hex: str = "#3B82F6") -> Dict[str, Any]:
    """Generates standard W3C Design Tokens Community Group (DTCG) / Tokens Studio JSON."""
    dark_colors = generate_m3_palette(seed_hex, is_dark=True)
    light_colors = generate_m3_palette(seed_hex, is_dark=False)

    tokens = {
        "$schema": "https://design-tokens.github.io/community-group/format/",
        "name": "Sonora Material 3 Design System",
        "version": "1.0.0",
        "md": {
            "sys": {
                "color": {
                    "dark": {
                        k: {"$value": v, "$type": "color"} for k, v in dark_colors.items()
                    },
                    "light": {
                        k: {"$value": v, "$type": "color"} for k, v in light_colors.items()
                    },
                },
                "elevation": {
                    "level0": {"$value": "0dp", "$type": "dimension"},
                    "level1": {"$value": "1dp", "$type": "dimension"},
                    "level2": {"$value": "3dp", "$type": "dimension"},
                    "level3": {"$value": "6dp", "$type": "dimension"},
                    "level4": {"$value": "8dp", "$type": "dimension"},
                    "level5": {"$value": "12dp", "$type": "dimension"},
                },
                "shape": {
                    "corner": {
                        "none": {"$value": "0px", "$type": "dimension"},
                        "extra-small": {"$value": "4px", "$type": "dimension"},
                        "small": {"$value": "8px", "$type": "dimension"},
                        "medium": {"$value": "12px", "$type": "dimension"},
                        "large": {"$value": "16px", "$type": "dimension"},
                        "extra-large": {"$value": "28px", "$type": "dimension"},
                        "full": {"$value": "1000px", "$type": "dimension"},
                    }
                },
                "spacing": {
                    "none": {"$value": "0px", "$type": "dimension"},
                    "xxs": {"$value": "2px", "$type": "dimension"},
                    "xs": {"$value": "4px", "$type": "dimension"},
                    "sm": {"$value": "8px", "$type": "dimension"},
                    "md": {"$value": "12px", "$type": "dimension"},
                    "lg": {"$value": "16px", "$type": "dimension"},
                    "xl": {"$value": "20px", "$type": "dimension"},
                    "xxl": {"$value": "24px", "$type": "dimension"},
                    "xxxl": {"$value": "32px", "$type": "dimension"},
                    "huge": {"$value": "48px", "$type": "dimension"},
                },
                "typescale": {
                    "display-large": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "57px", "$type": "dimension"},
                        "fontWeight": {"$value": "Regular", "$type": "fontWeight"},
                        "lineHeight": {"$value": "64px", "$type": "dimension"},
                        "letterSpacing": {"$value": "-0.25px", "$type": "dimension"},
                    },
                    "display-medium": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "45px", "$type": "dimension"},
                        "fontWeight": {"$value": "Regular", "$type": "fontWeight"},
                        "lineHeight": {"$value": "52px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0px", "$type": "dimension"},
                    },
                    "display-small": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "36px", "$type": "dimension"},
                        "fontWeight": {"$value": "Regular", "$type": "fontWeight"},
                        "lineHeight": {"$value": "44px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0px", "$type": "dimension"},
                    },
                    "headline-large": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "32px", "$type": "dimension"},
                        "fontWeight": {"$value": "SemiBold", "$type": "fontWeight"},
                        "lineHeight": {"$value": "40px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0px", "$type": "dimension"},
                    },
                    "headline-medium": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "28px", "$type": "dimension"},
                        "fontWeight": {"$value": "SemiBold", "$type": "fontWeight"},
                        "lineHeight": {"$value": "36px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0px", "$type": "dimension"},
                    },
                    "headline-small": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "24px", "$type": "dimension"},
                        "fontWeight": {"$value": "Bold", "$type": "fontWeight"},
                        "lineHeight": {"$value": "32px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0px", "$type": "dimension"},
                    },
                    "title-large": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "22px", "$type": "dimension"},
                        "fontWeight": {"$value": "Medium", "$type": "fontWeight"},
                        "lineHeight": {"$value": "28px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0px", "$type": "dimension"},
                    },
                    "title-medium": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "16px", "$type": "dimension"},
                        "fontWeight": {"$value": "Medium", "$type": "fontWeight"},
                        "lineHeight": {"$value": "24px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0.15px", "$type": "dimension"},
                    },
                    "title-small": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "14px", "$type": "dimension"},
                        "fontWeight": {"$value": "Medium", "$type": "fontWeight"},
                        "lineHeight": {"$value": "20px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0.1px", "$type": "dimension"},
                    },
                    "body-large": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "16px", "$type": "dimension"},
                        "fontWeight": {"$value": "Regular", "$type": "fontWeight"},
                        "lineHeight": {"$value": "24px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0.5px", "$type": "dimension"},
                    },
                    "body-medium": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "14px", "$type": "dimension"},
                        "fontWeight": {"$value": "Medium", "$type": "fontWeight"},
                        "lineHeight": {"$value": "20px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0.25px", "$type": "dimension"},
                    },
                    "body-small": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "12px", "$type": "dimension"},
                        "fontWeight": {"$value": "Regular", "$type": "fontWeight"},
                        "lineHeight": {"$value": "16px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0.4px", "$type": "dimension"},
                    },
                    "label-large": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "14px", "$type": "dimension"},
                        "fontWeight": {"$value": "Medium", "$type": "fontWeight"},
                        "lineHeight": {"$value": "20px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0.1px", "$type": "dimension"},
                    },
                    "label-medium": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "12px", "$type": "dimension"},
                        "fontWeight": {"$value": "Medium", "$type": "fontWeight"},
                        "lineHeight": {"$value": "16px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0.5px", "$type": "dimension"},
                    },
                    "label-small": {
                        "fontFamily": {"$value": "Roboto, Cantarell, Noto Sans, sans-serif", "$type": "fontFamily"},
                        "fontSize": {"$value": "11px", "$type": "dimension"},
                        "fontWeight": {"$value": "Medium", "$type": "fontWeight"},
                        "lineHeight": {"$value": "16px", "$type": "dimension"},
                        "letterSpacing": {"$value": "0.5px", "$type": "dimension"},
                    },
                },
                "motion": {
                    "duration": {
                        "short1": {"$value": "50ms", "$type": "duration"},
                        "short2": {"$value": "100ms", "$type": "duration"},
                        "short3": {"$value": "150ms", "$type": "duration"},
                        "short4": {"$value": "200ms", "$type": "duration"},
                        "medium1": {"$value": "250ms", "$type": "duration"},
                        "medium2": {"$value": "300ms", "$type": "duration"},
                        "medium3": {"$value": "350ms", "$type": "duration"},
                        "medium4": {"$value": "400ms", "$type": "duration"},
                        "long1": {"$value": "450ms", "$type": "duration"},
                        "long2": {"$value": "500ms", "$type": "duration"},
                        "extra-long1": {"$value": "700ms", "$type": "duration"},
                    },
                    "easing": {
                        "expressive-fast-spatial": {"$value": [0.2, 0.0, 0.0, 1.0], "$type": "cubicBezier"},
                        "expressive-default-spatial": {"$value": [0.05, 0.7, 0.1, 1.0], "$type": "cubicBezier"},
                        "expressive-slow-spatial": {"$value": [0.05, 0.7, 0.1, 1.0], "$type": "cubicBezier"},
                        "expressive-fast-effects": {"$value": [0.2, 0.0, 0.0, 1.0], "$type": "cubicBezier"},
                        "expressive-default-effects": {"$value": [0.2, 0.0, 0.0, 1.0], "$type": "cubicBezier"},
                    },
                },
                "state": {
                    "hover": {"$value": 0.08, "$type": "number"},
                    "focus": {"$value": 0.12, "$type": "number"},
                    "pressed": {"$value": 0.12, "$type": "number"},
                    "dragged": {"$value": 0.16, "$type": "number"},
                },
            }
        },
    }
    return tokens


def build_figma_variables_payload(seed_hex: str = "#3B82F6") -> Dict[str, Any]:
    """Generates Figma Variables REST API payload (/v1/files/{file_key}/variables)."""
    dark_palette = generate_m3_palette(seed_hex, is_dark=True)
    light_palette = generate_m3_palette(seed_hex, is_dark=False)

    variable_collections = [
        {
            "action": "CREATE",
            "id": "col_m3_colors",
            "name": "Material 3 Colors",
            "initialModeId": "mode_dark",
        }
    ]

    variable_modes = [
        {"action": "CREATE", "id": "mode_dark", "name": "Dark", "variableCollectionId": "col_m3_colors"},
        {"action": "CREATE", "id": "mode_light", "name": "Light", "variableCollectionId": "col_m3_colors"},
    ]

    variables = []
    variable_mode_values = []

    for key in dark_palette.keys():
        var_id = f"var_color_{key}"
        variables.append({
            "action": "CREATE",
            "id": var_id,
            "name": f"md/sys/color/{key}",
            "variableCollectionId": "col_m3_colors",
            "resolvedType": "COLOR",
        })

        dr, dg, db = hex_to_rgb(dark_palette[key])
        lr, lg, lb = hex_to_rgb(light_palette[key])

        variable_mode_values.append({
            "variableId": var_id,
            "modeId": "mode_dark",
            "value": {"r": dr, "g": dg, "b": db, "a": 1.0},
        })
        variable_mode_values.append({
            "variableId": var_id,
            "modeId": "mode_light",
            "value": {"r": lr, "g": lg, "b": lb, "a": 1.0},
        })

    return {
        "variableCollections": variable_collections,
        "variableModes": variable_modes,
        "variables": variables,
        "variableModeValues": variable_mode_values,
    }


def export_tailwind_config(seed_hex: str = "#3B82F6") -> str:
    """Exports tokens as Tailwind CSS v4 / CSS Custom Properties."""
    dark_p = generate_m3_palette(seed_hex, is_dark=True)
    light_p = generate_m3_palette(seed_hex, is_dark=False)

    css_lines = [
        "/* Generated by Sonora Material 3 Figma Bridge */",
        ":root {",
    ]
    for k, v in light_p.items():
        css_lines.append(f"  --md-sys-color-{k}: {v};")
    css_lines.extend([
        "  --md-sys-shape-corner-xs: 4px;",
        "  --md-sys-shape-corner-sm: 8px;",
        "  --md-sys-shape-corner-md: 12px;",
        "  --md-sys-shape-corner-lg: 16px;",
        "  --md-sys-shape-corner-xl: 28px;",
        "  --md-sys-shape-corner-full: 9999px;",
        "}",
        "[data-theme='dark'] {",
    ])
    for k, v in dark_p.items():
        css_lines.append(f"  --md-sys-color-{k}: {v};")
    css_lines.append("}\n")
    return "\n".join(css_lines)


def main():
    parser = argparse.ArgumentParser(description="Sonora Material 3 Design Tokens & Figma Bridge")
    parser.add_argument("--seed", default="#3B82F6", help="Seed accent color (default: #3B82F6)")
    parser.add_argument("--export-tokens", default="tokens/sonora_m3_tokens.json", help="Path to export W3C tokens JSON")
    parser.add_argument("--export-figma", default="tokens/figma_variables_payload.json", help="Path to export Figma API payload")
    parser.add_argument("--export-css", default="tokens/sonora_m3_tokens.css", help="Path to export CSS custom properties")
    parser.add_argument("--print", action="store_true", help="Print generated tokens to stdout")
    args = parser.parse_args()

    project_root = Path(__file__).parent.parent.resolve()
    tokens_dir = project_root / "tokens"
    tokens_dir.mkdir(parents=True, exist_ok=True)

    print(f"[*] Generating Sonora Material 3 Design Tokens (Seed: {args.seed})...")

    # 1. W3C Design Tokens JSON
    w3c_tokens = build_w3c_design_tokens(args.seed)
    w3c_path = project_root / args.export_tokens
    with open(w3c_path, "w", encoding="utf-8") as f:
        json.dump(w3c_tokens, f, indent=2)
    print(f"  ✓ Exported W3C DTCG Tokens: {w3c_path}")

    # 2. Figma Variables API Payload JSON
    figma_payload = build_figma_variables_payload(args.seed)
    figma_path = project_root / args.export_figma
    with open(figma_path, "w", encoding="utf-8") as f:
        json.dump(figma_payload, f, indent=2)
    print(f"  ✓ Exported Figma Variables REST Payload: {figma_path}")

    # 3. CSS / Tailwind Custom Properties
    css_content = export_tailwind_config(args.seed)
    css_path = project_root / args.export_css
    with open(css_path, "w", encoding="utf-8") as f:
        f.write(css_content)
    print(f"  ✓ Exported CSS Variables: {css_path}")

    if args.print:
        print(json.dumps(w3c_tokens["md"]["sys"]["color"]["dark"], indent=2))

    print("\n[SUCCESS] Material 3 design tokens and Figma integration files generated successfully!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
