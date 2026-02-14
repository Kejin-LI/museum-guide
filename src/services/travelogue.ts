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
        date: '2026.01.12',
        intro: '真的很震撼，特别是AI讲解提到的那个细节，完全没想到背后还有这样的故事。大英博物馆的每一个角落都藏着世界的秘密。',
        cover: 'https://images.unsplash.com/photo-1569407228235-9a744831a150?q=80&w=800&auto=format&fit=crop',
        likes: 128,
        timeline: [
            {
                time: '10:00',
                location: '罗塞塔石碑',
                image: 'https://images.unsplash.com/photo-1569407228235-9a744831a150?auto=format&fit=crop&q=80&w=800',
                content: '人山人海！终于挤进去看了一眼镇馆之宝。上面的三种文字对照，真的是解开古埃及文明的钥匙。',
                ai_tip: '石碑上的文字分别是古埃及象形文、通俗体文字和古希腊文。',
                color: 'amber'
            },
            {
                time: '11:30',
                location: '拉美西斯二世像',
                image: 'https://images.unsplash.com/photo-1544211186-0610f446152a?auto=format&fit=crop&q=80&w=800',
                content: '这位法老的雕像虽然只剩下上半身，但依然能感受到他的威严。右臂上的圆孔据说是为了方便运输而打的。',
                ai_tip: '拉美西斯二世是古埃及最伟大的法老之一，在位长达66年。'
            },
            {
                time: '13:00',
                location: '阿美诺菲斯三世头像',
                image: 'https://images.unsplash.com/photo-1572297794908-f21af097760d?auto=format&fit=crop&q=80&w=800',
                content: '巨大的花岗岩头像，嘴角带着神秘的微笑。',
            },
            {
                time: '14:30',
                location: '帕特农神庙石雕',
                image: 'https://images.unsplash.com/photo-1605559911160-a60e261f01c0?auto=format&fit=crop&q=80&w=800',
                content: '残缺的美感。即使不在雅典卫城，这些大理石雕像依然散发着古希腊艺术的巅峰魅力。',
                ai_tip: '注意观察衣褶的处理，那种“湿衣法”展现了极高超的雕刻技艺。',
                color: 'blue'
            },
            {
                time: '16:00',
                location: '复活节岛摩艾石像',
                image: 'https://images.unsplash.com/photo-1516815231560-8f41ec531527?auto=format&fit=crop&q=80&w=800',
                content: '没想到在这里也能看到“Hoa Hakananai\'a”，它的名字意思是“被偷走的朋友”。',
                ai_tip: '这尊石像背部刻有独特的鸟人崇拜浮雕，非常罕见。'
            }
        ]
    },
    {
        id: '2',
        title: '故宫的雪景真的太美了！',
        location: 'The Palace Museum, Beijing 🇨🇳',
        author: '北漂日记',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
        date: '2026.02.05',
        intro: '红墙白雪，仿佛穿越回了百年前。站在景山俯瞰紫禁城全貌，那种庄严与静谧，是照片无法完全传达的。每一片雪花落下，都是历史的回响。❄️',
        cover: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=800&auto=format&fit=crop',
        likes: 856,
        timeline: [
            {
                time: '08:30',
                location: '午门',
                image: 'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?q=80&w=800&auto=format&fit=crop',
                content: '一大早就冲进来了！红墙在白雪的映衬下更加鲜艳。',
                ai_tip: '午门是紫禁城的正门，也是皇帝下诏书、出征的地方。',
                color: 'red'
            },
            {
                time: '09:45',
                location: '太和殿',
                image: 'https://images.unsplash.com/photo-1584652868574-0669f4292976?auto=format&fit=crop&q=80&w=800',
                content: '站在广场上，看着宏伟的太和殿，真的能感受到皇权的威严。广场上的地砖据说有七层，是为了防刺客挖地道。',
                ai_tip: '太和殿屋脊上的走兽多达10个，是现存古建筑中等级最高的。'
            },
            {
                time: '11:00',
                location: '保和殿',
                image: 'https://images.unsplash.com/photo-1629906798628-91216b206774?auto=format&fit=crop&q=80&w=800',
                content: '这里是清朝举行殿试的地方。后面的云龙大石雕真的太壮观了！',
            },
            {
                time: '13:30',
                location: '珍宝馆',
                image: 'https://images.unsplash.com/photo-1598322630043-f664b0365780?auto=format&fit=crop&q=80&w=800',
                content: '被各种金银玉器闪瞎了眼。那个金瓯永固杯做得太精致了。',
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
        date: '2026.01.28',
        intro: '在岚山的竹林里听风，在金阁寺看夕阳。京都的秋天，是红叶与古刹的完美交响。',
        cover: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800',
        likes: 128,
        timeline: [
            {
                time: '09:00',
                location: '金阁寺',
                image: 'https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?auto=format&fit=crop&q=80&w=800',
                content: '金碧辉煌的舍利殿在镜湖池中的倒影，美得不真实。',
                ai_tip: '金阁寺正式名称为鹿苑寺，是足利义满将军的山庄。',
                color: 'yellow'
            },
            {
                time: '11:00',
                location: '龙安寺',
                image: 'https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?auto=format&fit=crop&q=80&w=800',
                content: '枯山水庭园的代表。坐在回廊上看着这15块石头，心真的会静下来。',
                ai_tip: '无论从哪个角度看，你都无法同时看到全部15块石头。'
            },
            {
                time: '13:30',
                location: '岚山竹林',
                image: 'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&q=80&w=800',
                content: '漫步在翠绿的竹林小径，风吹过竹叶的声音特别治愈。',
            },
            {
                time: '15:00',
                location: '天龙寺',
                image: 'https://images.unsplash.com/photo-1558862107-d49ef2a04d72?auto=format&fit=crop&q=80&w=800',
                content: '曹源池庭园借景岚山，四季景色各异。',
            },
            {
                time: '17:00',
                location: '伏见稻荷大社',
                image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&q=80&w=800',
                content: '千本鸟居延绵不绝，朱红色的隧道通向山顶，非常震撼。',
                ai_tip: '这里供奉的是稻荷大神，狐狸是神的使者，所以到处都是狐狸雕像。'
            }
        ]
    },
    {
        id: '4',
        title: '罗马假日：永恒之城的漫步',
        location: 'Rome, Italy 🇮🇹',
        author: 'Alice Wang',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=50&auto=format&fit=crop',
        date: '2026.02.10',
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
            },
            {
                time: '11:00',
                location: '君士坦丁凯旋门',
                image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800',
                content: '就在斗兽场旁边，保存得非常完好。',
                ai_tip: '为了庆祝君士坦丁大帝统一罗马帝国而建，上面的浮雕很多是从早期建筑上拆下来的。'
            },
            {
                time: '13:00',
                location: '万神殿',
                image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&q=80&w=800',
                content: '巨大的穹顶没有一根柱子支撑，只有顶部一个圆孔采光，光束照进来的那一刻太神圣了。',
                ai_tip: '万神殿是古罗马建筑艺术的杰作，拉斐尔的墓就在这里。'
            },
            {
                time: '14:00',
                location: '特莱维喷泉',
                image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&q=80&w=800',
                content: '许愿的人把池子围得水泄不通，好不容易才挤进去抛了硬币！希望愿望成真 🙏',
                ai_tip: '背对喷泉，右手拿硬币从左肩上方抛入水中。一枚重返罗马，两枚遇见真爱 💕',
                color: 'pink'
            },
            {
                time: '17:30',
                location: '西班牙阶梯',
                image: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?auto=format&fit=crop&q=80&w=800',
                content: '走累了，在阶梯上坐着吃个 Gelato 🍦，看夕阳下的罗马，这就是生活呀～',
            }
        ]
    },
    {
        id: '5',
        title: '卢浮宫的午后光影',
        location: 'Louvre Museum, Paris 🇫🇷',
        author: 'Art Lover',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
        date: '2026.02.14',
        intro: '贝聿铭的金字塔在阳光下闪闪发光。虽然没能挤进去看蒙娜丽莎的正面，但维纳斯的背影也足够迷人。',
        cover: 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?auto=format&fit=crop&q=80&w=800',
        likes: 520,
        timeline: [
            {
                time: '13:00',
                location: '卢浮宫金字塔',
                image: 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?auto=format&fit=crop&q=80&w=800',
                content: '现代与古典的完美融合。',
                ai_tip: '玻璃金字塔由603块菱形玻璃和70块三角形玻璃拼装而成。',
                color: 'blue'
            },
            {
                time: '14:00',
                location: '萨莫色雷斯的胜利女神',
                image: 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?auto=format&fit=crop&q=80&w=800',
                content: '站在楼梯尽头，仿佛真的能感觉到风吹动她的衣摆。',
                ai_tip: '这尊雕像原本是站在船头上的，为了纪念一场海战的胜利。'
            },
            {
                time: '15:00',
                location: '蒙娜丽莎',
                image: 'https://images.unsplash.com/photo-1599940824399-b87987ced72a?auto=format&fit=crop&q=80&w=800',
                content: '人太多了，只能远远看一眼。比想象中小，但那个微笑真的很神秘。',
            },
            {
                time: '16:00',
                location: '米洛的维纳斯',
                image: 'https://images.unsplash.com/photo-1544211186-0610f446152a?auto=format&fit=crop&q=80&w=800',
                content: '断臂维纳斯，黄金比例的完美身材。',
                ai_tip: '她的手臂到底是什么姿势，至今仍是艺术史上的未解之谜。'
            },
            {
                time: '17:30',
                location: '拿破仑三世套房',
                image: 'https://images.unsplash.com/photo-1605559911160-a60e261f01c0?auto=format&fit=crop&q=80&w=800',
                content: '极尽奢华！巨大的水晶吊灯，红色的天鹅绒，完全是凡尔赛宫的感觉。',
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
