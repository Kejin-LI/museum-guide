import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Map, Star, Plus, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    const [isLoading, setIsLoading] = useState(false);
    
    // Determine type based on path
    const type = location.pathname.split('/').pop(); // 'journals', 'plans', 'favorites'

    useEffect(() => {
        if (type === 'plans') {
            const loadPlans = async () => {
                setIsLoading(true);
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
                setIsLoading(false);
            };
            loadPlans();
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
    } else if (type === 'favorites') {
        config = {
            title: '我的收藏',
            emptyIcon: <Star size={48} strokeWidth={1.5} />,
            emptyTitle: '收藏夹比脸还干净',
            emptyDesc: '遇到喜欢的博物馆或展品别犹豫。\n收藏是为了更好的重逢。',
            actionText: '去探索',
            onAction: () => navigate('/community')
        };
    }

    return (
        <div className="flex flex-col h-screen bg-stone-50 text-stone-800 max-w-md mx-auto w-full shadow-xl">
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

            <main className="flex-1 overflow-y-auto">
                {type === 'plans' && plans.length > 0 ? (
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
            </main>
        </div>
    );
};

export default UserContentList;
