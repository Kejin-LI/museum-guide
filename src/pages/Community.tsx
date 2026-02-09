import React from 'react';
import { Heart, PenLine } from 'lucide-react';

const Community: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-stone-50 text-stone-800">
      <header className="px-6 py-4 flex justify-between items-center bg-white shadow-sm sticky top-0 z-10">
        <div className="flex space-x-4 text-sm font-medium">
            <span className="text-stone-900 border-b-2 border-stone-900 pb-1">推荐</span>
            <span className="text-stone-400">关注</span>
            <span className="text-stone-400">同城</span>
        </div>
        <button className="text-stone-900 bg-stone-100 p-2 rounded-full">
            <PenLine size={18} />
        </button>
      </header>

      <main className="flex-1 p-2 overflow-y-auto">
        <div className="masonry-grid space-y-4">
             {/* Post Card 1 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100 break-inside-avoid">
                <div className="relative">
                     <img 
                        src="https://images.unsplash.com/photo-1544967082-d9d3fddd85d1?q=80&w=400&auto=format&fit=crop" 
                        alt="Post" 
                        className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        AI 手帐
                    </div>
                </div>
                <div className="p-3">
                    <h3 className="font-bold text-stone-900 text-sm mb-1 line-clamp-2">在大英博物馆迷路的一天，偶遇这尊雕像...</h3>
                    <p className="text-xs text-stone-500 mb-3 line-clamp-2">
                        真的很震撼，特别是AI讲解提到的那个细节，完全没想到背后还有这样的故事。
                    </p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-stone-200 rounded-full"></div>
                            <span className="text-xs text-stone-600">旅行家小A</span>
                        </div>
                        <div className="flex items-center space-x-3 text-stone-400">
                             <div className="flex items-center space-x-1">
                                <Heart size={14} />
                                <span className="text-xs">128</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

             {/* Post Card 2 */}
             <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100 break-inside-avoid">
                <div className="p-3">
                    <h3 className="font-bold text-stone-900 text-sm mb-1 line-clamp-2">故宫的雪景真的太美了！</h3>
                     <div className="grid grid-cols-2 gap-1 my-2 rounded-lg overflow-hidden">
                        <div className="bg-stone-200 h-24"></div>
                        <div className="bg-stone-200 h-24"></div>
                     </div>
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-stone-200 rounded-full"></div>
                            <span className="text-xs text-stone-600">北漂日记</span>
                        </div>
                        <div className="flex items-center space-x-3 text-stone-400">
                             <div className="flex items-center space-x-1">
                                <Heart size={14} />
                                <span className="text-xs">856</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Community;
