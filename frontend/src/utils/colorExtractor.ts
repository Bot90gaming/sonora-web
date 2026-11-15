import { useState, useEffect } from 'react';

export interface AuroraPalette {
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
  backgroundRgba: string;
}

/**
 * Curated harmonic aurora themes mapped to vibrant color spectrums:
 * electric blues, deep purples, emerald teals, sunset roses, warm ambers, neon cyans.
 */
export const CURATED_AURORA_THEMES: AuroraPalette[] = [
  // 1. Borealis Emerald & Cyan
  {
    primary: 'rgba(16, 185, 129, 0.55)',
    secondary: 'rgba(6, 182, 212, 0.50)',
    tertiary: 'rgba(99, 102, 241, 0.45)',
    accent: 'rgba(52, 211, 153, 0.45)',
    backgroundRgba: 'rgba(6, 20, 24, 0.88)',
  },
  // 2. Cyber Magenta & Electric Violet
  {
    primary: 'rgba(217, 70, 239, 0.55)',
    secondary: 'rgba(124, 58, 237, 0.50)',
    tertiary: 'rgba(56, 189, 248, 0.45)',
    accent: 'rgba(236, 72, 153, 0.45)',
    backgroundRgba: 'rgba(18, 10, 28, 0.88)',
  },
  // 3. Sunset Rose & Warm Amber
  {
    primary: 'rgba(244, 63, 94, 0.55)',
    secondary: 'rgba(249, 115, 22, 0.50)',
    tertiary: 'rgba(168, 85, 247, 0.45)',
    accent: 'rgba(251, 191, 36, 0.45)',
    backgroundRgba: 'rgba(26, 10, 18, 0.88)',
  },
  // 4. Arctic Ice & Cobalt Blue
  {
    primary: 'rgba(14, 165, 233, 0.55)',
    secondary: 'rgba(59, 130, 246, 0.50)',
    tertiary: 'rgba(20, 184, 166, 0.45)',
    accent: 'rgba(147, 197, 253, 0.45)',
    backgroundRgba: 'rgba(8, 18, 30, 0.88)',
  },
  // 5. Deep Nebula & Indigo
  {
    primary: 'rgba(139, 92, 246, 0.55)',
    secondary: 'rgba(79, 70, 229, 0.50)',
    tertiary: 'rgba(236, 72, 153, 0.45)',
    accent: 'rgba(34, 211, 238, 0.45)',
    backgroundRgba: 'rgba(14, 11, 28, 0.88)',
  },
  // 6. Solar Flare & Tangerine
  {
    primary: 'rgba(245, 158, 11, 0.55)',
    secondary: 'rgba(239, 68, 68, 0.50)',
    tertiary: 'rgba(234, 88, 12, 0.45)',
    accent: 'rgba(253, 224, 71, 0.45)',
    backgroundRgba: 'rgba(24, 14, 8, 0.88)',
  },
  // 7. Mystic Teal & Lime Spark
  {
    primary: 'rgba(13, 148, 136, 0.55)',
    secondary: 'rgba(16, 185, 129, 0.50)',
    tertiary: 'rgba(6, 182, 212, 0.45)',
    accent: 'rgba(132, 204, 22, 0.40)',
    backgroundRgba: 'rgba(6, 22, 20, 0.88)',
  },
  // 8. Synthwave Pulse & Hot Pink
  {
    primary: 'rgba(236, 72, 153, 0.55)',
    secondary: 'rgba(99, 102, 241, 0.50)',
    tertiary: 'rgba(6, 182, 212, 0.45)',
    accent: 'rgba(244, 114, 182, 0.45)',
    backgroundRgba: 'rgba(22, 10, 26, 0.88)',
  },
  // 9. Royal Amethyst & Berry
  {
    primary: 'rgba(147, 51, 234, 0.55)',
    secondary: 'rgba(190, 24, 93, 0.50)',
    tertiary: 'rgba(59, 130, 246, 0.45)',
    accent: 'rgba(192, 132, 252, 0.45)',
    backgroundRgba: 'rgba(16, 10, 28, 0.88)',
  },
  // 10. Neon Lagoon & Mint
  {
    primary: 'rgba(20, 184, 166, 0.55)',
    secondary: 'rgba(56, 189, 248, 0.50)',
    tertiary: 'rgba(99, 102, 241, 0.45)',
    accent: 'rgba(45, 212, 191, 0.45)',
    backgroundRgba: 'rgba(7, 18, 26, 0.88)',
  },
  // 11. Golden Mirage & Crimson
  {
    primary: 'rgba(234, 179, 8, 0.55)',
    secondary: 'rgba(225, 29, 72, 0.50)',
    tertiary: 'rgba(249, 115, 22, 0.45)',
    accent: 'rgba(251, 146, 60, 0.45)',
    backgroundRgba: 'rgba(25, 16, 8, 0.88)',
  },
  // 12. Electric Cyan & Ultramarine
  {
    primary: 'rgba(6, 182, 212, 0.55)',
    secondary: 'rgba(37, 99, 235, 0.50)',
    tertiary: 'rgba(147, 51, 234, 0.45)',
    accent: 'rgba(34, 211, 238, 0.45)',
    backgroundRgba: 'rgba(9, 15, 30, 0.88)',
  },
  // 13. Coral Blossom & Azure
  {
    primary: 'rgba(251, 113, 133, 0.55)',
    secondary: 'rgba(14, 165, 233, 0.50)',
    tertiary: 'rgba(168, 85, 247, 0.45)',
    accent: 'rgba(251, 146, 60, 0.45)',
    backgroundRgba: 'rgba(24, 12, 16, 0.88)',
  },
  // 14. Velvet Orchid & Plum
  {
    primary: 'rgba(162, 28, 175, 0.55)',
    secondary: 'rgba(109, 40, 217, 0.50)',
    tertiary: 'rgba(244, 63, 94, 0.45)',
    accent: 'rgba(232, 121, 249, 0.45)',
    backgroundRgba: 'rgba(20, 8, 22, 0.88)',
  },
  // 15. Glacial Mint & Sky
  {
    primary: 'rgba(45, 212, 191, 0.55)',
    secondary: 'rgba(2, 132, 199, 0.50)',
    tertiary: 'rgba(124, 58, 237, 0.45)',
    accent: 'rgba(94, 234, 212, 0.45)',
    backgroundRgba: 'rgba(7, 20, 28, 0.88)',
  },
  // 16. Sonora Default Aurora
  {
    primary: 'rgba(56, 189, 248, 0.55)',
    secondary: 'rgba(124, 58, 237, 0.50)',
    tertiary: 'rgba(225, 29, 72, 0.45)',
    accent: 'rgba(14, 165, 233, 0.45)',
    backgroundRgba: 'rgba(10, 15, 29, 0.88)',
  },
];

