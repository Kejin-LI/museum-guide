import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, Compass, Users, User } from 'lucide-react';

const BottomNavigation: React.FC = () => {
  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/plan', icon: Map, label: '规划' },
    { path: '/guide', icon: Compass, label: '导览', highlight: true },
    { path: '/community', icon: Users, label: '社区' },
    { path: '/profile', icon: User, label: '我的' },
  ];

  return (
    <nav className="h-16 bg-white border-t border-stone-200 flex justify-around items-center px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center justify-center w-full h-full space-y-1
            ${isActive ? 'text-stone-900' : 'text-stone-400'}
            ${item.highlight ? '-mt-6' : ''}
          `}
        >
          {({ isActive }) => (
            <>
              {item.highlight ? (
                <div className={`
                  w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-stone-50 transition-transform active:scale-95
                  ${isActive ? 'bg-stone-900 text-white' : 'bg-stone-800 text-white'}
                `}>
                  <item.icon size={24} />
                </div>
              ) : (
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              )}
              <span className={`text-[10px] font-medium ${item.highlight ? 'mt-1' : ''}`}>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNavigation;
