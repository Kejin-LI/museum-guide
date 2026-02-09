import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Heart, Bell, Mic, Headphones, Quote, Feather, Calendar } from 'lucide-react';

interface SavedPlan {
    id: string;
    title: string;
    destination: string;
    days: number;
    startDate: string | null;
    image: string;
    status: 'upcoming' | 'draft' | 'completed';
}

const Home: React.FC = () => {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
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
      const savedPlansStr = localStorage.getItem('my_plans');
      if (savedPlansStr) {
          try {
              setPlans(JSON.parse(savedPlansStr));
          } catch (e) {
              console.error('Failed to parse plans', e);
          }
      }
  }, []);

  // Format date helper
  const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '未定';
      const date = new Date(dateStr);
      return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 text-stone-800">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-start bg-transparent sticky top-0 z-10 pt-8">
         <div>
            <p className="text-xs text-stone-500 font-medium mb-1">{greeting}，探索者</p>
            <h1 className="text-3xl font-bold font-serif tracking-tight text-stone-900 leading-tight">
                今天想去哪里<br/>寻迹？
            </h1>
         </div>
         <div className="p-2 bg-white shadow-sm rounded-full border border-stone-100 relative">
             <Bell size={20} className="text-stone-600" />
             <div className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></div>
         </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Search Bar */}
        <div className="relative">
            <input 
                type="text" 
                placeholder="搜索博物馆、展览、艺术家..." 
                className="w-full bg-white h-12 rounded-2xl pl-12 pr-12 text-sm shadow-sm border border-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-200 text-stone-700"
            />
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" />
            <Mic size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400" />
        </div>

        {/* Big Cards Grid */}
        <section className="grid grid-cols-2 gap-4">
          <Link to="/plan" className="bg-[#1C1C1E] p-5 rounded-[2rem] shadow-lg flex flex-col justify-between h-44 active:scale-[0.98] transition-transform relative overflow-hidden group">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2C2C2E] rounded-full blur-2xl opacity-40 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-[#2C2C2E] rounded-full blur-2xl opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-4 right-4 w-24 h-24 bg-[#3A3A3C] rounded-full blur-xl opacity-30 pointer-events-none"></div>

            <div className="w-12 h-12 bg-[#3A3A3C] rounded-full flex items-center justify-center text-[#D4B996] mb-2 relative z-10 shadow-sm">
              <MapPin size={24} fill="currentColor" className="opacity-90" />
            </div>
            <div className="relative z-10">
                <h3 className="font-bold text-white text-xl tracking-wide">智能规划</h3>
                <p className="text-xs text-[#8E8E93] mt-1.5 font-medium">AI 定制专属行程</p>
            </div>
          </Link>

          <Link to="/guide" className="bg-white p-5 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col justify-between h-44 active:scale-[0.98] transition-transform relative overflow-hidden">
             <div className="w-12 h-12 bg-[#F2F2F7] rounded-full flex items-center justify-center text-[#1C1C1E] mb-2">
              <Headphones size={24} />
            </div>
            <div>
                <h3 className="font-bold text-[#1C1C1E] text-xl tracking-wide">开始导览</h3>
                <p className="text-xs text-[#8E8E93] mt-1.5 font-medium">识别当前展品</p>
            </div>
          </Link>
        </section>

        {/* My Plans Section - Only show if there are saved plans */}
        {plans.length > 0 && (
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold font-serif text-stone-900">我的计划</h3>
                    <div className="flex space-x-4 text-sm">
                        <button className="font-bold text-stone-900">全部</button>
                        <button className="text-stone-400">即将出行</button>
                    </div>
                </div>
                <div className="space-y-4">
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 flex space-x-4 active:scale-[0.99] transition-transform">
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
            </section>
        )}

        {/* Featured Travelogues (Masonry Style) */}
        <section>
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold font-serif text-stone-900">旅行手帐灵感</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             {/* Left Column */}
             <div className="space-y-3">
                 {/* Card 1: Kyoto */}
                 <Link to="/travelogue/1" className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 block active:scale-[0.98] transition-transform">
                     <div className="h-32 bg-stone-200 relative">
                         {/* Fallback Gradient if image fails */}
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 opacity-90"></div>
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Fushimi_Inari_Shrine_torii_paths.jpg/640px-Fushimi_Inari_Shrine_torii_paths.jpg" 
                            alt="Kyoto" 
                            className="w-full h-full object-cover relative z-10 mix-blend-overlay opacity-80"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        <div className="absolute bottom-2 left-2 text-white font-serif font-bold z-20 text-lg">Kyoto</div>
                     </div>
                     <div className="p-3">
                        <h4 className="font-bold text-stone-900 text-sm mb-2">京都古寺巡礼</h4>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/640px-Cat03.jpg" className="w-4 h-4 rounded-full" alt="Avatar"/>
                                <span className="text-[10px] text-stone-500">林小夏</span>
                            </div>
                            <div className="flex items-center text-stone-400 space-x-1">
                                <Heart size={10} />
                                <span className="text-[10px]">128</span>
                            </div>
                        </div>
                     </div>
                 </Link>

                 {/* Card 2: Quote */}
                 <div className="bg-stone-800 rounded-2xl p-4 text-white relative overflow-hidden">
                     <Quote size={24} className="text-stone-600 mb-2" />
                     <p className="text-sm font-serif leading-relaxed mb-4 relative z-10">
                        "历史不是尘封的记忆，而是鲜活的对话。"
                     </p>
                     <div className="flex justify-end">
                        <Feather size={20} className="text-stone-600" />
                     </div>
                     <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-stone-700 rounded-full opacity-20"></div>
                 </div>
             </div>

             {/* Right Column */}
             <div className="space-y-3">
                 {/* Card 3: British Museum */}
                 <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 h-full flex flex-col">
                     <div className="flex-1 bg-stone-200 min-h-[160px] relative">
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/British_Museum_from_NE_2.JPG/640px-British_Museum_from_NE_2.JPG" 
                            alt="British Museum" 
                            className="w-full h-full object-cover relative z-10"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                     </div>
                     <div className="p-3">
                        <h4 className="font-bold text-stone-900 text-sm mb-2">大英博物馆一日</h4>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Dog_Breeds.jpg/640px-Dog_Breeds.jpg" className="w-4 h-4 rounded-full" alt="Avatar"/>
                                <span className="text-[10px] text-stone-500">Mark.Z</span>
                            </div>
                            <div className="flex items-center text-stone-400 space-x-1">
                                <Heart size={10} />
                                <span className="text-[10px]">89</span>
                            </div>
                        </div>
                     </div>
                 </div>
             </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
