import React, { useState, useMemo } from 'react';
import { X, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import type { ChatMessage } from '../services/chat';
import type { TravelogueItem } from '../services/travelogue';

interface LocationContext {
    id: string;
    name: string;
    area: string;
    coverImage: string;
}

interface TravelogueGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    location: LocationContext | null;
    persona: 'expert' | 'humorous' | 'kids';
    user?: any;
    onGenerate: (item: TravelogueItem) => void;
}

export const TravelogueGenerator: React.FC<TravelogueGeneratorProps> = ({
    isOpen,
    onClose,
    messages,
    location,
    persona,
    user,
    onGenerate
}) => {
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [isGenerating, setIsGenerating] = useState(false);

    // Extract all images from messages
    const allImages = useMemo(() => {
        const images: { url: string; msgId: string; timestamp: number }[] = [];
        messages.forEach(msg => {
            if (msg.type === 'image' && msg.sender === 'user') {
                if (Array.isArray(msg.content)) {
                    msg.content.forEach(url => images.push({ url, msgId: msg.id, timestamp: msg.timestamp }));
                } else {
                    images.push({ url: msg.content as string, msgId: msg.id, timestamp: msg.timestamp });
                }
            } else if (msg.type === 'card' && msg.cardData?.image) {
                // Also allow selecting AI recommended images (optional, but cool)
                // Let's stick to user images first as per requirement "User uploaded photos"
                // But user might want to include the artwork they saw.
                // Requirement says: "Select captured (uploaded) photos". Stick to user images for now to be safe.
            }
        });
        return images;
    }, [messages]);

    // Auto-select all images initially (up to 30)
    React.useEffect(() => {
        if (isOpen) {
            const initialSelection = new Set<string>();
            allImages.slice(0, 30).forEach(img => initialSelection.add(img.url));
            setSelectedImages(initialSelection);
        }
    }, [isOpen, allImages]);

    const toggleImage = (url: string) => {
        const newSelection = new Set(selectedImages);
        if (newSelection.has(url)) {
            newSelection.delete(url);
        } else {
            if (newSelection.size >= 30) return; // Max 30
            newSelection.add(url);
        }
        setSelectedImages(newSelection);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        
        // Simulate AI Processing
        setTimeout(() => {
            if (!location) return;

            // 1. Sort selected images by time
            const selectedList = allImages
                .filter(img => selectedImages.has(img.url))
                .sort((a, b) => a.timestamp - b.timestamp);

            if (selectedList.length === 0) {
                // Handle no images case?
                // Maybe allow text-only travelogue?
                // For MVP, require at least one image or just create a text one with cover.
            }

            // 2. Group images into timeline events (simple clustering by time)
            // or just 1 image per event for simplicity.
            // Let's try to match images to nearby AI context.

            const timeline: TravelogueItem['timeline'] = selectedList.map(img => {
                // Find nearest AI response after this image
                const imgMsgIndex = messages.findIndex(m => m.id === img.msgId);
                let aiContext = "";
                let aiTip = "";
                
                // Look ahead for AI response (explanation of the image)
                for (let i = imgMsgIndex + 1; i < messages.length; i++) {
                    const m = messages[i];
                    if (m.sender === 'agent') {
                        if (m.type === 'card' && m.cardData) {
                            aiContext = m.cardData.description || m.cardData.subtitle;
                            aiTip = `AI 识别：${m.cardData.title}`;
                            break;
                        } else if (m.type === 'text') {
                            // Use text as content
                            aiContext = (m.content as string);
                            break; // Stop after first relevant response
                        }
                    }
                    // Stop if we hit another user message (context switch)
                    if (m.sender === 'user') break;
                }

                return {
                    time: new Date(img.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    location: location.area || location.name, // Rough location
                    image: img.url,
                    content: aiContext || "精彩瞬间", // Fallback content
                    ai_tip: aiTip || undefined,
                    color: 'amber' // Default color
                };
            });

            // 3. Generate Title & Intro based on Persona
            const dateStr = new Date().toLocaleDateString().replace(/\//g, '.');
            let title = `在${location.name}的探索之旅`;
            let intro = `今天参观了${location.name}，收获满满！`;

            if (persona === 'humorous') {
                title = `居然在${location.name}发现了这些！😎`;
                intro = `本来以为逛博物馆会很无聊，没想到AI导游太有梗了！发现了好多以前不知道的趣事，必须记录一下！`;
            } else if (persona === 'kids') {
                title = `我的${location.name}大冒险 🎈`;
                intro = `今天我和AI好朋友一起去${location.name}探险啦！我们找到了好多宝藏，还听了好多有趣的故事！`;
            } else { // expert
                title = `${location.name}：深度文化巡礼`;
                intro = `在AI智能导览的陪伴下，重游${location.name}。通过深度讲解，对这些文物背后的历史有了全新的认识。`;
            }

            const newTravelogue: TravelogueItem = {
                id: `gen-${Date.now()}`,
                uid: user?.id || user?.uid, // Bind to user
                title,
                location: location.name,
                author: user?.nickname || user?.email?.split('@')[0] || '我', // Use user name if available
                avatar: user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 
                date: dateStr,
                intro,
                cover: selectedList[0]?.url || location.coverImage,
                likes: 0,
                timeline
            };

            onGenerate(newTravelogue);
            setIsGenerating(false);
            onClose();

        }, 1500); // Fake delay
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-stone-900/90 backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center sm:p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-stone-50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[800px]">
                
                {/* Header */}
                <div className="p-4 border-b border-stone-200 bg-white flex justify-between items-center flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-lg text-stone-800 flex items-center">
                            <Sparkles className="w-5 h-5 text-amber-500 mr-2" />
                            生成 AI 手帐
                        </h3>
                        <p className="text-xs text-stone-500">
                            已选择 {selectedImages.size} 张照片 (上限 30)
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                        <X size={20} className="text-stone-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {allImages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                            <ImageIcon size={48} strokeWidth={1} />
                            <p className="text-sm">本次对话暂无上传照片</p>
                            <p className="text-xs opacity-70">请在对话中拍照或上传图片后重试</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {allImages.map((img) => {
                                const isSelected = selectedImages.has(img.url);
                                return (
                                    <button 
                                        key={img.url}
                                        onClick={() => toggleImage(img.url)}
                                        className={`relative aspect-square rounded-lg overflow-hidden group transition-all ${
                                            isSelected ? 'ring-2 ring-amber-500 ring-offset-2' : 'opacity-80 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={img.url} alt="User upload" className="w-full h-full object-cover" />
                                        
                                        <div className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                                            isSelected ? 'bg-amber-500 text-white' : 'bg-black/30 text-transparent border border-white/50'
                                        }`}>
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-stone-200 flex-shrink-0 safe-area-bottom">
                    <button 
                        onClick={handleGenerate}
                        disabled={selectedImages.size === 0 || isGenerating}
                        className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center transition-all ${
                            selectedImages.size === 0 
                                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                : 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] shadow-lg shadow-stone-900/20'
                        }`}
                    >
                        {isGenerating ? (
                            <>
                                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                                正在生成精彩回忆...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                立即生成手帐
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};
