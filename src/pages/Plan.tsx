import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, MapPin, Compass, Calendar as CalendarIcon, Map, Plus } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { zhCN } from 'date-fns/locale';
import { planService, type SavedPlan } from '../services/plan';

registerLocale('zh-CN', zhCN);
import { GUEST_AVATAR } from '../services/auth';
import ArtisticBackground from '../components/ArtisticBackground';

const Plan: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [destination, setDestination] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [days, setDays] = useState(0);
  const [filter, setFilter] = useState<'all' | 'upcoming'>('all');

  // Load User and Plans
  React.useEffect(() => {
      // 1. Load User
      const userStr = localStorage.getItem('museum_user');
      let uid: string | null = null;
      if (userStr) {
          try {
              const user = JSON.parse(userStr);
              uid = user.id || user.uid;
              setCurrentUser(user);
          } catch (e) {
              console.error("Failed to parse user", e);
          }
      }

      // 2. Load Plans
      const loadPlans = async () => {
          if (uid) {
              // Logged In: Fetch from Supabase
              const sbPlans = await planService.getUserPlans(uid);
              if (sbPlans.length > 0) {
                  setPlans(sbPlans);
              } else {
                  // Fallback to local storage if Supabase empty
                  const savedPlansStr = localStorage.getItem('my_plans');
                  if (savedPlansStr) {
                      const allPlans: SavedPlan[] = JSON.parse(savedPlansStr);
                      const userPlans = allPlans.filter(p => p.uid === uid);
                      setPlans(userPlans);
                  }
              }
          } else {
              // Guest: Show NOTHING (Empty State)
              setPlans([]);
          }
      };
      
      loadPlans();
  }, []);

  // Format date helper
  const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '未定';
      const date = new Date(dateStr);
      return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  };

  // Calculate days whenever dates change
  React.useEffect(() => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      setDays(diffDays > 0 ? diffDays : 0);
    } else {
      setDays(0);
    }
  }, [startDate, endDate]);

  const handleAIPlan = () => {
    if (!currentUser) {
        // Redirect to login if not authenticated
        navigate('/auth');
        return;
    }

    if (!destination.trim()) {
      alert('请填写目的地');
      return;
    }
    if (!startDate || !endDate) {
      alert('请选择出行日期范围');
      return;
    }
    
    navigate('/plan/edit', { 
        state: { 
            destination, 
            days, 
            preferences: [],
            startDate: startDate ? startDate.toISOString() : null,
        } 
    });
  };

  const getFilteredPlans = () => {
    if (!plans) return [];
    
    if (filter === 'all') {
        return plans;
    }
    
    // Filter for 'upcoming': Start date is in the future
    const now = new Date();
    // Reset time part for accurate date comparison
    now.setHours(0, 0, 0, 0);
    
    return plans.filter(plan => {
        if (!plan.startDate) return false;
        const planDate = new Date(plan.startDate);
        return planDate >= now;
    });
  };

  const displayPlans = getFilteredPlans();

  return (
    <div className="flex flex-col h-screen w-full bg-stone-50 text-stone-800 relative overflow-hidden">
      <ArtisticBackground />
      {/* Header */}
      <header className="w-full max-w-3xl mx-auto px-6 pt-8 pb-4 bg-transparent sticky top-0 z-10 relative">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold font-serif tracking-wide text-stone-900">行程规划</h1>
                <p className="text-xs text-stone-500 mt-1">定制你的专属文化之旅</p>
            </div>
            <Link to="/profile" className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden border-2 border-white shadow-sm active:scale-95 transition-transform block">
                <img 
                    src={currentUser?.avatar || GUEST_AVATAR} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = GUEST_AVATAR;
                    }}
                />
            </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-2 overflow-y-auto pb-20 relative z-10 flex flex-col items-center">
        <div className="w-full max-w-3xl">
        
        {/* New Plan Input Section */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 mb-6">
            <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center">
                <Compass className="w-5 h-5 mr-2 text-amber-500" />
                开启新旅程
            </h2>
            
            {/* Destination */}
            <div className="mb-4">
                <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">目的地</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                    <input 
                        type="text" 
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="你想去哪里？(例如：西安)"
                        className="w-full pl-10 pr-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-amber-200 text-stone-800 placeholder-stone-400 font-medium"
                    />
                </div>
            </div>

            {/* Date Range */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wider">出行日期</label>
                <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100">
                    <div className="relative w-full">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-stone-400">
                            <CalendarIcon size={18} />
                        </div>
                        <DatePicker
                            selectsRange={true}
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => {
                                setDateRange(update);
                            }}
                            locale="zh-CN"
                            withPortal
                            placeholderText="选择出发和结束日期"
                            className="w-full bg-white rounded-xl border border-stone-200 pl-10 pr-4 py-3 text-sm text-stone-700 focus:ring-2 focus:ring-amber-200 focus:outline-none shadow-sm font-medium"
                            wrapperClassName="w-full"
                            dateFormat="yyyy/MM/dd"
                            minDate={new Date()}
                            isClearable={true}
                        />
                    </div>
                    
                    {days > 0 && (
                        <div className="mt-3 bg-white rounded-xl p-2 flex items-center justify-center space-x-2 border border-stone-100 shadow-sm animate-in fade-in slide-in-from-top-1">
                            <span className="text-xs text-stone-500">共计</span>
                            <span className="text-xl font-bold text-stone-900">{days}</span>
                            <span className="text-xs text-stone-500">天行程</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Preferences Section Removed for MVP */}

            {/* Action Buttons - Simplified for MVP */}
            <button 
                onClick={handleAIPlan}
                className="w-full relative group overflow-hidden rounded-2xl h-14 flex items-center justify-center bg-stone-900 text-white shadow-lg active:scale-[0.98] transition-transform"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center font-bold">
                    <Sparkles size={18} className="mr-2 text-amber-300" />
                    AI 智能生成行程
                </div>
            </button>
            {/* Manual Create Button Removed for MVP */}
        </section>

        {/* My Plans Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold font-serif text-stone-900">我的计划</h3>
             <div className="flex space-x-4 text-sm">
                 <button 
                    onClick={() => setFilter('all')}
                    className={`font-bold transition-colors ${filter === 'all' ? 'text-stone-900' : 'text-stone-400'}`}
                 >
                    全部
                 </button>
                 <button 
                    onClick={() => setFilter('upcoming')}
                    className={`font-bold transition-colors ${filter === 'upcoming' ? 'text-stone-900' : 'text-stone-400'}`}
                 >
                    即将出行
                 </button>
             </div>
          </div>
          
          <div className="space-y-4">
            {displayPlans.length > 0 ? (
                displayPlans.map(plan => (
                    <div key={plan.id} className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 flex space-x-4">
                        <div className="w-24 h-24 rounded-xl bg-stone-200 overflow-hidden flex-shrink-0 relative">
                            <img 
                                src={plan.image} 
                                alt={plan.destination} 
                                className={`w-full h-full object-cover ${plan.status === 'completed' ? 'grayscale' : ''}`}
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
                                <h4 className="font-bold text-stone-900 text-lg leading-tight mb-1">{plan.title}</h4>
                                <div className="flex items-center text-stone-500 text-xs">
                                    <MapPin size={12} className="mr-1" />
                                    <span>{plan.destination}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-stone-400 font-medium">{formatDate(plan.startDate)}</span>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    plan.status === 'upcoming' ? 'bg-blue-50 text-blue-600' :
                                    plan.status === 'completed' ? 'bg-stone-100 text-stone-500' :
                                    'bg-amber-50 text-amber-600'
                                }`}>
                                    {plan.status === 'upcoming' ? '即将出行' : plan.status === 'completed' ? '已完成' : '草稿'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-400">
                        <Map size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold text-stone-800 mb-2">
                        {currentUser ? '暂无行程计划' : '登录开启行程'}
                    </h3>
                    <p className="text-stone-500 text-xs mb-6 leading-relaxed max-w-xs">
                        {currentUser 
                            ? '世界那么大，不想去看看吗？\n让 AI 为你定制一场说走就走的旅行。'
                            : '登录后即可创建和同步您的专属行程，\n随时随地查看您的旅行计划。'
                        }
                    </p>
                    {currentUser ? (
                         <button 
                            onClick={() => document.querySelector('input')?.focus()}
                            className="px-6 py-2.5 bg-stone-900 text-white rounded-xl font-medium shadow-lg shadow-stone-900/10 hover:bg-stone-800 active:scale-95 transition-all flex items-center text-sm"
                        >
                            <Plus size={16} className="mr-1.5" />
                            开启新旅程
                        </button>
                    ) : (
                        <Link 
                            to="/auth"
                            className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-medium shadow-lg shadow-amber-900/10 hover:bg-amber-500 active:scale-95 transition-all flex items-center text-sm"
                        >
                            立即登录
                        </Link>
                    )}
                </div>
            )}
          </div>
        </section>
      </div>
    </main>
    </div>
  );
};

export default Plan;
