import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, Compass, Users, User } from 'lucide-react';

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const isGuidePage = location.pathname === '/guide';

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/plan', icon: Map, label: '规划' },
    { path: '/guide', icon: Compass, label: '导览', highlight: true },
    { path: '/community', icon: Users, label: '社区' },
    { path: '/profile', icon: User, label: '我的' },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 bg-white border-t border-stone-200 flex justify-around items-center px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-[900] ${isGuidePage ? 'hidden' : ''}`}>
      {navItems.filter(item => !item.highlight).map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors
            ${isActive ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}
          `}
        >
          {({ isActive }) => (
            <>
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
      
      {/* Floating Action Button for Guide - Only show if NOT on guide page */}
      {!isGuidePage && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <NavLink
            to="/guide"
            className="w-14 h-14 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-lg border-4 border-stone-50 transition-transform active:scale-95"
          >
            <Compass size={24} />
          </NavLink>
        </div>
      )}
    </nav>
  );
};

export default BottomNavigation;
