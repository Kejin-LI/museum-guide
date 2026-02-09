import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, PenTool, MapPin, Compass, Calendar as CalendarIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const Plan: React.FC = () => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [days, setDays] = useState(0);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

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
    if (!destination.trim()) {
      alert('请填写目的地');
      return;
    }
    if (!startDate || !endDate) {
      alert('请选择出行日期范围');
      return;
    }
    if (selectedPreferences.length === 0) {
      alert('请至少选择一个旅行偏好');
      return;
    }
    
    navigate('/plan/edit', { 
        state: { 
            destination, 
            days, 
            preferences: selectedPreferences,
            startDate: startDate ? startDate.toISOString() : null,
        } 
    });
  };

  const PREFERENCES = [
    { id: 'history', label: '历史文化', icon: '🏛️' },
    { id: 'art', label: '艺术展览', icon: '🎨' },
    { id: 'nature', label: '自然风光', icon: '🌲' },
    { id: 'family', label: '亲子友好', icon: '👨‍👩‍👧‍👦' },
  ];

  const togglePreference = (label: string) => {
    if (selectedPreferences.includes(label)) {
      setSelectedPreferences(selectedPreferences.filter(p => p !== label));
    } else {
      setSelectedPreferences([...selectedPreferences, label]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 text-stone-800">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 bg-white sticky top-0 z-10">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold font-serif tracking-wide text-stone-900">行程规划</h1>
                <p className="text-xs text-stone-500 mt-1">定制你的专属文化之旅</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden border-2 border-white shadow-sm">
                <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/640px-Cat03.jpg" 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-2 overflow-y-auto pb-20">
        
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

            {/* Preferences */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">旅行偏好 (多选)</label>
                <div className="flex flex-wrap gap-2">
                    {PREFERENCES.map((pref) => (
                        <button
                            key={pref.id}
                            onClick={() => togglePreference(pref.label)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center border ${
                                selectedPreferences.includes(pref.label)
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-stone-50 text-stone-600 border-transparent hover:bg-stone-100'
                            }`}
                        >
                            <span className="mr-1.5">{pref.icon}</span>
                            {pref.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
                 {/* AI Generator Button */}
                <button 
                    onClick={handleAIPlan}
                    className="relative group overflow-hidden rounded-2xl h-16 flex items-center justify-center bg-stone-900 text-white shadow-lg active:scale-[0.98] transition-transform"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex flex-col items-center">
                        <div className="flex items-center font-bold">
                            <Sparkles size={16} className="mr-1.5 text-amber-300" />
                            AI 智能生成
                        </div>
                        <span className="text-[10px] text-stone-300 mt-0.5">一键生成完美行程</span>
                    </div>
                </button>

                {/* Manual Create Button */}
                <button className="rounded-2xl h-16 flex flex-col items-center justify-center bg-amber-50 text-amber-900 border border-amber-100 active:scale-[0.98] transition-transform">
                    <div className="flex items-center font-bold">
                        <PenTool size={16} className="mr-1.5" />
                        手动创建
                    </div>
                    <span className="text-[10px] text-amber-700/60 mt-0.5">自由组合随心定制</span>
                </button>
            </div>
        </section>

        {/* My Plans Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold font-serif text-stone-900">我的计划</h3>
             <div className="flex space-x-4 text-sm">
                 <button className="font-bold text-stone-900">全部</button>
                 <button className="text-stone-400">即将出行</button>
             </div>
          </div>
          
          <div className="space-y-4">
            {/* Plan Card 1 */}
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 flex space-x-4">
                <div className="w-24 h-24 rounded-xl bg-stone-200 overflow-hidden flex-shrink-0 relative">
                    <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Kinkaku-ji_2016.jpg/640px-Kinkaku-ji_2016.jpg" 
                        alt="Kyoto" 
                        className="w-full h-full object-cover"
                    />
                     <div className="absolute top-1 left-1 bg-black/50 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md">
                        5天
                    </div>
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                        <h4 className="font-bold text-stone-900 text-lg leading-tight mb-1">京都古韵五日游</h4>
                        <div className="flex items-center text-stone-500 text-xs">
                            <MapPin size={12} className="mr-1" />
                            <span>日本 · 京都</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-xs text-stone-400 font-medium">2023.11.15 - 2023.11.20</span>
                        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">即将出行</span>
                    </div>
                </div>
            </div>

             {/* Plan Card 2 */}
             <div className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 flex space-x-4 opacity-80">
                <div className="w-24 h-24 rounded-xl bg-stone-200 overflow-hidden flex-shrink-0 relative">
                    <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/640px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg" 
                        alt="Paris" 
                        className="w-full h-full object-cover grayscale"
                    />
                     <div className="absolute top-1 left-1 bg-black/50 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md">
                        7天
                    </div>
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                        <h4 className="font-bold text-stone-900 text-lg leading-tight mb-1">巴黎艺术探索之旅</h4>
                        <div className="flex items-center text-stone-500 text-xs">
                            <MapPin size={12} className="mr-1" />
                            <span>法国 · 巴黎</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-xs text-stone-400 font-medium">2023.05.01 - 2023.05.07</span>
                        <span className="bg-stone-100 text-stone-500 text-xs px-2 py-1 rounded-full font-medium">已完成</span>
                    </div>
                </div>
            </div>

            {/* Plan Card 3 */}
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 flex space-x-4">
                <div className="w-24 h-24 rounded-xl bg-stone-200 overflow-hidden flex-shrink-0 relative">
                    <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Peking_forbidden_city_03.jpg/640px-Peking_forbidden_city_03.jpg" 
                        alt="Beijing" 
                        className="w-full h-full object-cover"
                    />
                     <div className="absolute top-1 left-1 bg-black/50 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md">
                        3天
                    </div>
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                        <h4 className="font-bold text-stone-900 text-lg leading-tight mb-1">北京中轴线徒步</h4>
                        <div className="flex items-center text-stone-500 text-xs">
                            <MapPin size={12} className="mr-1" />
                            <span>中国 · 北京</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-xs text-stone-400 font-medium">未定</span>
                        <span className="bg-amber-50 text-amber-600 text-xs px-2 py-1 rounded-full font-medium">草稿</span>
                    </div>
                </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
};

export default Plan;
