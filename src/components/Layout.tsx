import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import ArtisticBackground from './ArtisticBackground';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-full mx-auto bg-stone-50 shadow-2xl overflow-hidden relative">
      <div className="flex-1 overflow-hidden relative">
        <ArtisticBackground />
        <div className="relative z-10 h-full">
          <Outlet />
        </div>
      </div>
      <div className="relative z-10">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default Layout;
