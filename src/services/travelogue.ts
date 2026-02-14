export interface TravelogueItem {
    id: string;
    title: string;
    location: string;
    author: string;
    avatar: string;
    date: string; // YYYY.MM.DD
    intro: string;
    cover: string;
    likes: number;
    timeline: {
        time: string;
        location: string;
        image: string;
        content: string;
        ai_tip?: string;
        color?: string;
    }[];
}

const TRAVELOGUES: TravelogueItem[] = [
    {
        id: '1',
        title: '在大英博物馆迷路的一天，偶遇这尊雕像...',
        location: 'British Museum, London 🇬🇧',
        author: '旅行家小A',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100',
        date: '2023.11.12',
        intro: '真的很震撼，特别是AI讲解提到的那个细节，完全没想到背后还有这样的故事。大英博物馆的每一个角落都藏着世界的秘密。',
        cover: 'https://images.unsplash.com/photo-1569407228235-9a744831a150?q=80&w=800&auto=format&fit=crop',
        likes: 128,
        timeline: [
            {
                time: '10:00',
                location: '罗塞塔石碑',
                image: 'https://images.unsplash.com/photo-1569407228235-9a744831a150?auto=format&fit=crop&q=80&w=800',
                content: '人山人海！终于挤进去看了一眼镇馆之宝。上面的三种文字对照，真的是解开古埃及文明的钥匙。',
                ai_tip: '石碑上的文字分别是古埃及象形文、通俗体文字和古希腊文。'
            },
            {
                time: '14:30',
                location: '帕特农神庙石雕',
                image: 'https://images.unsplash.com/photo-1580136608260-4eb11f4b64fe?auto=format&fit=crop&q=80&w=800',
                content: '残缺的美感。即使不在雅典卫城，这些大理石雕像依然散发着古希腊艺术的巅峰魅力。',
                ai_tip: '注意观察衣褶的处理，那种“湿衣法”展现了极高超的雕刻技艺。'
            }
        ]
    },
    {
        id: '2',
        title: '故宫的雪景真的太美了！',
        location: 'The Palace Museum, Beijing 🇨🇳',
        author: '北漂日记',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
        date: '2023.12.20',
        intro: '红墙白雪，仿佛穿越回了百年前。站在景山俯瞰紫禁城全貌，那种庄严与静谧，是照片无法完全传达的。每一片雪花落下，都是历史的回响。❄️',
        cover: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=800&auto=format&fit=crop',
        likes: 856,
        timeline: [
            {
                time: '08:30',
                location: '午门',
                image: 'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?q=80&w=800&auto=format&fit=crop',
                content: '一大早就冲进来了！红墙在白雪的映衬下更加鲜艳。',
                ai_tip: '午门是紫禁城的正门，也是皇帝下诏书、出征的地方。'
            },
            {
                time: '16:00',
                location: '角楼',
                image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&q=80&w=800',
                content: '夕阳西下，角楼的倒影在结冰的护城河上，美得像一幅画。',
                ai_tip: '角楼设计精巧，九梁十八柱七十二条脊，是木结构建筑的杰作。'
            }
        ]
    },
    {
        id: '3',
        title: '京都古寺巡礼',
        location: 'Kyoto, Japan 🇯🇵',
        author: '林小夏',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100',
        date: '2023.11.05',
        intro: '在岚山的竹林里听风，在金阁寺看夕阳。京都的秋天，是红叶与古刹的完美交响。',
        cover: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800',
        likes: 128,
        timeline: [
            {
                time: '09:00',
                location: '金阁寺',
                image: 'https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?auto=format&fit=crop&q=80&w=800',
                content: '金碧辉煌的舍利殿在镜湖池中的倒影，美得不真实。',
                ai_tip: '金阁寺正式名称为鹿苑寺，是足利义满将军的山庄。'
            }
        ]
    },
    {
        id: '4',
        title: '罗马假日：永恒之城的漫步',
        location: 'Rome, Italy 🇮🇹',
        author: 'Alice Wang',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=50&auto=format&fit=crop',
        date: '2023.10.05',
        intro: '在罗马的每一块石头都仿佛在诉说着历史。这次旅行虽然只有短短三天，但AI导览带我发现了好多不为人知的小秘密！✨',
        cover: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800',
        likes: 342,
        timeline: [
             {
                time: '09:30',
                location: '古罗马斗兽场',
                image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800',
                content: '人真的超级多！幸好提前预约了。站在看台上想象当年的场景，真的会被震撼到。',
                ai_tip: '原来斗兽场不仅可以看角斗，在公元80年还曾被灌满水，用来模拟海战表演！太不可思议了 🌊',
                color: 'blue'
            }
        ]
    },
    {
        id: '5',
        title: '卢浮宫的午后光影',
        location: 'Louvre Museum, Paris 🇫🇷',
        author: 'Art Lover',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
        date: '2024.01.15',
        intro: '贝聿铭的金字塔在阳光下闪闪发光。虽然没能挤进去看蒙娜丽莎的正面，但维纳斯的背影也足够迷人。',
        cover: 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?auto=format&fit=crop&q=80&w=800',
        likes: 520,
        timeline: [
            {
                time: '13:00',
                location: '卢浮宫金字塔',
                image: 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?auto=format&fit=crop&q=80&w=800',
                content: '现代与古典的完美融合。',
                ai_tip: '玻璃金字塔由603块菱形玻璃和70块三角形玻璃拼装而成。'
            }
        ]
    }
];

export const travelogueService = {
    getAll: async (): Promise<TravelogueItem[]> => {
        // Mock async delay
        return new Promise((resolve) => {
            setTimeout(() => {
                // Sort by date descending (Newest first)
                const sorted = [...TRAVELOGUES].sort((a, b) => 
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                resolve(sorted);
            }, 100); 
        });
    },

    getRecent: async (limit: number = 5): Promise<TravelogueItem[]> => {
        const all = await travelogueService.getAll();
        return all.slice(0, limit);
    },

    getById: async (id: string): Promise<TravelogueItem | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(TRAVELOGUES.find(t => t.id === id));
            }, 50);
        });
    }
};
