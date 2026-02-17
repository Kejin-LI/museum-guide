import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Save, MessageCircle, Send, Palette, ScrollText, Utensils, Lightbulb, Sun, Moon, Sparkles, Info, Mic, Keyboard, Camera, X } from 'lucide-react';
import { planService, type SavedPlan } from '../services/plan';
import { itineraryService, type ItineraryGenerateOutput } from '../services/itinerary';
import { supabase } from '../lib/supabase';
import { planAgentService } from '../services/planAgent';
import { coverPlaceholder } from '../lib/placeholderImage';

// Interfaces
interface Spot {
  id: string;
  name: string;
  image: string;
  duration: number; // hours
  tag?: string;
}

interface LocationState {
  planId?: string;
  destination?: string;
  days?: number;
  preferences?: string[];
  startDate?: string | null;
}

const PlanEditor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) || null;

  // Mock Data Generators
  // MOCK_SPOTS moved to local variable or outside component, but since it was removed by mistake in previous edits, let's restore it.
  const MOCK_SPOTS: Record<string, Spot[]> = {
    '北京': [
      { id: '1', name: '故宫博物院', image: coverPlaceholder('故宫博物院'), duration: 4.0, tag: '必游' },
      { id: '2', name: '景山公园', image: coverPlaceholder('景山公园'), duration: 1.5 },
      { id: '3', name: '南锣鼓巷', image: coverPlaceholder('南锣鼓巷'), duration: 2.0 },
      { id: '4', name: '天坛公园', image: coverPlaceholder('天坛公园'), duration: 3.0, tag: '世界遗产' },
      { id: '5', name: '国家博物馆', image: coverPlaceholder('国家博物馆'), duration: 4.0, tag: '热门' },
      { id: '6', name: '颐和园', image: coverPlaceholder('颐和园'), duration: 4.0, tag: '皇家园林' },
      { id: '7', name: '圆明园', image: coverPlaceholder('圆明园'), duration: 3.0 },
      { id: '8', name: '雍和宫', image: coverPlaceholder('雍和宫'), duration: 2.0 },
    ],
    'default': [
      { id: '101', name: '市中心博物馆', image: coverPlaceholder('市中心博物馆'), duration: 3.0, tag: '必游' },
      { id: '102', name: '城市公园', image: coverPlaceholder('城市公园'), duration: 2.0 },
      { id: '103', name: '特色古街', image: coverPlaceholder('特色古街'), duration: 2.5 },
    ]
  };

  // State
  // items: { 'day-0': [Spot...], 'day-1': [Spot...] }
  const [items, setItems] = useState<Record<string, Spot[]>>({});
  const [title, setTitle] = useState('');
  const [startDateStr, setStartDateStr] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState('');
  const [itineraryData, setItineraryData] = useState<ItineraryGenerateOutput | null>(null);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [optMessages, setOptMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [optInput, setOptInput] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [planId] = useState<string>(() => state?.planId || `plan-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const optInputRef = useRef('');

  useEffect(() => {
    optInputRef.current = optInput;
  }, [optInput]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognition));

    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
      }
      recognitionRef.current = null;
    };
  }, []);

  const getUid = async (): Promise<string | null> => {
    let uid: string | null = null;
    const userStr = localStorage.getItem('museum_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        uid = u.id || u.uid;
      } catch {
        uid = null;
      }
    }
    if (!uid) {
      try {
        const { data } = await supabase.auth.getUser();
        uid = data.user?.id || null;
      } catch {
        uid = null;
      }
    }
    return uid;
  };

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
    }
  };

  const startRecording = () => {
    if (!speechSupported) return;
    stopRecording();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = String(res?.[0]?.transcript || '');
        if (res.isFinal) finalTranscript += text;
        else interim += text;
      }
      const merged = `${finalTranscript}${interim}`.trim();
      if (merged) setOptInput(merged);
    };
    recognition.onerror = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    setIsRecording(true);
    try {
      recognition.start();
    } catch {
      setIsRecording(false);
      recognitionRef.current = null;
    }
  };

  const sendOptimizeMessage = async (content: string) => {
    const text = content.trim();
    if (!text) return;

    stopRecording();
    setIsRecording(false);
    setOptInput('');

    const nextMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [...optMessages, { role: 'user', content: text }];
    setOptMessages(nextMessages);
    setIsOptimizing(true);

    const baseItinerary = itineraryData || buildItineraryFromCurrent();
    const uid = await getUid();
    const res = await itineraryService.chat({
      destination: state?.destination || baseItinerary.destination || '目的地',
      days: state?.days || baseItinerary.days?.length || 1,
      startDate: startDateStr,
      preferences: state?.preferences || [],
      itinerary: baseItinerary,
      messages: nextMessages,
      message: text,
    });

    if (res.success && res.data) {
      const updated = [...nextMessages, { role: 'assistant' as const, content: res.data.reply }];
      setOptMessages(updated);
      setItineraryData(res.data.itinerary);
      setItems(itineraryService.toPlanItemsBySlot(res.data.itinerary) as Record<string, Spot[]>);
      setHasUnsavedChanges(true);
      if (uid) await planAgentService.saveSession(planId, uid, updated);
    } else {
      setOptMessages((prev) => [...prev, { role: 'assistant', content: res.message || '优化失败，请稍后重试。' }]);
    }

    setIsOptimizing(false);
  };

  // Initialization
  useEffect(() => {
    let cancelled = false;
    const slots: Array<'morning' | 'afternoon' | 'night'> = ['morning', 'afternoon', 'night'];

    const normalizePlanItems = (raw: any): Record<string, Spot[]> => {
      const input = raw && typeof raw === 'object' ? (raw as Record<string, Spot[]>) : {};
      const keys = Object.keys(input);
      const hasOld = keys.some((k) => /^day-\d+$/.test(k));
      if (!hasOld) return input;

      const out: Record<string, Spot[]> = {};
      for (const k of keys) {
        const m = k.match(/^day-(\d+)$/);
        if (m) {
          const i = Number(m[1]);
          const list = Array.isArray(input[k]) ? input[k] : [];
          out[`day-${i}-morning`] = list.slice(0, 1);
          out[`day-${i}-afternoon`] = list.slice(1, 2);
          out[`day-${i}-night`] = list.slice(2);
        } else {
          out[k] = input[k];
        }
      }
      return out;
    };

    const init = async () => {
      if (!state) {
        setTitle('自定义行程');
        setItems({
          'day-0-morning': MOCK_SPOTS['default'],
          'day-0-afternoon': [],
          'day-0-night': [],
        });
        setItineraryData(null);
        setIsGenerating(false);
        setGenerateMessage('');
        return;
      }

      if (state.planId && (!state.destination || !state.days)) {
        setIsGenerating(true);
        setGenerateMessage('正在加载计划…');

        let uid: string | null = null;
        const userStr = localStorage.getItem('museum_user');
        if (userStr) {
          try {
            const u = JSON.parse(userStr);
            uid = u.id || u.uid;
          } catch {
            uid = null;
          }
        }
        if (!uid) {
          try {
            const { data } = await supabase.auth.getUser();
            uid = data.user?.id || null;
          } catch {
            uid = null;
          }
        }

        const plan = await planService.getPlanById(state.planId);
        if (cancelled) return;
        if (plan) {
          setTitle(plan.title || '我的计划');
          setStartDateStr(plan.startDate || null);
          setItineraryData((plan.planData as any)?.itinerary || null);
          setItems(normalizePlanItems((plan.planData as any)?.items || {}));
          if (uid) {
            const msgs = await planAgentService.getSession(state.planId, uid);
            if (!cancelled) setOptMessages(msgs);
          }
          setGenerateMessage('');
        } else {
          setGenerateMessage('未找到该计划或暂无权限查看。');
        }
        setIsGenerating(false);
        return;
      }

      const destination = state.destination || '目的地';
      const days = state.days || 1;
      const preferences = state.preferences || [];
      const startDate = state.startDate ?? null;

      setStartDateStr(startDate);
      const prefStr = preferences.length > 0 ? preferences.join('、') : '';
      setTitle(`${destination}${prefStr}${days}日游`);

      setIsGenerating(true);
      setGenerateMessage('AI 正在生成行程规划…');

      try {
        const res = await itineraryService.generate({
          destination,
          days,
          preferences,
          startDate,
        });
        if (cancelled) return;
        if (res.success && res.data) {
          setItineraryData(res.data);
          const generated = itineraryService.toPlanItemsBySlot(res.data) as Record<string, Spot[]>;
          if (Object.keys(generated).length > 0) {
            slots.forEach((slot) => {
              for (let i = 0; i < days; i++) {
                const key = `day-${i}-${slot}`;
                if (!generated[key]) generated[key] = [];
              }
            });
            setItems(generated);
            setHasUnsavedChanges(true);
            setGenerateMessage('');
            setIsGenerating(false);
            return;
          }
        }
        setItems({});
        setGenerateMessage('生成失败：当前未获取到真实 POI 行程数据，请检查 Supabase/AMAP_KEY 配置。');
        setItineraryData(null);
        setIsGenerating(false);
      } catch {
        if (cancelled) return;
        setIsGenerating(false);
        setGenerateMessage('生成失败：请检查网络与 Supabase/AMAP_KEY 配置后重试。');
        setItineraryData(null);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [state]);

  // Check for unsaved changes on navigation away
  useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if (hasUnsavedChanges) {
              e.preventDefault();
              e.returnValue = '';
          }
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
      };
  }, [hasUnsavedChanges]);

  // Handle navigation back with confirm
  const handleBack = () => {
      if (hasUnsavedChanges) {
          setShowExitConfirm(true);
      } else {
          navigate('/plan');
      }
  };

  // Date formatter
  const formatDate = (dayIndex: number) => {
      if (!startDateStr) return `第 ${dayIndex + 1} 天`;
      const date = new Date(startDateStr);
      date.setDate(date.getDate() + dayIndex);
      
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekDay = weekDays[date.getDay()];
      
      return `${month}月${day}日 ${weekDay}`;
  };

  const buildItineraryFromCurrent = (): ItineraryGenerateOutput => {
      const destination = state?.destination || itineraryData?.destination || '目的地';
      const inferredDays =
          Object.keys(items)
              .map((k) => {
                  const m = k.match(/^day-(\d+)-/);
                  return m ? Number(m[1]) : -1;
              })
              .filter((n) => n >= 0)
              .reduce((max, n) => Math.max(max, n), -1) + 1;
      const daysCount = state?.days || itineraryData?.days?.length || (inferredDays > 0 ? inferredDays : 1);
      const slots: Array<{ key: 'morning' | 'afternoon' | 'night'; title: string }> = [
          { key: 'morning', title: '上午' },
          { key: 'afternoon', title: '下午' },
          { key: 'night', title: '夜晚' },
      ];

      const days = Array.from({ length: daysCount }).map((_, i) => {
          const mk = (slotKey: 'morning' | 'afternoon' | 'night') => {
              const containerId = `day-${i}-${slotKey}`;
              const list = items[containerId] || [];
              return {
                  title: slots.find(s => s.key === slotKey)?.title,
                  items: list.map(s => ({
                      name: s.name,
                      estimatedDurationHours: s.duration,
                      tag: s.tag,
                  })),
              };
          };
          const date = startDateStr ? new Date(startDateStr) : null;
          const iso = date ? (() => {
              const d = new Date(date);
              d.setDate(d.getDate() + i);
              return d.toISOString().slice(0, 10);
          })() : '';
          return {
              date: iso,
              title: `Day ${i + 1}`,
              morning: mk('morning'),
              afternoon: mk('afternoon'),
              night: mk('night'),
          };
      });

      return {
          title,
          destination,
          cityIntro: itineraryData?.cityIntro || `${destination}，一座值得慢慢探索的城市。`,
          overview: itineraryData?.overview,
          days,
          foodMap: itineraryData?.foodMap || { hotpot: [], localCuisine: [], snacks: [], streets: [], coffeeDessert: [] },
          tips: itineraryData?.tips || [],
      };
  };

  const handleSavePlan = async () => {
      // Get current user for UID
      const userStr = localStorage.getItem('museum_user');
      let uid = null;
      if (userStr) {
          try {
              const user = JSON.parse(userStr);
              uid = user.id || user.uid;
          } catch (e) {
              console.error("Failed to parse user for plan saving", e);
          }
      }
      if (!uid) {
          try {
              const { data } = await supabase.auth.getUser();
              if (data.user) {
                  uid = data.user.id;
                  const email = data.user.email || '';
                  const existingStr = localStorage.getItem('museum_user');
                  if (!existingStr) {
                      const name = (data.user.user_metadata?.name as string) || (email ? email.split('@')[0] : '探索者');
                      const avatar = (data.user.user_metadata?.avatar_url as string) || '';
                      localStorage.setItem('museum_user', JSON.stringify({ id: data.user.id, name, email, avatar }));
                  }
              }
          } catch {
          }
      }

      // Prepare Plan Object
      const coverImage =
          items['day-0-morning']?.[0]?.image ||
          items['day-0-afternoon']?.[0]?.image ||
          items['day-0-night']?.[0]?.image ||
          coverPlaceholder(title || state?.destination || '旅行计划');
      const newPlan: SavedPlan = {
          id: planId,
          uid: uid || undefined, // Associate plan with user
          title: title,
          destination: state?.destination || itineraryData?.destination || '未知目的地',
          days: state?.days || itineraryData?.days?.length || 0,
          startDate: startDateStr,
          image: coverImage,
          status: 'upcoming', // or 'draft'
          createdAt: Date.now(),
          planData: {
              items,
              itinerary: itineraryData,
          }
      };

      // 1. Sync to Supabase if logged in
      if (uid) {
          await planService.savePlan(newPlan, uid);
      }

      // 2. Save to LocalStorage (as cache/fallback)
      const existingPlansStr = localStorage.getItem('my_plans');
      const existingPlans = existingPlansStr ? JSON.parse(existingPlansStr) : [];
      localStorage.setItem('my_plans', JSON.stringify([newPlan, ...existingPlans]));

      setHasUnsavedChanges(false);
      navigate('/plan'); // Go back to Plan page which has "My Plans"
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50 text-stone-800">
      {/* Header */}
      <header className="w-full max-w-3xl mx-auto px-4 py-4 bg-white sticky top-0 z-20 border-b border-stone-100 flex items-center justify-between shadow-sm">
        <button 
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-600 active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
            <h1 className="text-base font-bold text-stone-900 truncate max-w-[200px]">{title}</h1>
            <div className="flex items-center text-[10px] text-stone-400 mt-0.5">
                <MapPin size={10} className="mr-0.5" />
                {state?.destination || itineraryData?.destination || '自定义'}
            </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOptimizeModal((v) => !v)}
            className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="优化行程"
          >
            <MessageCircle size={18} />
          </button>
          <button 
              onClick={handleSavePlan}
              className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
          >
              保存
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 overflow-y-auto pb-36">
        {(isGenerating || generateMessage) && (
          <div
            className={[
              'rounded-xl px-3 py-2 border backdrop-blur-sm flex items-start gap-2 animate-in fade-in mb-4',
              isGenerating
                ? 'bg-amber-500/10 border-amber-500/15 text-amber-900'
                : generateMessage.includes('失败')
                  ? 'bg-rose-500/10 border-rose-500/15 text-rose-900'
                  : 'bg-amber-500/10 border-amber-500/15 text-amber-900',
            ].join(' ')}
            role="status"
            aria-live="polite"
          >
            <div className="text-xs leading-relaxed">{generateMessage || '生成中…'}</div>
          </div>
        )}
        {(() => {
          if (isGenerating && !itineraryData) {
            const destination = state?.destination || '目的地';
            const daysCount = state?.days || 1;
            return (
              <div className="bg-white rounded-3xl shadow-sm border border-stone-100 mb-6 overflow-hidden relative">
                <div className="absolute -top-16 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-amber-200/30 via-violet-200/20 to-indigo-200/20 blur-2xl"></div>
                <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-gradient-to-tr from-stone-200/30 via-amber-200/20 to-rose-200/20 blur-2xl"></div>
                <div className="relative p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl bg-white/70 backdrop-blur border border-white shadow-sm flex items-center justify-center">
                        <Palette size={18} className="text-amber-600" />
                      </div>
                      <div className="text-lg font-bold text-stone-900 font-serif">{`${destination}${daysCount}日游`}</div>
                    </div>
                    <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">生成中</div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="h-3 rounded-full bg-stone-100 w-5/6"></div>
                    <div className="h-3 rounded-full bg-stone-100 w-11/12"></div>
                    <div className="h-3 rounded-full bg-stone-100 w-2/3"></div>
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-3">
                    <div className="rounded-2xl border border-stone-100 bg-white/70 backdrop-blur p-4">
                      <div className="h-3 rounded-full bg-stone-100 w-32"></div>
                      <div className="mt-3 space-y-2">
                        <div className="h-3 rounded-full bg-stone-100 w-5/6"></div>
                        <div className="h-3 rounded-full bg-stone-100 w-3/4"></div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-stone-100 bg-white/70 backdrop-blur p-4">
                      <div className="h-3 rounded-full bg-stone-100 w-40"></div>
                      <div className="mt-3 space-y-2">
                        <div className="h-3 rounded-full bg-stone-100 w-2/3"></div>
                        <div className="h-3 rounded-full bg-stone-100 w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          const it = itineraryData || buildItineraryFromCurrent();
          const dayCount = state?.days || it.days?.length || 1;

          const slotText = (slot: any) => {
            const list = Array.isArray(slot?.items) ? slot.items : [];
            if (list.length === 0) return '自由安排 / 休息';
            return list
              .map((x: any) => {
                const name = String(x?.name || '').trim();
                return name;
              })
              .filter(Boolean)
              .join('、');
          };

          const textView = (
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 mb-6 overflow-hidden relative">
              <div className="absolute -top-16 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-amber-200/30 via-violet-200/20 to-indigo-200/20 blur-2xl"></div>
              <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-gradient-to-tr from-stone-200/30 via-amber-200/20 to-rose-200/20 blur-2xl"></div>

              <div className="relative p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl bg-white/70 backdrop-blur border border-white shadow-sm flex items-center justify-center">
                        <Palette size={18} className="text-amber-600" />
                      </div>
                      <div className="text-lg font-bold text-stone-900 font-serif">{it.title}</div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-50 text-stone-600 text-[11px] font-bold border border-stone-100">
                        <MapPin size={14} className="text-stone-500" />
                        {it.destination}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-50 text-stone-600 text-[11px] font-bold border border-stone-100">
                        <Sparkles size={14} className="text-amber-500" />
                        文本手帐
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-stone-100 bg-white/70 backdrop-blur p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Info size={16} />
                    </div>
                    城市简介
                  </div>
                  <div className="mt-3 text-sm text-stone-600 leading-relaxed whitespace-pre-line">{it.cityIntro}</div>
                  {it.overview && <div className="mt-2 text-xs text-stone-500 leading-relaxed whitespace-pre-line">{it.overview}</div>}
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center">
                      <ScrollText size={16} />
                    </div>
                    行程安排
                  </div>

                  <div className="space-y-4">
                    {Array.from({ length: dayCount }).map((_, i) => {
                      const day = it.days?.[i] as any;
                      return (
                        <div key={i} className="rounded-2xl border border-stone-100 bg-white/70 backdrop-blur p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-bold text-stone-900">{`Day ${i + 1}`}</div>
                            <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{formatDate(i)}</div>
                          </div>
                          <div className="mt-3 space-y-2 text-sm text-stone-700">
                            <div className="flex items-start gap-2">
                              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                                <Sun size={14} />
                              </div>
                              <div className="flex-1">
                                <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">上午</div>
                                <div className="mt-0.5">{slotText(day?.morning)}</div>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-7 h-7 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center flex-shrink-0">
                                <Sun size={14} />
                              </div>
                              <div className="flex-1">
                                <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">下午</div>
                                <div className="mt-0.5">{slotText(day?.afternoon)}</div>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-7 h-7 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center flex-shrink-0">
                                <Moon size={14} />
                              </div>
                              <div className="flex-1">
                                <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">夜晚</div>
                                <div className="mt-0.5">{slotText(day?.night)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="rounded-2xl border border-stone-100 bg-white/70 backdrop-blur p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-stone-900 mb-3">
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center">
                          <Utensils size={16} />
                        </div>
                        美食地图
                      </div>
                      <div className="space-y-2 text-sm text-stone-700">
                        <div className="flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                          <div className="flex-1">
                            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider mr-2">火锅/串串</span>
                            <span>{(it.foodMap?.hotpot || []).join('、') || '—'}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0"></span>
                          <div className="flex-1">
                            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider mr-2">地道菜</span>
                            <span>{(it.foodMap?.localCuisine || []).join('、') || '—'}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0"></span>
                          <div className="flex-1">
                            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider mr-2">特色小吃</span>
                            <span>{(it.foodMap?.snacks || []).join('、') || '—'}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-stone-400 flex-shrink-0"></span>
                          <div className="flex-1">
                            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider mr-2">美食街区</span>
                            <span>{(it.foodMap?.streets || []).join('、') || '—'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-stone-100 bg-white/70 backdrop-blur p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-stone-900 mb-3">
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
                          <Lightbulb size={16} />
                        </div>
                        实用小贴士
                      </div>
                      <div className="space-y-2">
                        {(it.tips || []).slice(0, 10).map((t, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-stone-600 leading-relaxed">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                            <span className="flex-1">{t}</span>
                          </div>
                        ))}
                        {(it.tips || []).length === 0 && (
                          <div className="text-sm text-stone-500">—</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );

          return textView;
        })()}

        <div className="h-10"></div>

        {!showExitConfirm && (
          <div className="fixed inset-x-0 bottom-0 z-[1100] pointer-events-none">
            {showOptimizeModal && (
              <div className="w-full max-w-3xl mx-auto px-4 pb-2 pointer-events-auto">
                <div className="bg-white/90 backdrop-blur border border-stone-100 shadow-2xl rounded-3xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-100 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-stone-900">与 AI 优化行程</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">告诉我你的偏好：节奏、预算、亲子、雨天备选等</div>
                    </div>
                    <button
                      onClick={() => setShowOptimizeModal(false)}
                      className="w-9 h-9 rounded-full bg-stone-50 flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="max-h-[40vh] overflow-y-auto p-4 space-y-3">
                    {optMessages.length === 0 ? (
                      <div className="text-xs text-stone-500 leading-relaxed">
                        例如：把节奏放慢一些；Day2 下午换成更适合带娃的室内项目；把火锅安排到第 1 天晚上；我不吃辣；增加都江堰一日游等。
                      </div>
                    ) : (
                      optMessages.map((m, idx) => (
                        <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                          <div
                            className={[
                              'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line',
                              m.role === 'user' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-800',
                            ].join(' ')}
                          >
                            {m.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="w-full max-w-3xl mx-auto pointer-events-auto">
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
                {['把节奏放慢一些', '增加雨天备选', '安排亲子室内'].map((text) => (
                  <button
                    key={text}
                    onClick={() => {
                      setShowOptimizeModal(true);
                      sendOptimizeMessage(text);
                    }}
                    className="whitespace-nowrap px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-stone-200/50 rounded-full text-xs font-medium text-stone-600 shadow-sm hover:bg-white hover:text-amber-600 transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>

              <div className="px-4 py-3 bg-gradient-to-t from-white via-white to-transparent">
                <div className="bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-stone-100 p-1.5 flex items-center">
                  <button
                    onClick={() => setIsVoiceMode(!isVoiceMode)}
                    className="w-10 h-10 rounded-full bg-stone-50 text-stone-500 flex items-center justify-center hover:bg-stone-100 active:scale-95 transition-all"
                    aria-label="Toggle input mode"
                  >
                    {isVoiceMode ? <Keyboard size={20} /> : <Mic size={20} />}
                  </button>

                  {isVoiceMode ? (
                    <button
                      className="flex-1 mx-2 h-9 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 rounded-full text-sm font-bold text-stone-600 select-none touch-none transition-colors flex items-center justify-center"
                      onMouseDown={() => {
                        if (!speechSupported || isOptimizing) return;
                        startRecording();
                      }}
                      onMouseUp={() => {
                        if (!speechSupported || isOptimizing) return;
                        stopRecording();
                        window.setTimeout(() => {
                          const t = optInputRef.current.trim();
                          if (t) sendOptimizeMessage(t);
                        }, 250);
                      }}
                      onTouchStart={() => {
                        if (!speechSupported || isOptimizing) return;
                        startRecording();
                      }}
                      onTouchEnd={() => {
                        if (!speechSupported || isOptimizing) return;
                        stopRecording();
                        window.setTimeout(() => {
                          const t = optInputRef.current.trim();
                          if (t) sendOptimizeMessage(t);
                        }, 250);
                      }}
                      aria-label="Hold to talk"
                      disabled={!speechSupported || isOptimizing}
                    >
                      {!speechSupported ? '当前不支持语音' : isRecording ? '松开结束' : '按住说话'}
                    </button>
                  ) : (
                    <input
                      type="text"
                      value={optInput}
                      onChange={(e) => setOptInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') sendOptimizeMessage(optInput);
                      }}
                      placeholder="说说你想怎么改行程..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 text-stone-800 placeholder-stone-400"
                    />
                  )}

                  <button
                    onClick={() => setShowOptimizeModal(true)}
                    className="w-10 h-10 rounded-full text-stone-500 flex items-center justify-center hover:bg-stone-100 active:scale-95 transition-all mr-1"
                    aria-label="Open chat"
                  >
                    <Camera size={20} />
                  </button>

                  <button
                    onClick={() => sendOptimizeMessage(optInput)}
                    disabled={!optInput.trim() || isVoiceMode || isOptimizing}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all active:scale-95 ${
                      optInput.trim() && !isVoiceMode && !isOptimizing ? 'bg-stone-900 scale-100' : 'bg-stone-300 scale-90 opacity-0 w-0 overflow-hidden'
                    }`}
                    aria-label="Send"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exit Confirm Modal */}
        {showExitConfirm && (
            <div className="fixed inset-0 z-[1300] flex items-center justify-center p-6">
              <button
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowExitConfirm(false)}
                aria-label="Close"
              />
              <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                  <div className="text-sm font-bold text-stone-900">等等！行程还没打包</div>
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    className="w-9 h-9 rounded-full bg-stone-50 flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-5">
                  <div className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                    这份行程我已经帮你安排得明明白白啦～
                    {'\n'}
                    要不要先保存再离开？
                  </div>
                  <div className="mt-5 space-y-3">
                    <button
                      onClick={async () => {
                        setShowExitConfirm(false);
                        await handleSavePlan();
                      }}
                      className="w-full h-11 rounded-2xl bg-stone-900 text-white font-bold text-sm hover:bg-stone-800 transition-colors flex items-center justify-center"
                    >
                      <Save size={18} className="mr-2" />
                      保存带走
                    </button>
                    <button
                      onClick={() => {
                        setHasUnsavedChanges(false);
                        setShowExitConfirm(false);
                        navigate('/plan');
                      }}
                      className="w-full h-11 rounded-2xl border border-stone-200 text-stone-700 font-bold text-sm hover:bg-stone-50 transition-colors"
                    >
                      不保存也要走
                    </button>
                    <button
                      onClick={() => setShowExitConfirm(false)}
                      className="w-full h-11 rounded-2xl bg-stone-50 text-stone-500 font-bold text-sm hover:bg-stone-100 transition-colors"
                    >
                      再检查一下
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

export default PlanEditor;
