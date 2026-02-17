import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Heart, Headphones, Calendar, Plus, Map } from 'lucide-react';
import { planService, type SavedPlan } from '../services/plan';
import { travelogueService, type TravelogueItem } from '../services/travelogue';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [travelogues, setTravelogues] = useState<TravelogueItem[]>([]);
  const [greeting, setGreeting] = useState('早安');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 11) {
        setGreeting('早安');
      } else if (hour >= 11 && hour < 13) {
        setGreeting('午安');
      } else if (hour >= 13 && hour < 18) {
        setGreeting('下午好');
      } else if (hour >= 18 && hour < 23) {
        setGreeting('晚上好');
      } else {
        setGreeting('夜深了');
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      // Get User
      const userStr = localStorage.getItem('museum_user');
      let uid: string | null = null;
      if (userStr) {
          try {
              const user = JSON.parse(userStr);
              uid = user.id || user.uid;
          } catch (e) {
              console.error("Failed to parse user", e);
          }
      }

      const loadPlans = async () => {
          if (uid) {
              // 1. Logged In: Fetch from Supabase
              const sbPlans = await planService.getUserPlans(uid);
              if (sbPlans.length > 0) {
                  setPlans(sbPlans);
              } else {
                  // Fallback to local storage if Supabase empty (maybe just created offline?)
                  // Or strict isolation: only Supabase? 
                  // Let's check localStorage too for strict sync behavior
                  const savedPlansStr = localStorage.getItem('my_plans');
                  if (savedPlansStr) {
                      const allPlans: SavedPlan[] = JSON.parse(savedPlansStr);
                      const userPlans = allPlans.filter(p => p.uid === uid);
                      setPlans(userPlans);
                  }
              }
          } else {
              // 2. Guest: Show NOTHING (as per requirement)
              setPlans([]);
          }
      };

      const loadTravelogues = async () => {
          const items = await travelogueService.getRecent(5);
          setTravelogues(items);
      };
      
      loadPlans();
      loadTravelogues();
  }, []);

  // Format date helper
  const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '未定';
      const date = new Date(dateStr);
      return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-stone-50 text-stone-800 relative overflow-hidden">
      {/* Header */}
      <header className="w-full max-w-3xl mx-auto px-6 py-4 flex justify-between items-start bg-transparent sticky top-0 z-10 pt-8 relative">
         <div>
            <p className="text-xs text-stone-500 font-medium mb-1">{greeting}，探索者</p>
            <h1 className="text-3xl font-bold font-serif tracking-tight text-stone-900 leading-tight">
                今天想去哪里<br/>寻迹？
            </h1>
         </div>

      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto p-4 space-y-6 pb-24 relative z-10">
        
        {/* Search Bar */}
        {/*
        <div className="relative">
            <input 
                type="text" 
                placeholder="搜索博物馆、展览、艺术家..." 
                className="w-full bg-white h-12 rounded-2xl pl-12 pr-12 text-sm shadow-sm border border-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-200 text-stone-700"
            />
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" />
            <Mic size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400" />
        </div>
        */}

        {/* Big Cards Grid */}
        <section className="grid grid-cols-2 gap-4">
          {/* Guide Card (Primary) */}
          <Link to="/guide" className="bg-[#1C1C1E] p-5 rounded-[2rem] shadow-lg flex flex-col justify-between h-44 active:scale-[0.98] transition-transform relative overflow-hidden group">
            {/* Decorative Background */}
            <div className="absolute top-10 right-10 w-28 h-28 bg-[#2C2C2E] rounded-full blur-2xl opacity-35 pointer-events-none"></div>
            <div className="absolute bottom-10 right-8 w-40 h-40 bg-[#2C2C2E] rounded-full blur-2xl opacity-45 pointer-events-none"></div>
            <div className="absolute bottom-6 left-8 w-24 h-24 bg-[#3A3A3C] rounded-full blur-xl opacity-25 pointer-events-none"></div>

            <div className="w-12 h-12 bg-[#3A3A3C] rounded-full flex items-center justify-center text-[#D4B996] mb-2 relative z-10 shadow-sm">
              <Headphones size={24} className="opacity-90" />
            </div>
            <div className="relative z-10">
                <h3 className="font-bold text-white text-xl tracking-wide">开始导览</h3>
                <p className="text-xs text-[#8E8E93] mt-1.5 font-medium">识别当前展品</p>
            </div>
          </Link>

          {/* Plan Card (Secondary) */}
          <Link to="/plan" className="bg-white p-5 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col justify-between h-44 active:scale-[0.98] transition-transform relative overflow-hidden">
             <div className="w-12 h-12 bg-[#F2F2F7] rounded-full flex items-center justify-center text-[#1C1C1E] mb-2">
              <MapPin size={24} />
            </div>
            <div>
                <h3 className="font-bold text-[#1C1C1E] text-xl tracking-wide">智能规划</h3>
                <p className="text-xs text-[#8E8E93] mt-1.5 font-medium">AI 定制专属行程</p>
            </div>
          </Link>
        </section>

        {/* My Plans Section */}
        <section>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold font-serif text-stone-900">我的计划</h3>
                <Link to="/plan" className="text-sm text-stone-500 flex items-center hover:text-stone-800 transition-colors">
                    更多
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
            </div>
            
            {plans.length > 0 ? (
                <div className="space-y-4">
                    {/* Sort by creation time (Newest first, which is default order in storage) */}
                    {plans.slice(0, 2).map((plan) => (
                        <div
                            key={plan.id}
                            onClick={() => navigate('/plan/edit', { state: { planId: plan.id } })}
                            className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 flex space-x-4 active:scale-[0.99] transition-transform cursor-pointer"
                        >
                            <div className="w-24 h-24 rounded-xl bg-stone-200 overflow-hidden flex-shrink-0 relative">
                                <img 
                                    alt={plan.destination} 
                                    className="w-full h-full object-cover" 
                                    src={plan.image}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.style.background = 'linear-gradient(135deg, #e7e5e4 0%, #d6d3d1 100%)';
                                    }}
                                />
                                <div className="absolute top-1 left-1 bg-black/50 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md">
                                    {plan.days}天
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <h4 className="font-bold text-stone-900 text-lg leading-tight mb-1 line-clamp-1">{plan.title}</h4>
                                    <div className="flex items-center text-stone-500 text-xs">
                                        <MapPin size={12} className="mr-1" />
                                        <span>{plan.destination}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-stone-400 font-medium flex items-center">
                                        <Calendar size={12} className="mr-1" />
                                        {formatDate(plan.startDate)}
                                    </span>
                                    <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                                        {plan.status === 'upcoming' ? '即将出行' : '草稿'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-3 text-stone-400">
                        <Map size={24} />
                    </div>
                    <p className="text-stone-600 font-medium text-sm mb-1">还没想好去哪？</p>
                    <p className="text-stone-400 text-xs mb-4">世界那么大，让 AI 为你定制一场说走就走的旅行。</p>
                    <Link 
                        to="/plan" 
                        className="px-4 py-2 bg-stone-900 text-white rounded-full text-xs font-medium flex items-center hover:bg-stone-800 transition-colors"
                    >
                        <Plus size={14} className="mr-1.5" />
                        创建新计划
                    </Link>
                </div>
            )}
        </section>

        {/* Featured Travelogues (Masonry Style) */}
        <section>
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold font-serif text-stone-900">旅行手帐灵感</h3>
             <Link to="/community" className="text-sm text-stone-500 flex items-center hover:text-stone-800 transition-colors">
                 更多
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5"><path d="m9 18 6-6-6-6"/></svg>
             </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             {/* Left Column */}
             <div className="space-y-3">
                 {/* Render Left Column Travelogues (Even Indices: 0, 2, 4...) */}
                 {travelogues.filter((_, i) => i % 2 === 0).map(t => (
                    <Link key={t.id} to={`/travelogue/${t.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 block active:scale-[0.98] transition-transform">
                     <div className="h-32 bg-stone-200 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <img 
                            src={t.cover} 
                            alt={t.title} 
                            className="w-full h-full object-cover relative z-10"
                        />
                     </div>
                     <div className="p-3">
                        <h4 className="font-bold text-stone-900 text-sm mb-2 line-clamp-2">{t.title}</h4>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                                <img src={t.avatar} className="w-4 h-4 rounded-full" alt="Avatar"/>
                                <span className="text-[10px] text-stone-500 truncate max-w-[60px]">{t.author}</span>
                            </div>
                            <div className="flex items-center text-stone-400 space-x-1">
                                <Heart size={10} />
                                <span className="text-[10px]">{t.likes}</span>
                            </div>
                        </div>
                     </div>
                 </Link>
                 ))}
             </div>

             {/* Right Column */}
             <div className="space-y-3">
                 {/* Render Right Column Travelogues (Odd Indices: 1, 3, 5...) */}
                 {travelogues.filter((_, i) => i % 2 !== 0).map(t => (
                    <Link key={t.id} to={`/travelogue/${t.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 h-auto flex flex-col active:scale-[0.98] transition-transform">
                     <div className="flex-1 bg-stone-200 min-h-[120px] relative">
                        <img 
                            src={t.cover} 
                            alt={t.title} 
                            className="w-full h-full object-cover relative z-10"
                        />
                     </div>
                     <div className="p-3">
                        <h4 className="font-bold text-stone-900 text-sm mb-2 line-clamp-2">{t.title}</h4>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                                <img src={t.avatar} className="w-4 h-4 rounded-full" alt="Avatar"/>
                                <span className="text-[10px] text-stone-500 truncate max-w-[60px]">{t.author}</span>
                            </div>
                            <div className="flex items-center text-stone-400 space-x-1">
                                <Heart size={10} />
                                <span className="text-[10px]">{t.likes}</span>
                            </div>
                        </div>
                     </div>
                 </Link>
                 ))}
             </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
