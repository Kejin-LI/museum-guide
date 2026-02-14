import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Map, Plus, MapPin, Trash2, Calendar, Star } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { travelogueService, type TravelogueItem } from '../services/travelogue';
import { planService, type SavedPlan } from '../services/plan';

type EmptyStateProps = {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionText: string;
    onAction: () => void;
};

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actionText, onAction }) => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-6 text-stone-400 relative">
            {icon}
            <div className="absolute top-0 right-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 animate-bounce delay-700">
                <Star size={14} fill="currentColor" />
            </div>
        </div>
        <h3 className="text-xl font-bold font-serif text-stone-800 mb-2">{title}</h3>
        <p className="text-stone-500 text-sm mb-8 leading-relaxed max-w-xs">
            {description}
        </p>
        <button 
            onClick={onAction}
            className="px-8 py-3 bg-stone-900 text-white rounded-xl font-medium shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-95 transition-all flex items-center"
        >
            <Plus size={18} className="mr-2" />
            {actionText}
        </button>
    </div>
);

const UserContentList: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [plans, setPlans] = useState<SavedPlan[]>([]);
    const [journals, setJournals] = useState<TravelogueItem[]>([]);
    // const [isLoading, setIsLoading] = useState(false);
    
    // Determine type based on path
    const type = location.pathname.split('/').pop(); // 'journals', 'plans', 'favorites'

    useEffect(() => {
        // Common User Loading Logic
        const loadUser = () => {
            const userStr = localStorage.getItem('museum_user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    return user.id || user.uid;
                } catch (e) {
                    console.error("Failed to parse user", e);
                }
            }
            return null;
        };
        const uid = loadUser();

        if (type === 'plans') {
            const loadPlans = async () => {
                if (uid) {
                    const sbPlans = await planService.getUserPlans(uid);
                    if (sbPlans.length > 0) {
                        setPlans(sbPlans);
                    } else {
                        const savedPlansStr = localStorage.getItem('my_plans');
                        if (savedPlansStr) {
                            const allPlans: SavedPlan[] = JSON.parse(savedPlansStr);
                            const userPlans = allPlans.filter(p => p.uid === uid);
                            setPlans(userPlans);
                        }
                    }
                } else {
                    setPlans([]);
                }
            };
            loadPlans();
        } else if (type === 'journals') {
            const loadJournals = async () => {
                if (uid) {
                    const myJournals = await travelogueService.getUserTravelogues(uid);
                    setJournals(myJournals);
                } else {
                    // For guests, maybe show what they just created in session? 
                    // Or just empty if strictly "My" requires auth.
                    // Requirement says "My Travelogues", usually implies logged in.
                    // But if we used localStorage fallback in service, let's try to load from there for guest too?
                    // The service currently assumes userTravelogues in localstorage are mixed.
                    // If we want to support guest local storage, we can fetch all and filter by "no uid" or just show all local ones.
                    // For now, let's just use what service returns. Service getUserTravelogues requires UID.
                    // If no UID, maybe we should show empty or prompt login.
                    setJournals([]);
                }
            };
            loadJournals();
        }
    }, [type]);
    
    let config = {
        title: '列表',
        emptyIcon: <BookOpen size={40} />,
        emptyTitle: '暂无内容',
        emptyDesc: '这里空空如也',
        actionText: '去创作',
        onAction: () => navigate('/')
    };

    const handleDeleteJournal = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('确定要删除这篇手帐吗？')) {
            await travelogueService.delete(id);
            setJournals(prev => prev.filter(j => j.id !== id));
        }
    };

    if (type === 'journals') {
        config = {
            title: '我的手帐',
            emptyIcon: <BookOpen size={48} strokeWidth={1.5} />,
            emptyTitle: '一本手帐都没有？',
            emptyDesc: '生活需要一点仪式感。试着在导览过程中记录下那些让你心动的瞬间吧！',
            actionText: '去写手帐',
            onAction: () => navigate('/guide') // Create journal from guide usually
        };
    } else if (type === 'plans') {
        config = {
            title: '我的计划',
            emptyIcon: <Map size={48} strokeWidth={1.5} />,
            emptyTitle: '还没想好去哪？',
            emptyDesc: '世界那么大，不想去看看吗？\n让 AI 为你定制一场说走就走的旅行。',
            actionText: '创建新计划',
            onAction: () => navigate('/plan')
        };
    }

    return (
        <div className="flex flex-col h-screen bg-stone-50 text-stone-800 w-full shadow-xl">
            {/* Header */}
            <header className="px-6 py-4 flex items-center bg-white border-b border-stone-100 sticky top-0 z-10">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold font-serif text-stone-900 ml-2">{config.title}</h1>
            </header>

            <main className="flex-1 overflow-y-auto flex flex-col items-center">
                <div className="w-full max-w-3xl flex-1">
                {type === 'journals' && journals.length > 0 ? (
                    <div className="p-4 space-y-4">
                        {journals.map(journal => (
                            <div 
                                key={journal.id} 
                                onClick={() => navigate(`/travelogue/${journal.id}`)}
                                className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 flex space-x-4 active:scale-[0.99] transition-transform relative group"
                            >
                                <div className="w-24 h-24 rounded-xl bg-stone-200 overflow-hidden flex-shrink-0 relative">
                                    <img 
                                        src={journal.cover} 
                                        alt={journal.title} 
                                        className="w-full h-full object-cover"
                                    />
                                    {journal.is_public && (
                                        <div className="absolute top-1 left-1 bg-black/50 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md">
                                            已发布
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                                    <div>
                                        <h4 className="font-bold text-stone-900 text-base leading-tight mb-1 line-clamp-2">{journal.title}</h4>
                                        <div className="flex items-center text-stone-500 text-xs mt-1">
                                            <MapPin size={12} className="mr-1 flex-shrink-0" />
                                            <span className="truncate">{journal.location}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="text-xs text-stone-400 font-medium flex items-center">
                                            <Calendar size={12} className="mr-1" />
                                            {journal.date}
                                        </span>
                                        
                                        <button 
                                            onClick={(e) => handleDeleteJournal(e, journal.id)}
                                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : type === 'plans' && plans.length > 0 ? (
                    <div className="p-4 space-y-4">
                        {plans.map(plan => (
                            <div key={plan.id} className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 flex space-x-4 active:scale-[0.99] transition-transform">
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
                                        <h4 className="font-bold text-stone-900 text-lg leading-tight mb-1 line-clamp-1">{plan.title}</h4>
                                        <div className="flex items-center text-stone-500 text-xs">
                                            <MapPin size={12} className="mr-1" />
                                            <span>{plan.destination}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs text-stone-400 font-medium">
                                            {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : '未定'}
                                        </span>
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
                        ))}
                    </div>
                ) : (
                    <EmptyState 
                        icon={config.emptyIcon}
                        title={config.emptyTitle}
                        description={config.emptyDesc}
                        actionText={config.actionText}
                        onAction={config.onAction}
                    />
                )}
                </div>
            </main>
        </div>
    );
};

export default UserContentList;
