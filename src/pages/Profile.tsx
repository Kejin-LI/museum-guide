import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, BookOpen, Map, Award, MessageSquare, LogOut, Camera, UserX } from 'lucide-react';
import { GUEST_AVATAR, deleteAccountService } from '../services/auth';
import DustText from '../components/DustText';
import { supabase } from '../lib/supabase';
import { planService, type SavedPlan } from '../services/plan';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatar: string;
}

import { travelogueService } from '../services/travelogue';

// ... (keep existing imports)

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Stats State
  const [stats, setStats] = useState({
      footprints: 0,
      journals: 0,
      likes: 0
  });

  // Delete Confirmation Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
      const savedUser = localStorage.getItem('museum_user');
      let uid: string | null = null;
      if (savedUser) {
          const u = JSON.parse(savedUser);
          setUser(u);
          uid = u.id || u.uid;
      }

      // Calculate Stats
      const calculateStats = async () => {
          if (!uid) {
              setStats({ footprints: 0, journals: 0, likes: 0 });
              return;
          }

          let footprintsCount = 0;
          try {
              const sbPlans = await planService.getUserPlans(uid);
              if (sbPlans.length > 0) {
                  footprintsCount = sbPlans.length;
              } else {
                  const savedPlansStr = localStorage.getItem('my_plans');
                  if (savedPlansStr) {
                      const allPlans: SavedPlan[] = JSON.parse(savedPlansStr);
                      const userPlans = allPlans.filter(p => p.uid === uid);
                      footprintsCount = userPlans.length;
                  }
              }
          } catch {
              footprintsCount = 0;
          }

          // 2. Journals: Count user's travelogues
          // Use travelogueService to get user items (handles both Supabase and Local)
          const userTravelogues = await travelogueService.getUserTravelogues(uid);
          const journalsCount = userTravelogues.length;

          // 3. Likes: Sum of likes on user's travelogues
          // Note: This requires fetching the latest like counts (from Supabase ideally)
          // For now, we sum the likes from the fetched travelogues
          const totalLikes = userTravelogues.reduce((sum, item) => sum + (item.likes || 0), 0);

          setStats({
              footprints: footprintsCount,
              journals: journalsCount,
              likes: totalLikes
          });
      };

      calculateStats();
  }, []);

  const handleLogout = async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('museum_user');
      setUser(null);
      navigate('/auth', { replace: true });
  };

  const confirmDeleteAccount = async () => {
      if (!user) return;
      
      const uid = user.id;
      const { success, message } = await deleteAccountService(uid);
      
      if (success) {
          await supabase.auth.signOut();
          localStorage.removeItem('museum_user');
          localStorage.removeItem(`chat_sessions_${uid}`);
          localStorage.removeItem(`liked_posts_${uid}`);
          setUser(null);
          setShowDeleteConfirm(false);
          navigate('/auth');
      } else {
          alert(message || '注销失败，请重试');
          setShowDeleteConfirm(false);
      }
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
    <div className="flex flex-col h-screen w-full bg-stone-50 text-stone-800 relative overflow-hidden">
      <header className="w-full max-w-3xl mx-auto px-6 py-4 flex justify-end items-center bg-transparent relative z-10 pt-8">
        {/* Settings button removed */}
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto px-4 pb-24 relative z-10">
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
                            <span className="font-bold text-lg text-stone-900">{stats.footprints}</span>
                            <span className="text-xs text-stone-500">足迹</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-lg text-stone-900">{stats.journals}</span>
                            <span className="text-xs text-stone-500">手帐</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-lg text-stone-900">{stats.likes}</span>
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
                    onClick={() => navigate('/history')}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <MessageSquare size={18} />
                        </div>
                        <span className="text-sm font-medium text-stone-800">历史寻迹</span>
                    </div>
                    <ChevronRight size={16} className="text-stone-400" />
                </button>
            </div>



             {/* Account Actions */}
             {user && (
                <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden mt-4 divide-y divide-stone-50">
                    <button 
                        onClick={handleLogout}
                        className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-stone-50 transition-colors text-left"
                    >
                        <div className="p-2 bg-stone-100 text-stone-600 rounded-lg">
                            <LogOut size={18} />
                        </div>
                        <span className="text-sm font-medium text-stone-800">退出登录</span>
                    </button>
                    
                    <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-red-50 transition-colors text-left group"
                    >
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-100 transition-colors">
                            <UserX size={18} />
                        </div>
                        <span className="text-sm font-medium text-red-500">注销账号</span>
                    </button>
                </div>
             )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                    onClick={() => setShowDeleteConfirm(false)}
                ></div>
                <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all relative z-10">
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserX size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-stone-900 mb-2">真的要离开吗？</h3>
                        <p className="text-stone-600 mb-6 leading-relaxed">
                           注销后，您精心记录的 
                           <span className="font-bold text-amber-600 mx-1">{stats.journals} 篇手帐</span> 
                           和 
                           <span className="font-bold text-amber-600 mx-1">{stats.footprints} 次寻迹</span>
                           都将化为乌有。<br/>
                           <span className="text-sm text-stone-400 mt-2 block">我们要不...再考虑一下？🥺</span>
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium shadow-lg hover:bg-stone-800 active:scale-[0.98] transition-all"
                            >
                                我再想想 (推荐)
                            </button>
                            <button 
                                onClick={confirmDeleteAccount}
                                className="w-full py-3 bg-white text-stone-400 border border-stone-200 rounded-xl font-medium hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                            >
                                忍痛注销
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
