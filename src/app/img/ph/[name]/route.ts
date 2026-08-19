/**
 * Deterministic placeholder imagery.
 *
 * The client supplies real product photography before launch (PRD §11, item 7).
 * Until then every product still needs a distinct, intentional-looking image
 * rather than a broken icon, so we render one from the filename.
 */
const PALETTES = [
  { bg: '#eef1e9', mid: '#d7ded0', ink: '#3f5a45' },
  { bg: '#f3ede4', mid: '#e3d8c6', ink: '#6b543a' },
  { bg: '#e9eef1', mid: '#d2dde3', ink: '#37525f' },
  { bg: '#f2ecef', mid: '#e2d3da', ink: '#6a4152' },
  { bg: '#eff0ea', mid: '#dcded1', ink: '#4a5340' },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** A simple caudex-and-branches motif whose proportions vary with the seed. */
function motif(h: number, ink: string): string {
  const caudexW = 68 + (h % 40);
  const caudexH = 46 + ((h >> 3) % 26);
  const cx = 200;
  const cy = 292;
  const branches = 3 + ((h >> 7) % 3);

  let out = `<ellipse cx="${cx}" cy="${cy}" rx="${caudexW}" ry="${caudexH}" fill="${ink}" opacity="0.9"/>`;
  out += `<path d="M ${cx - caudexW} ${cy} Q ${cx} ${cy + caudexH * 1.3} ${cx + caudexW} ${cy}" fill="${ink}" opacity="0.9"/>`;

  for (let i = 0; i < branches; i++) {
    const spread = (i - (branches - 1) / 2) * (34 + ((h >> (i + 2)) % 18));
    const len = 74 + ((h >> (i + 4)) % 52);
    const tipX = cx + spread * 1.5;
    const tipY = cy - caudexH - len;
    out += `<path d="M ${cx + spread * 0.35} ${cy - caudexH * 0.7} Q ${cx + spread} ${cy - caudexH - len * 0.55} ${tipX} ${tipY}" stroke="${ink}" stroke-width="${11 - i}" fill="none" stroke-linecap="round" opacity="0.85"/>`;
    out += `<circle cx="${tipX}" cy="${tipY}" r="${13 + ((h >> (i + 6)) % 9)}" fill="${ink}" opacity="0.55"/>`;
  }
  return out;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const seed = name.replace(/\.svg$/, '');
  const h = hash(seed);
  const p = PALETTES[h % PALETTES.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="Placeholder image">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.bg}"/>
      <stop offset="100%" stop-color="${p.mid}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)"/>
  <circle cx="200" cy="180" r="118" fill="#fff" opacity="0.28"/>
  ${motif(h, p.ink)}
  <rect x="132" y="330" width="136" height="40" rx="3" fill="${p.ink}" opacity="0.18"/>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
