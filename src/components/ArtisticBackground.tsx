import React from 'react';

const ArtisticBackground: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-[720px] pointer-events-none z-0 overflow-hidden">
      <img 
        src="https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&q=80&w=1080"
        alt="Artistic Background"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.15] mix-blend-multiply filter sepia-[0.3] blur-[1px]"
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
