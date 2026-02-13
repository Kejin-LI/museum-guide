import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Clock, GripVertical, Trash2, Plus, Calendar as CalendarIcon, MapPin, Edit2, X, Save } from 'lucide-react';
import { planService, type SavedPlan } from '../services/plan';

// Interfaces
interface Spot {
  id: string;
  name: string;
  image: string;
  duration: number; // hours
  tag?: string;
}

interface LocationState {
  destination: string;
  days: number;
  preferences: string[];
  startDate: string | null;
}

// Edit Modal Component
const EditSpotModal = ({ 
    spot, 
    title = '编辑景点',
    onClose, 
    onSave 
}: { 
    spot: Spot; 
    title?: string;
    onClose: () => void; 
    onSave: (id: string, name: string, duration: number) => void; 
}) => {
    const [name, setName] = useState(spot.name);
    const [duration, setDuration] = useState(spot.duration.toString());

    const handleSave = () => {
        const numDuration = parseFloat(duration);
        if (!name.trim()) {
            alert('请输入景点名称');
            return;
        }
        if (isNaN(numDuration) || numDuration <= 0) {
            alert('请输入有效的游玩时长');
            return;
        }
        onSave(spot.id, name, numDuration);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-stone-900">{title}</h3>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 bg-stone-100 p-2 rounded-full">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">景点名称</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-amber-200 focus:outline-none font-medium"
                            placeholder="输入景点名称"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">游玩时长 (小时)</label>
                        <div className="relative">
                            <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input 
                                type="number" 
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                step="0.5"
                                min="0.5"
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-stone-900 focus:ring-2 focus:ring-amber-200 focus:outline-none font-medium"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full bg-stone-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center mt-2"
                    >
                        <Save size={18} className="mr-2" />
                        保存修改
                    </button>
                </div>
            </div>
        </div>
    );
};

