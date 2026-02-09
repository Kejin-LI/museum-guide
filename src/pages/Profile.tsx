import React from 'react';
import { Settings, ChevronRight, BookOpen, Map, Star, Award } from 'lucide-react';

const Profile: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-stone-50 text-stone-800">
      <header className="px-6 py-4 flex justify-end items-center bg-transparent">
        <button className="text-stone-600">
          <Settings size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-8">
        {/* User Info */}
        <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-stone-200 border-4 border-white shadow-md mb-3 relative">
                <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 bg-amber-500 text-white p-1 rounded-full border-2 border-white">
                    <Award size={12} />
                </div>
            </div>
            <h2 className="text-xl font-bold font-serif text-stone-900">文艺青年小李</h2>
            <p className="text-stone-500 text-sm mt-1">走遍世界，寻找遗失的美好。</p>
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
        </div>

        {/* Menu List */}
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                 <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors border-b border-stone-50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <BookOpen size={18} />
                        </div>
                        <span className="text-sm font-medium text-stone-800">我的手帐</span>
                    </div>
                    <ChevronRight size={16} className="text-stone-400" />
                </button>
                <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors border-b border-stone-50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Map size={18} />
                        </div>
                        <span className="text-sm font-medium text-stone-800">我的计划</span>
                    </div>
                    <ChevronRight size={16} className="text-stone-400" />
                </button>
                 <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Star size={18} />
                        </div>
                        <span className="text-sm font-medium text-stone-800">我的收藏</span>
                    </div>
                    <ChevronRight size={16} className="text-stone-400" />
                </button>
            </div>

            {/* AI Preferences */}
             <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden p-4">
                <h3 className="text-sm font-bold text-stone-800 mb-3">AI 偏好设置</h3>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-stone-600">讲解风格</span>
                    <span className="text-sm text-stone-900 font-medium">幽默风趣</span>
                </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">语言偏好</span>
                    <span className="text-sm text-stone-900 font-medium">中文 / English</span>
                </div>
             </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
