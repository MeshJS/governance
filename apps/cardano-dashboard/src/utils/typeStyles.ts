// utils/typeStyles.ts

// Palette aligned to NetworkTotalsChart
const PALETTE = [
    '#38E8E1', // teal/cyan
    '#FFAB00', // amber
    '#FF78CB', // pink
    '#22D3EE', // cyan
    '#FACC15', // yellow
    '#A78BFA', // purple
    '#34D399', // green
    '#D8B4FE', // lavender
    '#FB7185', // rose
    '#F87171', // red
    '#4ADE80', // emerald
    '#60A5FA'  // blue
];

export const DEFAULT_BASE_COLOR = '#38E8E1';

// Deterministic hash → index in palette
function hashStringToIndex(input: string, modulo: number): number {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash) + input.charCodeAt(i);
    }
    const idx = Math.abs(hash) % modulo;
    return idx;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
    const clean = hex.replace('#', '');
    const num = parseInt(clean.length === 3
        ? clean.split('').map(c => c + c).join('')
        : clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const r1 = r / 255, g1 = g / 255, b1 = b / 255;
    const max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r1: h = (g1 - b1) / d + (g1 < b1 ? 6 : 0); break;
            case g1: h = (b1 - r1) / d + 2; break;
            default: h = (r1 - g1) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

function hslStr(h: number, s: number, l: number): string {
    return `hsl(${h}, ${s}%, ${l}%)`;
}

export function formatTypeLabel(type: string): string {
    if (!type) return 'Unknown';
    return type.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function getBaseColor(type: string): string {
    const idx = hashStringToIndex(type || 'unknown', PALETTE.length);
    return PALETTE[idx];
}

export function getTypeGradientStops(type: string): string[] {
    const base = getBaseColor(type);
    const { h, s, l } = hexToHsl(base);
    const l1 = clamp(l + 10, 0, 95);
    const l2 = clamp(l + 2, 0, 90);
    const l3 = clamp(l - 8, 5, 85);
    const l4 = clamp(l - 16, 5, 80);
    return [
        hslStr(h, clamp(s, 45, 85), l1),
        hslStr(h, clamp(s, 45, 85), l2),
        hslStr(h, clamp(s + 5, 45, 90), l3),
        hslStr(h, clamp(s + 10, 45, 95), l4)
    ];
}

export function getCssGradient(type: string): string {
    const stops = getTypeGradientStops(type);
    return `linear-gradient(135deg, ${stops[0]} 0%, ${stops[1]} 40%, ${stops[2]} 80%, ${stops[3]} 100%)`;
}

export function getSolidColor(type: string): string {
    // Middle stop for fill/stroke consistency
    const stops = getTypeGradientStops(type);
    return stops[1];
}

function stopsFromBaseHex(hex: string): string[] {
    const { h, s, l } = hexToHsl(hex);
    const l1 = clamp(l + 10, 0, 95);
    const l2 = clamp(l + 2, 0, 90);
    const l3 = clamp(l - 8, 5, 85);
    const l4 = clamp(l - 16, 5, 80);
    return [
        hslStr(h, clamp(s, 45, 85), l1),
        hslStr(h, clamp(s, 45, 85), l2),
        hslStr(h, clamp(s + 5, 45, 90), l3),
        hslStr(h, clamp(s + 10, 45, 95), l4)
    ];
}

export function buildColorScaleForKeys(
    keys: string[],
    options?: { mode?: 'categorical' | 'monochrome'; base?: string }
): Record<string, { solid: string; gradient: string; stops: string[] }> {
    const unique = Array.from(new Set((keys || []).filter(Boolean))).sort();
    const map: Record<string, { solid: string; gradient: string; stops: string[] }> = {};
    const mode = options?.mode || 'categorical';

    if (mode === 'monochrome') {
        const baseHex = options?.base || '#38E8E1';
        const { h: baseH, s: baseS, l: baseL } = hexToHsl(baseHex);
        unique.forEach((key, i) => {
            const hueOffset = ((i * 13) % 20) - 10; // -10..+10 deg
            const satJitter = ((i * 7) % 8) - 4;    // -4..+4
            const lightJitter = ((i * 5) % 10) - 5; // -5..+5
            const h = (baseH + hueOffset + 360) % 360;
            const s = clamp(baseS + satJitter, 45, 90);
            const lMid = clamp(baseL + lightJitter, 30, 70);
            const l1 = clamp(lMid + 10, 0, 95);
            const l2 = clamp(lMid + 2, 0, 90);
            const l3 = clamp(lMid - 8, 5, 85);
            const l4 = clamp(lMid - 16, 5, 80);
            const stops = [
                hslStr(h, s, l1),
                hslStr(h, s, l2),
                hslStr(h, clamp(s + 5, 45, 95), l3),
                hslStr(h, clamp(s + 10, 45, 95), l4)
            ];
            map[key] = {
                solid: stops[1],
                gradient: `linear-gradient(135deg, ${stops[0]} 0%, ${stops[1]} 40%, ${stops[2]} 80%, ${stops[3]} 100%)`,
                stops
            };
        });
        return map;
    }

    // categorical (default)
    const n = unique.length;
    const paletteLen = PALETTE.length;
    const step = Math.max(1, Math.round(paletteLen * 0.55)) % paletteLen; // spread picks
    const seq: number[] = [];
    let idx = 0;
    const seen = new Set<number>();
    while (seq.length < Math.max(n, paletteLen)) {
        if (!seen.has(idx)) {
            seq.push(idx);
            seen.add(idx);
        }
        idx = (idx + step) % paletteLen;
        if (seen.size === paletteLen) break;
    }

    unique.forEach((key, i) => {
        const base = PALETTE[seq[i % seq.length]];
        const stops = stopsFromBaseHex(base);
        map[key] = {
            solid: stops[1],
            gradient: `linear-gradient(135deg, ${stops[0]} 0%, ${stops[1]} 40%, ${stops[2]} 80%, ${stops[3]} 100%)`,
            stops
        };
    });
    return map;
}

export function buildMonochromeScale(keys: string[], base?: string) {
    return buildColorScaleForKeys(keys, { mode: 'monochrome', base: base || getPrimaryBaseColor() });
}

export function getPrimaryBaseColor(): string {
    try {
        if (typeof window === 'undefined') return DEFAULT_BASE_COLOR;
        const value = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-primary')
            .trim();
        return value || DEFAULT_BASE_COLOR;
    } catch {
        return DEFAULT_BASE_COLOR;
    }
}


