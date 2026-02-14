import React from 'react';

const ArtisticBackground: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none z-0">
      <img 
        src="https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&q=80&w=1080"
        alt="Artistic Background"
        className="w-full h-full object-cover opacity-[0.15] mix-blend-multiply filter sepia-[0.3] blur-[1px]"
      />
      {/* Gradient Overlay to fade into white/stone-50 */}
      <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-b from-transparent via-stone-50/60 to-stone-50"></div>
    </div>
  );
};

export default ArtisticBackground;