// Sortable Item Component
const SortableItem = ({ spot, onDelete, onEdit }: { spot: Spot; onDelete: (id: string) => void; onEdit: (spot: Spot) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: spot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 flex items-center space-x-3 mb-3 touch-manipulation group"
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners} 
        className="text-stone-300 cursor-grab active:cursor-grabbing p-1 hover:text-stone-500"
      >
        <GripVertical size={20} />
      </div>

      {/* Image */}
      <div className="w-16 h-16 rounded-xl bg-stone-200 overflow-hidden flex-shrink-0">
        <img 
          src={spot.image} 
          alt={spot.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.style.background = 'linear-gradient(135deg, #e7e5e4 0%, #d6d3d1 100%)';
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-stone-900 text-base truncate">{spot.name}</h4>
        <div className="flex items-center space-x-2 mt-1">
          <div className="flex items-center text-stone-500 text-xs">
            <Clock size={12} className="mr-1" />
            <span>预计 {spot.duration} 小时</span>
          </div>
          {spot.tag && (
            <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-md font-medium">
              {spot.tag}
            </span>
          )}
        </div>
      </div>

      {/* Edit Button */}
      <button 
        onClick={() => onEdit(spot)}
        className="p-2 text-stone-300 hover:text-amber-500 transition-colors mr-1"
      >
        <Edit2 size={18} />
      </button>

      {/* Delete Button */}
      <button 
        onClick={() => onDelete(spot.id)}
        className="p-2 text-stone-300 hover:text-red-400 transition-colors"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

// Day Container Component
const DayContainer = ({ 
  id, 
  date, 
  spots, 
  onDelete,
  onAdd,
  onEdit
}: { 
  id: string; 
  date: string; 
  dayIndex: number; 
  spots: Spot[];
  onDelete: (id: string) => void;
  onAdd: (id: string) => void;
  onEdit: (spot: Spot) => void;
}) => {
  const { setNodeRef } = useSortable({ id });

  return (
    <div ref={setNodeRef} className="mb-6">
      <div className="flex items-center space-x-2 mb-3 px-1">
        <div className="text-stone-900 font-bold text-lg flex items-center">
          <CalendarIcon size={18} className="mr-2 text-amber-500" />
          {date}
        </div>
      </div>
      
      <div className="bg-stone-100/50 rounded-3xl p-3 min-h-[100px] border border-stone-200/50">
        <SortableContext 
          id={id} 
          items={spots.map(s => s.id)} 
          strategy={verticalListSortingStrategy}
        >
          {spots.length === 0 ? (
             <div className="h-20 mb-2 flex flex-col items-center justify-center text-stone-400 text-xs border-2 border-dashed border-stone-200 rounded-2xl">
                <span>暂无安排</span>
             </div>
          ) : (
             spots.map((spot) => (
                <SortableItem key={spot.id} spot={spot} onDelete={onDelete} onEdit={onEdit} />
              ))
          )}
        </SortableContext>

        <button 
            onClick={() => onAdd(id)}
            className="w-full py-3 rounded-xl border-2 border-dashed border-stone-200 text-stone-400 flex items-center justify-center hover:bg-white hover:border-amber-300 hover:text-amber-500 transition-all active:scale-[0.98]"
        >
            <Plus size={18} />
            <span className="ml-1.5 text-xs font-bold">添加景点</span>
        </button>
      </div>
    </div>
  );
};

const PlanEditor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  // Mock Data Generators
  // MOCK_SPOTS moved to local variable or outside component, but since it was removed by mistake in previous edits, let's restore it.
  const MOCK_SPOTS: Record<string, Spot[]> = {
    '北京': [
      { id: '1', name: '故宫博物院', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Forbidden_City_Beijing_Shenwu_Gate_2004_January.jpg/640px-Forbidden_City_Beijing_Shenwu_Gate_2004_January.jpg', duration: 4.0, tag: '必游' },
      { id: '2', name: '景山公园', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Jingshan_Wanchun_Pavilion.jpg/640px-Jingshan_Wanchun_Pavilion.jpg', duration: 1.5 },
      { id: '3', name: '南锣鼓巷', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Nanluoguxiang_2010.jpg/640px-Nanluoguxiang_2010.jpg', duration: 2.0 },
      { id: '4', name: '天坛公园', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Temple_of_Heaven_Hall_of_Prayer_for_Good_Harvests_2004_January.jpg/640px-Temple_of_Heaven_Hall_of_Prayer_for_Good_Harvests_2004_January.jpg', duration: 3.0, tag: '世界遗产' },
      { id: '5', name: '国家博物馆', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/National_Museum_of_China_2017.jpg/640px-National_Museum_of_China_2017.jpg', duration: 4.0, tag: '热门' },
      { id: '6', name: '颐和园', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Summer_Palace_Beijing.jpg/640px-Summer_Palace_Beijing.jpg', duration: 4.0, tag: '皇家园林' },
      { id: '7', name: '圆明园', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Ruins_of_the_Old_Summer_Palace.jpg/640px-Ruins_of_the_Old_Summer_Palace.jpg', duration: 3.0 },
      { id: '8', name: '雍和宫', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Yonghe_Temple_2010.jpg/640px-Yonghe_Temple_2010.jpg', duration: 2.0 },
    ],
    'default': [
      { id: '101', name: '市中心博物馆', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg/640px-Colosseum_in_Rome%2C_Italy_-_April_2007.jpg', duration: 3.0, tag: '必游' },
      { id: '102', name: '城市公园', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Altja_j%C3%B5gi_Lahemaal.jpg/640px-Altja_j%C3%B5gi_Lahemaal.jpg', duration: 2.0 },
      { id: '103', name: '特色古街', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Paris_Night.jpg/640px-Paris_Night.jpg', duration: 2.5 },
    ]
  };

  // State
  // items: { 'day-0': [Spot...], 'day-1': [Spot...] }
  const [items, setItems] = useState<Record<string, Spot[]>>({});
  const [title, setTitle] = useState('');
  const [startDateStr, setStartDateStr] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [addingDayId, setAddingDayId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialization
  useEffect(() => {
    if (!state) {
      setTitle('自定义行程');
      setItems({ 'day-0': MOCK_SPOTS['default'] });
      return;
    }

    const { destination, preferences, days, startDate } = state;
    setStartDateStr(startDate);
    
    // Title
    const prefStr = preferences.length > 0 ? preferences.join('、') : '';
    setTitle(`${destination}${prefStr}${days}日游`);

    // Distribute Spots
    const citySpots = MOCK_SPOTS[destination] || MOCK_SPOTS['Beijing'] || MOCK_SPOTS['default'];
    // Let's just flatten and repeat to ensure we have enough for demo
    let pool = [...citySpots, ...citySpots, ...citySpots]; 
    
    const newItems: Record<string, Spot[]> = {};
    
    for (let i = 0; i < days; i++) {
        // Assign 2-3 spots per day randomly
        const count = Math.floor(Math.random() * 2) + 2; 
        const daySpots = pool.splice(0, count).map(s => ({
            ...s, 
            id: `spot-${i}-${s.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Ensure unique IDs
        }));
        newItems[`day-${i}`] = daySpots;
    }
    
    setItems(newItems);
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

  // Helper to find container of an item
  const findContainer = (id: string) => {
    if (id in items) {
      return id;
    }
    return Object.keys(items).find((key) => items[key].find((item) => item.id === id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) {
      return;
    }

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(overId as string);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    // Check duration constraint for moving between containers
    const activeItem = items[activeContainer].find(i => i.id === active.id);
    if (activeItem) {
        const targetSpots = items[overContainer];
        const targetDuration = targetSpots.reduce((acc, s) => acc + s.duration, 0);
        if (targetDuration + activeItem.duration > 24) {
            // Prevent drag if it exceeds limit (visually it might revert or show error, 
            // but dnd-kit handles revert better in onDragEnd usually. 
            // However, preventing state update here stops the visual move)
            return;
        }
    }

    setItems((prev) => {
        setHasUnsavedChanges(true);
        const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((i) => i.id === active.id);
      const overIndex = overItems.findIndex((i) => i.id === overId);

      let newIndex;
      if (overId in prev) {
        // We're over a container
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top >
            over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        [activeContainer]: [
          ...prev[activeContainer].filter((item) => item.id !== active.id),
        ],
        [overContainer]: [
          ...prev[overContainer].slice(0, newIndex),
          activeItems[activeIndex],
          ...prev[overContainer].slice(newIndex, prev[overContainer].length),
        ],
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over?.id as string);

    if (
      activeContainer &&
      overContainer &&
      activeContainer === overContainer
    ) {
      const activeIndex = items[activeContainer].findIndex((i) => i.id === active.id);
      const overIndex = items[overContainer].findIndex((i) => i.id === over!.id);

      if (activeIndex !== overIndex) {
        setHasUnsavedChanges(true);
        setItems((prev) => ({
          ...prev,
          [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
        }));
      }
    }

    setActiveId(null);
  };

  const handleDelete = (id: string) => {
    const container = findContainer(id);
    if (container) {
        setHasUnsavedChanges(true);
        setItems(prev => ({
            ...prev,
            [container]: prev[container].filter(item => item.id !== id)
        }));
    }
  };

  const handleAddSpotClick = (dayId: string) => {
      setAddingDayId(dayId);
  };

  const handleConfirmAddSpot = (_id: string, name: string, duration: number) => {
    if (!addingDayId) return;

    // Check total duration for the day
    const currentSpots = items[addingDayId] || [];
    const totalDuration = currentSpots.reduce((acc, spot) => acc + spot.duration, 0);
    
    if (totalDuration + duration > 24) {
        alert('当天行程安排已超过24小时，请调整后再添加！');
        return;
    }

    const newSpot: Spot = {
      id: `new-${Date.now()}`,
      name: name,
      image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=400&auto=format&fit=crop', 
      duration: duration,
      tag: '自定义'
    };
    
    setItems(prev => ({
        ...prev,
        [addingDayId]: [...prev[addingDayId], newSpot]
    }));
    
    setHasUnsavedChanges(true);
    setAddingDayId(null);
  };

  const handleUpdateSpot = (id: string, name: string, duration: number) => {
      const container = findContainer(id);
      if (container) {
          // Check duration constraint
          const currentSpots = items[container];
          const otherSpotsDuration = currentSpots
            .filter(s => s.id !== id)
            .reduce((acc, s) => acc + s.duration, 0);
            
          if (otherSpotsDuration + duration > 24) {
             alert('修改后当天行程将超过24小时，无法保存！');
             return;
          }

          setItems(prev => ({
              ...prev,
              [container]: prev[container].map(item => 
                  item.id === id ? { ...item, name, duration } : item
              )
          }));
          setHasUnsavedChanges(true);
      }
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
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

      // Prepare Plan Object
      const newPlan: SavedPlan = {
          id: Date.now().toString(),
          uid: uid || undefined, // Associate plan with user
          title: title,
          destination: state?.destination || '未知目的地',
          days: state?.days || 0,
          startDate: startDateStr,
          image: items['day-0']?.[0]?.image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=400&auto=format&fit=crop',
          status: 'upcoming', // or 'draft'
          createdAt: Date.now()
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
    <div className="flex flex-col h-full bg-stone-50 text-stone-800">
      {/* Header */}
      <header className="px-4 py-4 bg-white sticky top-0 z-20 border-b border-stone-100 flex items-center justify-between shadow-sm">
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
                {state?.destination || '自定义'}
            </div>
        </div>
        <button 
            onClick={handleSavePlan}
            className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
        >
            保存
        </button>
      </header>

      <main className="flex-1 px-4 py-6 overflow-y-auto pb-20">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-2">
            {Object.keys(items).sort().map((dayKey, index) => (
               <DayContainer 
                 key={dayKey}
                 id={dayKey}
                 dayIndex={index}
                 date={formatDate(index)}
                 spots={items[dayKey]}
                 onDelete={handleDelete}
                 onAdd={() => handleAddSpotClick(dayKey)}
                 onEdit={setEditingSpot}
               />
            ))}
          </div>
          
          <DragOverlay dropAnimation={dropAnimation}>
            {activeId ? (
                // Render a preview of the dragging item
               <div className="bg-white rounded-2xl p-3 shadow-xl border-2 border-amber-400 flex items-center space-x-3 opacity-90 scale-105">
                   {/* Simplified preview */}
                   <div className="w-16 h-16 rounded-xl bg-stone-200 overflow-hidden flex-shrink-0">
                       <div className="w-full h-full bg-stone-300"></div>
                   </div>
                   <div className="flex-1">
                       <h4 className="font-bold text-stone-900">正在移动...</h4>
                   </div>
               </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="h-10"></div>

        {/* Edit Modal */}
        {editingSpot && (
            <EditSpotModal 
                spot={editingSpot} 
                onClose={() => setEditingSpot(null)} 
                onSave={handleUpdateSpot} 
            />
        )}

        {/* Add Modal */}
        {addingDayId && (
            <EditSpotModal 
                title="添加新景点"
                spot={{
                    id: 'new-temp',
                    name: '',
                    image: '',
                    duration: 1.5,
                    tag: '自定义'
                }} 
                onClose={() => setAddingDayId(null)} 
                onSave={handleConfirmAddSpot} 
            />
        )}

        {/* Exit Confirm Modal */}
        {showExitConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                    <h3 className="text-xl font-bold text-stone-900 mb-2">确认离开？</h3>
                    <p className="text-sm text-stone-500 mb-6">您有未保存的修改，离开后将丢失所有更改。</p>
                    
                    <div className="flex space-x-3">
                        <button 
                            onClick={() => setShowExitConfirm(false)}
                            className="flex-1 bg-stone-100 text-stone-600 font-bold py-3 rounded-xl hover:bg-stone-200 transition-colors"
                        >
                            继续编辑
                        </button>
                        <button 
                            onClick={() => navigate('/plan')}
                            className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl shadow-md hover:bg-red-600 transition-colors"
                        >
                            确认退出
                        </button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default PlanEditor;
