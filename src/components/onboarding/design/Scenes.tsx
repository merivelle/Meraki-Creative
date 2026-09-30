"use client";

/**
 * Illustrated "imagery" for the design previews: composed SVG scenes, coloured from props,
 * standing in for photography (no raster photos, nothing to license). Every scene fills its
 * box and crops like an image would (preserveAspectRatio slice).
 */
import { useId } from "react";

type P = { a: string; b: string; c: string; d?: string; className?: string; label?: string };

const svg = (className: string | undefined, label: string | undefined, children: React.ReactNode, viewBox = "0 0 300 200") => (
  <svg className={className} viewBox={viewBox} preserveAspectRatio="xMidYMid slice" role={label ? "img" : undefined}
    aria-label={label} aria-hidden={label ? undefined : true} width="100%" height="100%">
    {children}
  </svg>
);

/** A coastline at dusk: sky gradient, low sun, layered hills, water lines. */
export function Dusk({ a, b, c, d = "#ffffff", className, label }: P) {
  const id = useId();
  return svg(className, label, <>
    <defs>
      <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
    </defs>
    <rect width="300" height="200" fill={`url(#${id}s)`} />
    <circle cx="205" cy="118" r="26" fill={d} opacity=".85" />
    <path d="M0 128 C60 108 110 122 160 112 S250 100 300 116 V200 H0Z" fill={c} opacity=".55" />
    <path d="M0 146 C70 132 140 150 210 138 S280 132 300 136 V200 H0Z" fill={c} />
    {[158, 168, 178, 188].map((y, i) => <path key={y} d={`M${20 + i * 15} ${y} H${280 - i * 25}`} stroke={d} strokeOpacity={0.25 - i * 0.04} strokeWidth="1.2" />)}
  </>);
}

/** A dim room with a window of light falling across the floor, and a figure. */
export function WindowLight({ a, b, c, d = "#ffffff", className, label }: P) {
  return svg(className, label, <>
    <rect width="300" height="200" fill={a} />
    <rect x="178" y="30" width="62" height="92" fill={d} opacity=".9" />
    <path d="M186 38 H232 M209 30 V122" stroke={a} strokeWidth="3" />
    <path d="M178 122 L240 122 L300 200 L150 200Z" fill={d} opacity=".22" />
    <path d="M95 200 V132 C95 116 104 108 114 108 C124 108 132 116 132 132 V200Z" fill={b} />
    <circle cx="113" cy="94" r="13" fill={b} />
    <rect x="0" y="176" width="300" height="24" fill={c} opacity=".35" />
  </>);
}

/** A head-and-shoulders portrait silhouette, for headshot slots. */
export function Portrait({ a, b, c, d = "#ffffff", className, label }: P) {
  const id = useId();
  return svg(className, label, <>
    <defs>
      <radialGradient id={`${id}g`} cx=".35" cy=".3" r=".9"><stop offset="0" stopColor={d} stopOpacity=".55" /><stop offset="1" stopColor={a} stopOpacity="0" /></radialGradient>
    </defs>
    <rect width="200" height="260" fill={a} />
    <rect width="200" height="260" fill={`url(#${id}g)`} />
    <path d="M30 260 C34 206 62 186 100 184 C138 186 166 206 170 260Z" fill={b} />
    <ellipse cx="100" cy="122" rx="38" ry="46" fill={b} />
    <path d="M62 116 C62 80 84 66 104 68 C128 70 142 88 138 118 C130 96 116 92 100 92 C84 92 70 100 62 116Z" fill={c} />
  </>, "0 0 200 260");
}