/** Fast deterministic DJB2-based string hashing */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Get deterministic aurora palette based on track identifier or image URL */
export function getDeterministicPalette(identifier?: string): AuroraPalette {
  if (!identifier) return CURATED_AURORA_THEMES[CURATED_AURORA_THEMES.length - 1];
  const hash = hashString(identifier);
  const themeIndex = hash % CURATED_AURORA_THEMES.length;
  return CURATED_AURORA_THEMES[themeIndex];
}

/** Convert RGB to HSL helper */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return [h, s, l];
}

/** Convert HSL to RGB helper */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/** Extract vibrant colors from an Image using offscreen canvas sampling */
export function extractColorsFromImage(img: HTMLImageElement): AuroraPalette {
  const canvas = document.createElement('canvas');
  const size = 32;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D context');

  ctx.drawImage(img, 0, 0, size, size);
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  const samples: { r: number; g: number; b: number; h: number; s: number; l: number; score: number }[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 128) continue;

    const [h, s, l] = rgbToHsl(r, g, b);

    // Skip pure darks, pure whites, and muddy grays
    if (l < 0.12 || l > 0.90 || s < 0.18) continue;

    const score = s * (1 - Math.abs(l - 0.5) * 1.1);
    samples.push({ r, g, b, h, s, l, score });
  }

  if (samples.length < 6) {
    throw new Error('Insufficient vibrant pixels in thumbnail');
  }

  samples.sort((a, b) => b.score - a.score);

  // Pick distinct hue samples (at least 30deg apart)
  const picked: { r: number; g: number; b: number }[] = [];
  for (const sample of samples) {
    const isDistinct = picked.every((p) => {
      const [h] = rgbToHsl(p.r, p.g, p.b);
      const diff = Math.abs(h - sample.h);
      const hueDist = Math.min(diff, 360 - diff);
      return hueDist > 30;
    });

    if (isDistinct) {
      picked.push(sample);
      if (picked.length === 4) break;
    }
  }

  // Synthesize missing colors from primary hue if artwork is largely monochromatic
  while (picked.length < 4) {
    const base = picked[0] || samples[0];
    const [h, s, l] = rgbToHsl(base.r, base.g, base.b);
    const newHue = (h + picked.length * 50) % 360;
    const [r, g, b] = hslToRgb(newHue, Math.max(s, 0.65), Math.min(Math.max(l, 0.45), 0.65));
    picked.push({ r, g, b });
  }

  const p0 = picked[0];
  const p1 = picked[1];
  const p2 = picked[2];
  const p3 = picked[3];

  const darkR = Math.max(6, Math.min(26, Math.round(p0.r * 0.08 + 8)));
  const darkG = Math.max(8, Math.min(28, Math.round(p0.g * 0.08 + 10)));
  const darkB = Math.max(12, Math.min(34, Math.round(p0.b * 0.08 + 16)));

  return {
    primary: `rgba(${p0.r}, ${p0.g}, ${p0.b}, 0.55)`,
    secondary: `rgba(${p1.r}, ${p1.g}, ${p1.b}, 0.50)`,
    tertiary: `rgba(${p2.r}, ${p2.g}, ${p2.b}, 0.45)`,
    accent: `rgba(${p3.r}, ${p3.g}, ${p3.b}, 0.42)`,
    backgroundRgba: `rgba(${darkR}, ${darkG}, ${darkB}, 0.88)`,
  };
}

