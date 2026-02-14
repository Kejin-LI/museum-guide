import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, BookOpen, Map, Star, Award, MessageSquare, LogOut, Camera } from 'lucide-react';
import { GUEST_AVATAR } from '../services/auth';
import DustText from '../components/DustText';
import ArtisticBackground from '../components/ArtisticBackground';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatar: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const savedUser = localStorage.getItem('museum_user');
      if (savedUser) {
          setUser(JSON.parse(savedUser));
      }
  }, []);

  const handleLogout = () => {
      localStorage.removeItem('museum_user');
      setUser(null);
      navigate('/auth');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && user) {
          const file = e.target.files[0];
          const newAvatarUrl = URL.createObjectURL(file);
          
          // Update local state
          const updatedUser = { ...user, avatar: newAvatarUrl };
          setUser(updatedUser);
          
          // Update LocalStorage
          localStorage.setItem('museum_user', JSON.stringify(updatedUser));
          
          // TODO: In a real app, upload file to Supabase Storage and get URL
          // const { data } = await supabase.storage.from('avatars').upload(...)
      }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 text-stone-800 relative overflow-hidden">
      <ArtisticBackground />
      <header className="px-6 py-4 flex justify-end items-center bg-transparent relative z-10 pt-8">
        {/* Settings button removed */}
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-8 relative z-10">
        {/* User Info */}
        <div className="flex flex-col items-center mb-8">
            <div className="relative group cursor-pointer">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarChange}
                />
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full bg-stone-200 border-4 border-white shadow-md mb-3 relative overflow-hidden transition-transform active:scale-95"
                >
                    {user ? (
                        <img 
                            src={user.avatar} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <img 
                            src={GUEST_AVATAR} 
                            alt="Guest Avatar" 
                            className="w-full h-full object-cover"
                        />
                    )}
                    
                    {/* Edit Overlay */}
                    {user && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={24} className="text-white" />
                        </div>
                    )}
                </div>
                
                {user && (
                    <div className="absolute bottom-3 right-0 bg-amber-500 text-white p-1 rounded-full border-2 border-white pointer-events-none">
                        <Award size={12} />
                    </div>
                )}
            </div>

            {user ? (
                <>
                    <h2 className="text-xl font-bold font-serif text-stone-900">{user.name}</h2>
                    <p className="text-stone-500 text-sm mt-1">{user.email}</p>
                    <div className="flex space-x-6 mt-4">
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-lg text-stone-900">12</span>
                            <span className="text-xs text-stone-500">足迹</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-lg text-stone-900">5</span>
                            <span className="text-xs text-stone-500">手帐</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-lg text-stone-900">128</span>
                            <span className="text-xs text-stone-500">获赞</span>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center">
                    <h2 className="text-xl font-bold font-serif text-stone-900 mb-2">未登录</h2>
                    <DustText text="Your pocket odyssey" className="text-xs text-stone-500 mb-4 font-serif italic" />
                    <button 
                        onClick={() => navigate('/auth')}
                        className="px-8 py-2 bg-stone-900 text-white rounded-full text-sm font-medium shadow-lg hover:bg-stone-800 transition-colors"
                    >
                        立即登录 / 注册
                    </button>
                </div>
            )}
        </div>

        {/* Menu List */}
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                 <button 
                    onClick={() => navigate('/profile/journals')}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors border-b border-stone-50"
                 >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <BookOpen size={18} />
                        </div>
                        <span className="text-sm font-medium text-stone-800">我的手帐</span>
                    </div>
                    <ChevronRight size={16} className="text-stone-400" />
                </button>
                <button 
                    onClick={() => navigate('/profile/plans')}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors border-b border-stone-50"
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Map size={18} />
                        </div>
                        <span className="text-sm font-medium text-stone-800">我的计划</span>
                    </div>
                    <ChevronRight size={16} className="text-stone-400" />
                </button>
                 <button 
                    onClick={() => navigate('/profile/favorites')}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors border-b border-stone-50"
                 >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Star size={18} />
                        </div>
                        <span className="text-sm font-medium text-stone-800">我的收藏</span>
                    </div>
                    <ChevronRight size={16} className="text-stone-400" />
                </button>
                <button 
                    onClick={() => navigate('/history')}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <MessageSquare size={18} />
                        </div>
                        <span className="text-sm font-medium text-stone-800">历史对话</span>
                    </div>
                    <ChevronRight size={16} className="text-stone-400" />
                </button>
            </div>



             {/* Logout Button */}
             {user && (
                 <button 
                    onClick={handleLogout}
                    className="w-full py-3 bg-white border border-stone-200 text-stone-500 rounded-xl text-sm font-medium hover:bg-stone-50 hover:text-red-500 transition-colors flex items-center justify-center"
                 >
                     <LogOut size={16} className="mr-2" />
                     退出登录
                 </button>
             )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
