import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { travelogueService, type TravelogueItem } from '../services/travelogue';

const Community: React.FC = () => {
  const [travelogues, setTravelogues] = useState<TravelogueItem[]>([]);

  useEffect(() => {
    const loadTravelogues = async () => {
        const items = await travelogueService.getAll();
        setTravelogues(items);
    };
    loadTravelogues();
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-transparent text-stone-800 relative overflow-hidden">
      <header className="w-full max-w-3xl mx-auto px-6 py-4 flex justify-between items-center bg-transparent sticky top-0 z-10 relative pt-8">
        <h1 className="text-2xl font-bold font-serif text-stone-900 tracking-wide">社区</h1>
        {/* Simplified Header: Removed Tabs (Recommend/Follow/Local) and Post Button for MVP */}
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto p-2 overflow-y-auto relative z-10 pb-24">
        <div className="columns-2 md:columns-2 gap-4 space-y-4">
             {travelogues.map((t) => (
                <Link key={t.id} to={`/travelogue/${t.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100 break-inside-avoid block active:scale-[0.99] transition-transform">
                    <div className="relative">
                         <img 
                            src={t.cover} 
                            alt={t.title} 
                            className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                            AI 手帐
                        </div>
                    </div>
                    <div className="p-3">
                        <h3 className="font-bold text-stone-900 text-sm mb-1 line-clamp-2">{t.title}</h3>
                        <p className="text-xs text-stone-500 mb-3 line-clamp-2">
                            {t.intro}
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <img src={t.avatar} className="w-5 h-5 rounded-full object-cover" alt="Avatar"/>
                                <span className="text-xs text-stone-600">{t.author}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-stone-400">
                                 <div className="flex items-center space-x-1">
                                    <Heart size={14} />
                                    <span className="text-xs">{t.likes}</span>
                                 </div>
                            </div>
                        </div>
                    </div>
                </Link>
             ))}
        </div>
      </main>
    </div>
  );
};

export default Community;
