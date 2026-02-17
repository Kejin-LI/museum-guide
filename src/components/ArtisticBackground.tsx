import React from 'react';

const ArtisticBackground: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-[720px] pointer-events-none z-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.18] mix-blend-multiply blur-[1px]"
        style={{
          background: 'radial-gradient(900px 420px at 15% 15%, rgba(245,158,11,0.22), transparent 60%), radial-gradient(900px 520px at 70% 20%, rgba(14,116,144,0.18), transparent 60%), linear-gradient(135deg, rgba(15,23,42,1), rgba(31,41,55,1))',
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
