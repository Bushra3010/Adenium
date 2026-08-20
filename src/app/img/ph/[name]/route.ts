/**
 * Studio-style placeholder imagery.
 *
 * The client supplies real product photography before launch (PRD §11, item 7).
 * Until then every product still needs a distinct, deliberate-looking image, so
 * one is drawn from the filename: a soft studio ground, a cast shadow, and a
 * plant form chosen from the slug so an adenium does not look like a cactus.
 */
type Form = 'caudex' | 'cactus' | 'sphere' | 'spears' | 'seeds' | 'flower' | 'rosette';

const GROUNDS = [
  { a: '#e9f0e8', b: '#d5e3d4', pot: '#3f5c47', soil: '#c9b89a' }, // sage
  { a: '#f4e9ed', b: '#e8d5dd', pot: '#e6e0d8', soil: '#cbbba4' }, // blush
  { a: '#f2efe6', b: '#e3ddcd', pot: '#a9743f', soil: '#bda684' }, // sand
  { a: '#e8eef2', b: '#d3dfe6', pot: '#5a6b73', soil: '#c2b49b' }, // mist
  { a: '#eef1e7', b: '#dde3d2', pot: '#7d8a6a', soil: '#c7b696' }, // olive
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function formFor(seed: string): Form {
  const s = seed.toLowerCase();
  if (s.includes('astrophytum') || s.includes('cact') || s.includes('echinocactus')) return 'cactus';
  if (s.includes('euphorbia') || s.includes('obesa')) return 'sphere';
  if (s.includes('sansevieria') || s.includes('cylindrica')) return 'spears';
  if (s.includes('echeveria') || s.includes('succulent')) return 'rosette';
  if (s.includes('gomphrena') || s.includes('flower')) return 'flower';
  if (s.includes('seed')) return 'seeds';
  return 'caudex';
}

const POT_Y = 288;

function pot(g: (typeof GROUNDS)[number], w = 150, h = 92): string {
  const half = w / 2;
  return `
    <path d="M ${200 - half} ${POT_Y} h ${w} l -${w * 0.13} ${h} h -${w * 0.74} Z" fill="${g.pot}"/>
    <ellipse cx="200" cy="${POT_Y}" rx="${half}" ry="15" fill="${g.pot}" filter="url(#lighten)"/>
    <ellipse cx="200" cy="${POT_Y}" rx="${half - 10}" ry="10" fill="${g.soil}"/>`;
}

function plant(form: Form, h: number): string {
  const green = '#4a6b4f';
  const greenDark = '#38553d';
  const base = POT_Y - 6;

  switch (form) {
    case 'caudex': {
      const w = 62 + (h % 26);
      const bulbH = 48 + ((h >> 3) % 18);
      const arms = 4 + ((h >> 6) % 3);
      let out = `<ellipse cx="200" cy="${base - bulbH * 0.55}" rx="${w}" ry="${bulbH}" fill="#cbbfa6"/>
        <ellipse cx="${200 - w * 0.3}" cy="${base - bulbH * 0.75}" rx="${w * 0.4}" ry="${bulbH * 0.5}" fill="#d9cfb9" opacity=".7"/>`;
      for (let i = 0; i < arms; i++) {
        const spread = (i - (arms - 1) / 2) * 26;
        const len = 66 + ((h >> (i + 2)) % 40);
        const tipX = 200 + spread * 1.7;
        const tipY = base - bulbH * 1.2 - len;
        out += `<path d="M ${200 + spread * 0.5} ${base - bulbH * 1.1} Q ${200 + spread} ${base - bulbH - len * 0.6} ${tipX} ${tipY}"
          stroke="#c6b99f" stroke-width="${15 - i}" fill="none" stroke-linecap="round"/>`;
        out += `<ellipse cx="${tipX}" cy="${tipY - 4}" rx="16" ry="11" fill="${green}"/>
          <ellipse cx="${tipX - 12}" cy="${tipY + 5}" rx="12" ry="8" fill="${greenDark}"/>`;
      }
      return out;
    }
    case 'cactus': {
      const r = 52 + (h % 18);
      let out = `<circle cx="200" cy="${base - r}" r="${r}" fill="${green}"/>`;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        out += `<path d="M 200 ${base - r} l ${Math.cos(a) * r} ${Math.sin(a) * r}" stroke="${greenDark}" stroke-width="2.5" opacity=".55"/>`;
      }
      out += `<circle cx="200" cy="${base - r}" r="${r}" fill="none" stroke="${greenDark}" stroke-width="2" opacity=".4"/>`;
      // bloom
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        out += `<ellipse cx="${200 + Math.cos(a) * 15}" cy="${base - r * 2 + 6 + Math.sin(a) * 10}" rx="12" ry="8"
          fill="#e8a3bb" transform="rotate(${(a * 180) / Math.PI} ${200 + Math.cos(a) * 15} ${base - r * 2 + 6 + Math.sin(a) * 10})"/>`;
      }
      out += `<circle cx="200" cy="${base - r * 2 + 6}" r="7" fill="#f2d98b"/>`;
      return out;
    }
    case 'sphere': {
      const r = 54 + (h % 14);
      let out = `<circle cx="200" cy="${base - r * 0.85}" r="${r}" fill="#6f8f6a"/>`;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        out += `<path d="M 200 ${base - r * 0.85 - r} Q ${200 + Math.cos(a) * r * 1.2} ${base - r * 0.85} 200 ${base - r * 0.85 + r}"
          stroke="#5b7a58" stroke-width="2.5" fill="none" opacity=".7"/>`;
      }
      return out;
    }
    case 'spears': {
      const n = 4 + (h % 3);
      let out = '';
      for (let i = 0; i < n; i++) {
        const x = 200 + (i - (n - 1) / 2) * 22;
        const tall = 130 + ((h >> (i + 1)) % 60);
        out += `<path d="M ${x} ${base} C ${x - 8} ${base - tall * 0.6} ${x + 6} ${base - tall * 0.85} ${x} ${base - tall}
          C ${x - 6} ${base - tall * 0.85} ${x + 8} ${base - tall * 0.6} ${x} ${base} Z"
          fill="${i % 2 ? green : greenDark}"/>`;
      }
      return out;
    }
    case 'rosette': {
      let out = '';
      for (let ring = 3; ring >= 1; ring--) {
        const n = ring * 5;
        const rr = ring * 26;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + ring;
          out += `<ellipse cx="${200 + Math.cos(a) * rr * 0.55}" cy="${base - 42 + Math.sin(a) * rr * 0.3}" rx="${28 - ring * 4}" ry="${16 - ring * 2}"
            fill="${ring === 1 ? '#b98fa8' : ring === 2 ? '#a9809a' : '#94708a'}"
            transform="rotate(${(a * 180) / Math.PI} ${200 + Math.cos(a) * rr * 0.55} ${base - 42 + Math.sin(a) * rr * 0.3})"/>`;
        }
      }
      return out;
    }
    case 'flower': {
      let out = '';
      const stems = 3 + (h % 3);
      for (let i = 0; i < stems; i++) {
        const x = 200 + (i - (stems - 1) / 2) * 40;
        const tall = 110 + ((h >> i) % 50);
        out += `<path d="M ${x} ${base} Q ${x + (i % 2 ? 14 : -14)} ${base - tall / 2} ${x} ${base - tall}"
          stroke="${green}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
        out += `<circle cx="${x}" cy="${base - tall - 10}" r="15" fill="#c4638f"/>
          <circle cx="${x - 6}" cy="${base - tall - 16}" r="9" fill="#d882a8" opacity=".8"/>`;
      }
      return out;
    }
    case 'seeds': {
      // A shallow dish of seed rather than a growing plant.
      let out = `<path d="M 130 ${base - 34} a 70 44 0 0 0 140 0 Z" fill="#f6f3ec"/>
        <ellipse cx="200" cy="${base - 34}" rx="70" ry="17" fill="#efe9dd"/>`;
      for (let i = 0; i < 26; i++) {
        const a = (hash(`s${i}${h}`) % 360) * (Math.PI / 180);
        const rad = (hash(`r${i}${h}`) % 55) - 4;
        const x = 200 + Math.cos(a) * rad;
        const y = base - 36 + Math.sin(a) * rad * 0.3;
        out += `<ellipse cx="${x}" cy="${y}" rx="7" ry="3.4" fill="#8a6a45" transform="rotate(${(a * 180) / Math.PI} ${x} ${y})"/>`;
      }
      return out;
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  // ?bare=1 drops the ground and glow, so the subject can sit directly on a
  // card that already has its own tint instead of showing a second rectangle.
  const bare = new URL(request.url).searchParams.get('bare') === '1';
  const seed = name.replace(/\.svg$/, '');
  const h = hash(seed);
  const g = GROUNDS[h % GROUNDS.length];
  const form = formFor(seed);
  const showPot = form !== 'seeds';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="Product photograph placeholder">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${g.a}"/>
      <stop offset="100%" stop-color="${g.b}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="55%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="lighten"><feColorMatrix type="matrix" values="1.12 0 0 0 0  0 1.12 0 0 0  0 0 1.12 0 0  0 0 0 1 0"/></filter>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="9"/>
    </filter>
  </defs>

  ${bare ? '' : '<rect width="400" height="400" fill="url(#bg)"/><rect width="400" height="400" fill="url(#glow)"/>'}

  <!-- cast shadow -->
  <ellipse cx="205" cy="${showPot ? 384 : POT_Y - 6}" rx="118" ry="20" fill="#2b3a2e" opacity="${bare ? '.12' : '.18'}" filter="url(#soft)"/>

  ${plant(form, h)}
  ${showPot ? pot(g, 140 + (h % 30)) : ''}
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
