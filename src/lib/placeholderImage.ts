const PLACEHOLDER_PALETTES = [
  { bg1: '#0f172a', bg2: '#1f2937', accent: '#d97706' },
  { bg1: '#111827', bg2: '#0f766e', accent: '#f59e0b' },
  { bg1: '#1f2937', bg2: '#312e81', accent: '#f97316' },
  { bg1: '#0b1324', bg2: '#3b1d2a', accent: '#f59e0b' },
];

const hashString = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

const svgToDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const coverPlaceholder = (title: string, subtitle: string = 'Odyssey · 寻迹之旅') => {
  const safeTitle = (title || 'Odyssey').trim();
  const hash = hashString(safeTitle);
  const palette = PLACEHOLDER_PALETTES[Math.abs(hash) % PLACEHOLDER_PALETTES.length];
  const escaped = safeTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="720" viewBox="0 0 1080 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.bg1}"/>
      <stop offset="1" stop-color="${palette.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="720" fill="url(#g)"/>
  <circle cx="900" cy="160" r="180" fill="${palette.accent}" opacity="0.12"/>
  <circle cx="160" cy="620" r="220" fill="${palette.accent}" opacity="0.10"/>
  <rect x="72" y="520" width="936" height="136" rx="22" fill="#0b1220" opacity="0.55"/>
  <text x="108" y="585" fill="#ffffff" font-size="54" font-family="ui-serif, Georgia, serif" font-weight="700">${escaped}</text>
  <text x="108" y="630" fill="#e5e7eb" font-size="26" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" opacity="0.9">${subtitle}</text>
</svg>`;
  return svgToDataUri(svg);
};

export const avatarPlaceholder = (name: string) => {
  const t = (name || 'User').trim();
  const initial = t ? t.slice(0, 1) : 'U';
  const hash = hashString(t);
  const palette = PLACEHOLDER_PALETTES[Math.abs(hash) % PLACEHOLDER_PALETTES.length];
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.bg1}"/>
      <stop offset="1" stop-color="${palette.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="128" fill="url(#g)"/>
  <circle cx="196" cy="78" r="56" fill="${palette.accent}" opacity="0.18"/>
  <text x="128" y="150" text-anchor="middle" fill="#ffffff" font-size="96" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="700">${initial}</text>
</svg>`;
  return svgToDataUri(svg);
};