// In-memory cache to guarantee zero-latency switching between tracks
const paletteCache = new Map<string, AuroraPalette>();

/**
 * React hook to dynamically extract and smoothly provide Aurora ambient color palette
 * based on the song thumbnail with deterministic fallback for CORS / network safety.
 */
export function useThumbnailColors(imageUrl?: string, trackId?: string): AuroraPalette {
  const cacheKey = trackId || imageUrl || 'default';

  const [palette, setPalette] = useState<AuroraPalette>(() => {
    return paletteCache.get(cacheKey) || getDeterministicPalette(cacheKey);
  });

  useEffect(() => {
    // If cached, apply immediately
    const cached = paletteCache.get(cacheKey);
    if (cached) {
      setPalette(cached);
      return;
    }

    // Immediately establish deterministic fallback so UI is colorful right away
    const fallback = getDeterministicPalette(cacheKey);
    setPalette(fallback);
    paletteCache.set(cacheKey, fallback);

    if (!imageUrl) return;

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const extracted = extractColorsFromImage(img);
        paletteCache.set(cacheKey, extracted);
        if (isMounted) {
          setPalette(extracted);
        }
      } catch {
        // Tainted canvas or SecurityError on cross-origin image:
        // Gracefully keep deterministic fallback palette
      }
    };

    img.onerror = () => {
      // Image load failure: keep deterministic fallback
    };

    img.src = imageUrl;

    return () => {
      isMounted = false;
    };
  }, [cacheKey, imageUrl]);

  return palette;
}
