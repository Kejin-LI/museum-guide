import React from 'react';

const ArtisticBackground: React.FC<{ mode?: 'topFade' | 'full'; opacity?: number; className?: string }> = ({
  mode = 'topFade',
  opacity = 0.55,
  className = '',
}) => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960" viewBox="0 0 1440 960">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f9f4ea"/>
      <stop offset="0.45" stop-color="#efe2cf"/>
      <stop offset="1" stop-color="#d9c4a4"/>
    </linearGradient>
    <radialGradient id="light" cx="52%" cy="18%" r="70%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.92"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9fd3ff" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#eaf6ff" stop-opacity="0.25"/>
    </linearGradient>
    <linearGradient id="warm" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f59e0b" stop-opacity="0.10"/>
      <stop offset="0.5" stop-color="#f472b6" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#60a5fa" stop-opacity="0.08"/>
    </linearGradient>
    <filter id="oil" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9" result="noise"/>
      <feColorMatrix in="noise" type="matrix"
        values="0.7 0 0 0 0
                0 0.55 0 0 0
                0 0 0.4 0 0
                0 0 0 0.5 0" result="tint"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G"/>
      <feBlend in2="tint" mode="multiply" />
      <feGaussianBlur stdDeviation="0.2"/>
    </filter>
    <linearGradient id="marble" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff7eb"/>
      <stop offset="1" stop-color="#d9c2a0"/>
    </linearGradient>
    <linearGradient id="archShadow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3b2a1a" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="turbulence" baseFrequency="0.8" numOctaves="1" seed="11" />
      <feColorMatrix type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.12 0"/>
    </filter>
  </defs>

  <rect width="1440" height="960" fill="url(#bg)"/>
  <rect width="1440" height="960" fill="url(#light)"/>
  <rect width="1440" height="960" fill="url(#warm)"/>

  <g filter="url(#oil)" opacity="0.72">
    <path d="M120,820 L1320,820 L1180,960 L260,960 Z" fill="#cdb99c" opacity="0.42"/>
    <path d="M220,820 L1220,820 L1120,960 L320,960 Z" fill="#bfa98b" opacity="0.18"/>
    <g opacity="0.35">
      <path d="M720,820 L720,960" stroke="#8a6f55" stroke-width="6" stroke-opacity="0.25"/>
      <path d="M560,820 L520,960" stroke="#8a6f55" stroke-width="6" stroke-opacity="0.18"/>
      <path d="M880,820 L920,960" stroke="#8a6f55" stroke-width="6" stroke-opacity="0.18"/>
      <path d="M420,820 L360,960" stroke="#8a6f55" stroke-width="6" stroke-opacity="0.14"/>
      <path d="M1020,820 L1080,960" stroke="#8a6f55" stroke-width="6" stroke-opacity="0.14"/>
    </g>
  </g>

  <g filter="url(#oil)" opacity="0.86">
    <path d="M140,80 h1160 a42,42 0 0 1 42,42 v640 a42,42 0 0 1 -42,42 h-1160 a42,42 0 0 1 -42,-42 v-640 a42,42 0 0 1 42,-42z" fill="#f6ead8" opacity="0.36"/>
    <path d="M220,140
             c140,30 320,30 500,0
             c180,-30 360,-30 500,0
             v560
             c-150,70 -350,110 -500,110
             c-150,0 -350,-40 -500,-110z"
          fill="#f3e6d4" opacity="0.26"/>
    <path d="M250,160 h940 a40,40 0 0 1 40,40 v520 h-1020 v-520 a40,40 0 0 1 40,-40z" fill="#fff7eb" opacity="0.30"/>
    <path d="M360,200 h720 a34,34 0 0 1 34,34 v440 h-788 v-440 a34,34 0 0 1 34,-34z" fill="#f9f3ea" opacity="0.34"/>

    <path d="M220,140
             c180,-60 340,-70 500,-70
             c160,0 320,10 500,70
             v56
             c-180,-40 -340,-52 -500,-52
             c-160,0 -320,12 -500,52z"
          fill="#cbb194" opacity="0.18"/>
    <path d="M250,160 h940 a40,40 0 0 1 40,40 v30 h-1020 v-30 a40,40 0 0 1 40,-40z" fill="url(#archShadow)" opacity="0.22"/>

    <g opacity="0.70">
      <path d="M320,240 h70 v440 h-70z" fill="url(#marble)" opacity="0.44"/>
      <path d="M470,240 h70 v440 h-70z" fill="url(#marble)" opacity="0.44"/>
      <path d="M900,240 h70 v440 h-70z" fill="url(#marble)" opacity="0.44"/>
      <path d="M1050,240 h70 v440 h-70z" fill="url(#marble)" opacity="0.44"/>
      <path d="M300,230 h840 v26 h-840z" fill="#e8d7c0" opacity="0.32"/>
      <path d="M300,680 h840 v24 h-840z" fill="#e8d7c0" opacity="0.22"/>
    </g>

    <g opacity="0.88">
      <path d="M560,300
               c40,-30 80,-44 120,-44
               c40,0 80,14 120,44
               c-26,34 -56,56 -120,56
               c-64,0 -94,-22 -120,-56z"
            fill="url(#sky)" opacity="0.70"/>
      <path d="M590,300
               c26,-18 54,-26 90,-26
               c36,0 64,8 90,26
               c-18,22 -44,36 -90,36
               c-46,0 -72,-14 -90,-36z"
            fill="#ffffff" opacity="0.34"/>
    </g>

    <g opacity="0.60">
      <path d="M740,402
               c-22,0 -40,18 -40,40
               c0,14 6,26 16,34
               c-18,18 -30,44 -30,74
               c0,52 32,90 54,104
               c-12,24 -20,52 -20,82
               c0,62 28,108 72,108
               c44,0 72,-46 72,-108
               c0,-30 -8,-58 -20,-82
               c22,-14 54,-52 54,-104
               c0,-30 -12,-56 -30,-74
               c10,-8 16,-20 16,-34
               c0,-22 -18,-40 -40,-40 z"
            fill="#fff7ed" opacity="0.32"/>
      <path d="M666,742
               c50,-36 112,-54 154,-54
               c42,0 104,18 154,54
               c-30,36 -84,56 -154,56
               c-70,0 -124,-20 -154,-56 z"
            fill="#fde68a" opacity="0.12"/>
      <path d="M712,392
               c-20,32 -44,60 -66,88
               c-22,28 -20,60 0,86
               c22,30 56,42 72,72
               c16,30 4,62 -12,86
               c-18,28 -18,54 -6,82
               c14,34 40,58 64,78"
            fill="none" stroke="#8b5e34" stroke-opacity="0.20" stroke-width="10" stroke-linecap="round"/>
      <path d="M768,392
               c18,28 44,58 68,88
               c24,30 22,60 2,88
               c-22,30 -58,42 -74,72
               c-16,30 -4,62 12,86
               c18,28 18,54 6,82
               c-14,34 -40,58 -64,78"
            fill="none" stroke="#8b5e34" stroke-opacity="0.18" stroke-width="10" stroke-linecap="round"/>
    </g>

    <g opacity="0.60">
      <ellipse cx="430" cy="720" rx="170" ry="64" fill="#c7b39a" opacity="0.20"/>
      <ellipse cx="1010" cy="720" rx="180" ry="64" fill="#c7b39a" opacity="0.18"/>
      <g opacity="0.95">
        <circle cx="360" cy="676" r="18" fill="#a16207" opacity="0.25"/>
        <rect x="344" y="694" width="36" height="58" rx="16" fill="#fb7185" opacity="0.20"/>
        <circle cx="412" cy="670" r="16" fill="#0ea5e9" opacity="0.22"/>
        <rect x="398" y="686" width="32" height="62" rx="14" fill="#22c55e" opacity="0.18"/>
        <circle cx="468" cy="680" r="18" fill="#8b5cf6" opacity="0.20"/>
        <rect x="452" y="698" width="36" height="54" rx="16" fill="#f59e0b" opacity="0.18"/>

        <circle cx="960" cy="678" r="18" fill="#0ea5e9" opacity="0.20"/>
        <rect x="944" y="696" width="36" height="56" rx="16" fill="#fb7185" opacity="0.18"/>
        <circle cx="1014" cy="670" r="16" fill="#a16207" opacity="0.22"/>
        <rect x="1000" y="686" width="32" height="62" rx="14" fill="#f59e0b" opacity="0.18"/>
        <circle cx="1068" cy="680" r="18" fill="#22c55e" opacity="0.16"/>
        <rect x="1052" y="698" width="36" height="54" rx="16" fill="#8b5cf6" opacity="0.16"/>
      </g>
    </g>
  </g>

  <rect width="1440" height="960" filter="url(#grain)" opacity="0.8"/>
</svg>`;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const maskStyle =
    mode === 'topFade'
      ? {
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)',
        }
      : undefined;
  return (
    <div className={`absolute inset-0 pointer-events-none z-0 overflow-hidden ${className}`.trim()}>
      <img
        src={src}
        alt="Greek Oil Painting Background"
        className="absolute inset-0 w-full h-full object-cover blur-[0.2px]"
        style={{ opacity, ...(maskStyle || {}) }}
      />
    </div>
  );
};

export default ArtisticBackground;
