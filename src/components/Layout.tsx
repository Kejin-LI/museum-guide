import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-full mx-auto bg-stone-50 shadow-2xl overflow-hidden relative">
      <div className="flex-1 overflow-hidden relative">
        <Outlet />
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Layout;
