import React from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, MapPin, Star, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TravelogueDetail: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-[#FFF9F5] text-stone-800 relative overflow-hidden shadow-2xl">
      <div className="flex-1 overflow-y-auto">
        {/* Header Image & Nav */}
      <div className="relative h-64 flex-shrink-0">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/640px-Colosseo_2020.jpg" 
          alt="Rome" 
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
             罗马假日：<br/>永恒之城的漫步 🇮🇹
           </h1>
           
           <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1 rounded-full">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=50&auto=format&fit=crop" className="w-6 h-6 rounded-full border border-white" alt="Avatar"/>
                <span className="text-xs font-bold text-stone-600">Alice Wang</span>
              </div>
              <span className="text-xs text-stone-400">2023.10.05</span>
           </div>

           <p className="text-sm text-stone-600 leading-relaxed text-center">
             在罗马的每一块石头都仿佛在诉说着历史。这次旅行虽然只有短短三天，但AI导览带我发现了好多不为人知的小秘密！✨
           </p>
        </div>

        {/* Timeline */}
        <div className="relative pl-4 space-y-8">
           {/* Vertical Line */}
           <div className="absolute left-[27px] top-2 bottom-0 w-0.5 bg-orange-200 border-l-2 border-dashed border-orange-300"></div>

           {/* Timeline Item 1 */}
           <div className="relative pl-8">
              <div className="absolute left-0 top-0 w-14 h-14 bg-white border-4 border-orange-100 rounded-full flex items-center justify-center shadow-sm z-10">
                 <span className="text-xs font-bold text-orange-400 font-mono">09:30</span>
              </div>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 ml-4 relative">
                  <div className="flex items-center space-x-1 text-orange-500 mb-2">
                      <MapPin size={14} fill="currentColor" className="text-orange-200" />
                      <span className="text-sm font-bold">古罗马斗兽场</span>
                  </div>
                  
                  <div className="rounded-xl overflow-hidden mb-3 rotate-1 border-4 border-white shadow-md">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/640px-Colosseo_2020.jpg" alt="Colosseum" className="w-full h-40 object-cover" />
                  </div>

                  <div className="bg-blue-50 p-3 rounded-xl mb-2 relative">
                      <div className="absolute -top-2 left-4 w-4 h-4 bg-blue-50 rotate-45"></div>
                      <div className="flex items-start space-x-2">
                          <Sparkles size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-stone-600 leading-relaxed">
                             <span className="font-bold text-blue-500">AI 趣闻：</span> 
                             原来斗兽场不仅可以看角斗，在公元80年还曾被灌满水，用来模拟海战表演！太不可思议了 🌊
                          </p>
                      </div>
                  </div>
                  
                  <p className="text-sm text-stone-700">
                      人真的超级多！幸好提前预约了。站在看台上想象当年的场景，真的会被震撼到。
                  </p>
              </div>
           </div>

           {/* Timeline Item 2 */}
           <div className="relative pl-8">
              <div className="absolute left-0 top-0 w-14 h-14 bg-white border-4 border-orange-100 rounded-full flex items-center justify-center shadow-sm z-10">
                 <span className="text-xs font-bold text-orange-400 font-mono">14:00</span>
              </div>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 ml-4 relative">
                  <div className="flex items-center space-x-1 text-orange-500 mb-2">
                      <MapPin size={14} fill="currentColor" className="text-orange-200" />
                      <span className="text-sm font-bold">特莱维喷泉</span>
                  </div>
                  
                  <div className="rounded-xl overflow-hidden mb-3 -rotate-1 border-4 border-white shadow-md">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg/640px-Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg" alt="Fountain" className="w-full h-40 object-cover" />
                  </div>

                  <div className="bg-pink-50 p-3 rounded-xl mb-2 relative">
                      <div className="absolute -top-2 left-4 w-4 h-4 bg-pink-50 rotate-45"></div>
                      <div className="flex items-start space-x-2">
                          <Star size={16} className="text-pink-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-stone-600 leading-relaxed">
                             <span className="font-bold text-pink-500">许愿贴士：</span> 
                             背对喷泉，右手拿硬币从左肩上方抛入水中。一枚重返罗马，两枚遇见真爱 💕
                          </p>
                      </div>
                  </div>
                  
                  <p className="text-sm text-stone-700">
                      许愿的人把池子围得水泄不通，好不容易才挤进去抛了硬币！希望愿望成真 🙏
                  </p>
              </div>
           </div>

           {/* Timeline Item 3 */}
           <div className="relative pl-8">
              <div className="absolute left-0 top-0 w-14 h-14 bg-white border-4 border-orange-100 rounded-full flex items-center justify-center shadow-sm z-10">
                 <span className="text-xs font-bold text-orange-400 font-mono">17:30</span>
              </div>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 ml-4 relative">
                  <div className="flex items-center space-x-1 text-orange-500 mb-2">
                      <MapPin size={14} fill="currentColor" className="text-orange-200" />
                      <span className="text-sm font-bold">西班牙阶梯</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Rome_Spanish_Steps_May_2011.jpg/640px-Rome_Spanish_Steps_May_2011.jpg" alt="Steps" className="w-full h-24 object-cover rounded-lg rotate-2 border-2 border-white shadow-sm" />
                     <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Gelato_in_Rome.jpg/640px-Gelato_in_Rome.jpg" alt="Gelato" className="w-full h-24 object-cover rounded-lg -rotate-2 border-2 border-white shadow-sm" />
                  </div>
                  
                  <p className="text-sm text-stone-700">
                      走累了，在阶梯上坐着吃个 Gelato 🍦，看夕阳下的罗马，这就是生活呀～
                  </p>
              </div>
           </div>

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
                 <span className="text-[10px]">342</span>
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
