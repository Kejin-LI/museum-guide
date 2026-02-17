import React from 'react';

const ArtisticBackground: React.FC = () => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960" viewBox="0 0 1440 960">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f3ead8"/>
      <stop offset="0.45" stop-color="#d8c4a2"/>
      <stop offset="1" stop-color="#7a5c3a"/>
    </linearGradient>
    <radialGradient id="light" cx="35%" cy="25%" r="70%">
      <stop offset="0" stop-color="#fff6e6" stop-opacity="0.95"/>
      <stop offset="0.55" stop-color="#fff6e6" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <filter id="oil" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise"/>
      <feColorMatrix in="noise" type="matrix"
        values="0.7 0 0 0 0
                0 0.55 0 0 0
                0 0 0.4 0 0
                0 0 0 0.5 0" result="tint"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G"/>
      <feBlend in2="tint" mode="multiply" />
      <feGaussianBlur stdDeviation="0.2"/>
    </filter>
    <linearGradient id="marble" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f6efe3"/>
      <stop offset="1" stop-color="#cbb89b"/>
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

  <g opacity="0.55" filter="url(#oil)">
    <path d="M0,720 C180,610 280,640 420,560 C560,480 720,420 920,460 C1120,500 1260,620 1440,540 L1440,960 L0,960 Z" fill="#6f4f31" opacity="0.20"/>
    <path d="M0,760 C220,640 360,700 520,610 C700,510 820,520 1040,560 C1220,592 1320,690 1440,640 L1440,960 L0,960 Z" fill="#2f2620" opacity="0.18"/>
  </g>

  <g opacity="0.62" filter="url(#oil)">
    <g transform="translate(980 120)">
      <path d="M40,0 h220 a40,40 0 0 1 40,40 v560 h-300 v-560 a40,40 0 0 1 40,-40z" fill="url(#marble)" opacity="0.35"/>
      <path d="M88,80 h36 v520 h-36z" fill="#d8c7ac" opacity="0.35"/>
      <path d="M176,80 h36 v520 h-36z" fill="#d8c7ac" opacity="0.35"/>
      <path d="M264,80 h36 v520 h-36z" fill="#d8c7ac" opacity="0.35"/>
      <path d="M52,52 h276 v42 h-276z" fill="#e8dcc7" opacity="0.35"/>
    </g>

    <g transform="translate(220 160)">
      <path d="M240,70 c-20,-55 -85,-72 -135,-55 c-62,21 -78,88 -54,136 c18,36 55,48 58,86 c3,44 -44,64 -44,112 c0,66 64,116 140,116 c96,0 160,-78 152,-152 c-7,-65 -62,-90 -58,-138 c3,-39 55,-52 41,-105z"
        fill="#2d241d" opacity="0.16"/>
      <path d="M184,34 c-10,18 -34,46 -46,64 c-10,14 -10,32 0,45 c9,12 26,16 40,12 c12,-4 22,-14 26,-27 c6,-22 -8,-42 -20,-56 c-10,-12 -7,-22 0,-38z"
        fill="#f8f0e0" opacity="0.40"/>
      <path d="M170,190 c26,-16 56,-14 78,6 c18,17 22,44 10,66 c-13,24 -41,35 -67,28 c-25,-7 -43,-30 -43,-56 c0,-18 8,-34 22,-44z"
        fill="#f8f0e0" opacity="0.28"/>
      <path d="M132,300 c40,-16 88,2 108,40 c18,34 8,78 -24,102 c-36,27 -90,18 -112,-18 c-22,-36 -8,-96 28,-124z"
        fill="#f8f0e0" opacity="0.20"/>
    </g>
  </g>

  <rect width="1440" height="960" filter="url(#grain)" opacity="0.8"/>
</svg>`;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return (
    <div className="absolute top-0 left-0 w-full h-[720px] pointer-events-none z-0 overflow-hidden">
      <img
        src={src}
        alt="Greek Oil Painting Background"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.22] mix-blend-multiply blur-[0.6px]"
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
        }}
      />
    </div>
  );
};

export default ArtisticBackground;