/** A wide film still: road to the horizon, headlights, a warm light leak and grain. */
export function FilmFrame({ a, b, c, d = "#ffffff", className, label }: P) {
  const id = useId();
  return svg(className, label, <>
    <defs>
      <linearGradient id={`${id}k`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset=".62" stopColor={b} /><stop offset="1" stopColor={a} /></linearGradient>
      <radialGradient id={`${id}l`} cx=".92" cy=".15" r=".6"><stop offset="0" stopColor={c} stopOpacity=".75" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>
      <filter id={`${id}n`}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0" /></filter>
    </defs>
    <rect width="300" height="200" fill={`url(#${id}k)`} />
    <path d="M0 124 H300" stroke={d} strokeOpacity=".25" />
    <path d="M130 124 L170 124 L240 200 L60 200Z" fill={a} opacity=".75" />
    <path d="M150 128 V200" stroke={d} strokeOpacity=".5" strokeDasharray="6 7" />
    <path d="M20 124 L40 100 L55 110 L80 88 L100 124Z M210 124 L235 96 L262 112 L285 92 L300 124Z" fill={a} opacity=".9" />
    <circle cx="146" cy="130" r="2.2" fill={d} /><circle cx="154" cy="130" r="2.2" fill={d} />
    <rect width="300" height="200" fill={`url(#${id}l)`} />
    <rect width="300" height="200" filter={`url(#${id}n)`} />
  </>);
}

/** Geometric Bauhaus arrangement: circle, square, bars, half-disc. */
export function Geometry({ a, b, c, d = "#111111", className, label }: P) {
  return svg(className, label, <>
    <rect width="300" height="200" fill={a} />
    <circle cx="96" cy="92" r="58" fill={b} />
    <rect x="150" y="40" width="88" height="88" fill={c} />
    <rect x="40" y="160" width="220" height="12" fill={d} />
    <path d="M178 172 A46 46 0 0 1 270 172Z" fill={d} />
    <rect x="248" y="30" width="10" height="120" fill={d} />
  </>);
}

/** Early-digital: chrome sphere, pixel stars, window chrome. */
export function Pixels({ a, b, c, d = "#ffffff", className, label }: P) {
  const id = useId();
  const px = [[40, 40], [48, 40], [44, 36], [44, 44], [250, 150], [258, 150], [254, 146], [254, 154], [230, 50], [60, 160]];
  return svg(className, label, <>
    <defs>
      <radialGradient id={`${id}c`} cx=".35" cy=".3" r=".75"><stop offset="0" stopColor={d} /><stop offset=".45" stopColor={c} /><stop offset="1" stopColor={b} /></radialGradient>
    </defs>
    <rect width="300" height="200" fill={a} />
    {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M0 ${i * 13} H300`} stroke={b} strokeOpacity=".12" />)}
    <circle cx="150" cy="100" r="58" fill={`url(#${id}c)`} />
    <ellipse cx="132" cy="76" rx="18" ry="9" fill={d} opacity=".8" />
    {px.map(([x, y], i) => <rect key={i} x={x} y={y} width="4" height="4" fill={d} />)}
  </>);
}

/** A photocopied gig poster: torn edge, heavy noise. */
export function Poster({ a, b, c, className, label }: P) {
  const id = useId();
  return svg(className, label, <>
    <defs>
      <filter id={`${id}t`}><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 -.1" /></filter>
    </defs>
    <rect width="300" height="200" fill={a} />
    <path d="M0 0 H300 V150 L285 156 L270 148 L250 158 L232 150 L212 160 L190 150 L170 157 L150 149 L128 158 L110 150 L88 159 L66 150 L44 157 L22 149 L0 156Z" fill={b} />
    <circle cx="210" cy="72" r="46" fill={c} opacity=".9" />
    <rect width="300" height="200" filter={`url(#${id}t)`} />
  </>);
}

/** Cut-paper collage: offset scraps, a torn strip, tape. */
export function Collage({ a, b, c, d = "#ffffff", className, label }: P) {
  return svg(className, label, <>
    <rect width="300" height="200" fill={a} />
    <rect x="40" y="30" width="120" height="140" fill={b} transform="rotate(-6 100 100)" />
    <circle cx="190" cy="80" r="46" fill={c} />
    <rect x="150" y="100" width="110" height="70" fill={d} transform="rotate(4 205 135)" />
    <path d="M60 120 C90 90 130 140 170 110" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
    <rect x="80" y="18" width="50" height="14" fill={d} opacity=".7" transform="rotate(-12 105 25)" />
  </>);
}

/** Pebbles and a leaf, soft and natural. */
export function Organic({ a, b, c, d = "#ffffff", className, label }: P) {
  return svg(className, label, <>
    <rect width="300" height="200" fill={a} />
    <path d="M40 150 C30 110 70 90 110 100 C150 110 160 150 130 170 C100 190 50 185 40 150Z" fill={b} />
    <path d="M150 140 C150 110 190 100 215 115 C240 130 235 165 205 172 C175 180 150 165 150 140Z" fill={c} />
    <path d="M200 40 C250 40 270 80 250 110 C210 110 190 80 200 40Z" fill={b} opacity=".8" />
    <path d="M205 45 C220 70 235 85 248 106" stroke={d} strokeOpacity=".6" fill="none" />
  </>);
}

/** A friendly hand-drawn character with a speech bubble. */
export function Doodle({ a, b, c, d = "#111111", className, label }: P) {
  return svg(className, label, <>
    <rect width="300" height="200" fill={a} />
    <circle cx="120" cy="110" r="52" fill={b} stroke={d} strokeWidth="3" />
    <circle cx="104" cy="100" r="5" fill={d} /><circle cx="136" cy="100" r="5" fill={d} />
    <path d="M100 124 C112 138 128 138 140 124" stroke={d} strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M190 40 H270 V90 H214 L200 104 V90 H190Z" fill={c} stroke={d} strokeWidth="3" strokeLinejoin="round" />
    <path d="M40 40 L48 30 M56 44 L66 36 M250 150 L262 160" stroke={d} strokeWidth="3" strokeLinecap="round" />
  </>);
}

/** An abstract painting, for gallery walls. */
export function Painting({ a, b, c, d = "#ffffff", className, label }: P) {
  return svg(className, label, <>
    <rect width="300" height="200" fill={a} />
    <rect x="0" y="0" width="300" height="120" fill={b} />
    <rect x="40" y="70" width="130" height="90" fill={c} opacity=".9" />
    <circle cx="220" cy="60" r="28" fill={d} opacity=".85" />
    <path d="M0 150 C80 130 160 170 300 140" stroke={d} strokeOpacity=".5" strokeWidth="2" fill="none" />
  </>);
}
