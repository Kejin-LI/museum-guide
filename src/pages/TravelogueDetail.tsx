import React, { useEffect, useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, MapPin, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ArtisticBackground from '../components/ArtisticBackground';

// Mock Data for different travelogues
const TRAVELOGUE_DATA: Record<string, any> = {
    '1': {
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
    '2': {
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
    'default': {
        id: '0',
        title: '罗马假日：永恒之城的漫步 🇮🇹',
        location: 'Rome, Italy',
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
                ai_tip: ''
            }
        ]
    }
};

const TravelogueDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(TRAVELOGUE_DATA['default']);

  useEffect(() => {
      if (id && TRAVELOGUE_DATA[id]) {
          setData(TRAVELOGUE_DATA[id]);
      }
  }, [id]);

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-[#FFF9F5] text-stone-800 relative overflow-hidden shadow-2xl">
      <ArtisticBackground />
      <div className="flex-1 overflow-y-auto relative z-10">
        {/* Header Image & Nav */}
      <div className="relative h-64 flex-shrink-0">
        <img 
          src={data.cover} 
          alt={data.location} 
          className="w-full h-full object-cover rounded-b-[2rem] shadow-md"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent rounded-b-[2rem]"></div>
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-stone-600 shadow-sm active:scale-95 transition-transform z-10"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 px-5 -mt-8 relative z-10 pb-20">
        
        {/* Title Card */}
        <div className="bg-white p-5 rounded-3xl shadow-lg mb-8 relative border-2 border-orange-50">
           {/* Decorative Tape */}
           <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-orange-200/80 rotate-1 shadow-sm"></div>

           <h1 className="text-xl font-bold text-stone-800 mb-3 font-serif leading-relaxed text-center mt-2">
             {data.title}
           </h1>
           
           <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1 rounded-full">
                <img src={data.avatar} className="w-6 h-6 rounded-full border border-white" alt="Avatar"/>
                <span className="text-xs font-bold text-stone-600">{data.author}</span>
              </div>
              <span className="text-xs text-stone-400">{data.date}</span>
           </div>

           <p className="text-sm text-stone-600 leading-relaxed text-center">
             {data.intro}
           </p>
        </div>

        {/* Timeline */}
        <div className="relative pl-4 space-y-8">
           {/* Vertical Line */}
           <div className="absolute left-[27px] top-2 bottom-0 w-0.5 bg-orange-200 border-l-2 border-dashed border-orange-300"></div>

           {data.timeline.map((item: any, index: number) => (
               <div key={index} className="relative pl-8">
                  <div className="absolute left-0 top-0 w-14 h-14 bg-white border-4 border-orange-100 rounded-full flex items-center justify-center shadow-sm z-10">
                     <span className="text-xs font-bold text-orange-400 font-mono">{item.time}</span>
                  </div>
                  
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 ml-4 relative">
                      <div className="flex items-center space-x-1 text-orange-500 mb-2">
                          <MapPin size={14} fill="currentColor" className="text-orange-200" />
                          <span className="text-sm font-bold">{item.location}</span>
                      </div>
                      
                      <div className="rounded-xl overflow-hidden mb-3 rotate-1 border-4 border-white shadow-md">
                         <img src={item.image} alt={item.location} className="w-full h-40 object-cover" />
                      </div>

                      {item.ai_tip && (
                          <div className={`bg-${item.color || 'amber'}-50 p-3 rounded-xl mb-2 relative`}>
                              <div className={`absolute -top-2 left-4 w-4 h-4 bg-${item.color || 'amber'}-50 rotate-45`}></div>
                              <div className="flex items-start space-x-2">
                                  <Sparkles size={16} className={`text-${item.color || 'amber'}-400 mt-0.5 flex-shrink-0`} />
                                  <p className="text-xs text-stone-600 leading-relaxed">
                                     <span className={`font-bold text-${item.color || 'amber'}-500`}>AI 趣闻：</span> 
                                     {item.ai_tip}
                                  </p>
                              </div>
                          </div>
                      )}
                      
                      <p className="text-sm text-stone-700">
                          {item.content}
                      </p>
                  </div>
               </div>
           ))}

           {/* End Dot */}
           <div className="relative pl-8 pb-8">
              <div className="absolute left-[22px] top-0 w-3 h-3 bg-orange-300 rounded-full border-2 border-white shadow-sm z-10"></div>
              <p className="text-xs text-stone-400 italic ml-4 pt-1">未完待续...</p>
           </div>
        </div>

      </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-6 py-3 flex items-center justify-between z-20 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
         <div className="flex items-center space-x-1 bg-stone-50 px-3 py-2 rounded-full border border-stone-100">
            <input type="text" placeholder="说点什么..." className="bg-transparent border-none outline-none text-sm w-32 text-stone-700 placeholder:text-stone-400" />
         </div>
         <div className="flex items-center space-x-6 text-stone-500">
             <button className="flex flex-col items-center space-y-0.5">
                 <Heart size={22} className="text-rose-400" fill="#fb7185" />
                 <span className="text-[10px]">{data.likes}</span>
             </button>
             <button className="flex flex-col items-center space-y-0.5">
                 <MessageCircle size={22} />
                 <span className="text-[10px]">56</span>
             </button>
             <button className="flex flex-col items-center space-y-0.5">
                 <Share2 size={22} />
                 <span className="text-[10px]">分享</span>
             </button>
         </div>
      </div>
    </div>
  );
};

export default TravelogueDetail;
