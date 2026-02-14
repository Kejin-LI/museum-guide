import React, { useEffect, useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, MapPin, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ArtisticBackground from '../components/ArtisticBackground';
import { travelogueService, type TravelogueItem } from '../services/travelogue';

const TravelogueDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TravelogueItem | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(0);

  // Load User to check if already liked (Mock: using localStorage)
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
      const userStr = localStorage.getItem('museum_user');
      if (userStr) {
          try {
              const user = JSON.parse(userStr);
              setUid(user.id || user.uid);
          } catch(e) { console.error(e); }
      }
  }, []);

  useEffect(() => {
      const loadData = async () => {
          if (id) {
              const item = await travelogueService.getById(id);
              if (item) {
                  setData(item);
                  setCurrentLikes(item.likes);
                  
                  // Check if liked in localStorage mock
                  if (uid) {
                      const likedPosts = JSON.parse(localStorage.getItem(`liked_posts_${uid}`) || '[]');
                      setIsLiked(likedPosts.includes(id));
                  }
              }
          }
      };
      loadData();
  }, [id, uid]);

  const handleLike = () => {
      if (!uid) {
          // If not logged in, just toggle visual state for demo
          // In real app, redirect to auth or show toast
          alert("请先登录");
          return;
      }

      if (!data) return;

      const likedPosts = JSON.parse(localStorage.getItem(`liked_posts_${uid}`) || '[]');
      let newLikedPosts;
      let newLikesCount;

      if (isLiked) {
          // Unlike
          newLikedPosts = likedPosts.filter((p: string) => p !== id);
          newLikesCount = currentLikes - 1;
      } else {
          // Like
          newLikedPosts = [...likedPosts, id];
          newLikesCount = currentLikes + 1;
      }

      // Update State
      setIsLiked(!isLiked);
      setCurrentLikes(newLikesCount);

      // Persist
      localStorage.setItem(`liked_posts_${uid}`, JSON.stringify(newLikedPosts));
      
      // Update global mock data (optional, for consistency if navigating back)
      // In real app, this would be an API call
      data.likes = newLikesCount; 
  };

  const handleShare = () => {
      if (navigator.share) {
          navigator.share({
              title: data?.title,
              text: data?.intro,
              url: window.location.href,
          }).catch(console.error);
      } else {
          // Fallback
          navigator.clipboard.writeText(window.location.href);
          alert('链接已复制到剪贴板');
      }
  };

  if (!data) {
      return <div className="flex justify-center items-center h-screen bg-[#FFF9F5]">加载中...</div>;
  }

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

      {/* Bottom Action Bar - Simplified for MVP */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-6 py-3 flex items-center justify-between z-20 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
         {/* Comment Input Removed for MVP */}
         <div className="flex-1"></div>

         <div className="flex items-center space-x-8 text-stone-500">
             <button 
                onClick={handleLike}
                className="flex flex-col items-center space-y-0.5 active:scale-90 transition-transform"
            >
                 <Heart 
                    size={24} 
                    className={isLiked ? "text-rose-500" : "text-stone-400"} 
                    fill={isLiked ? "#f43f5e" : "none"} 
                />
                 <span className={`text-[10px] ${isLiked ? "text-rose-500 font-bold" : ""}`}>
                    {currentLikes}
                 </span>
             </button>
             
             {/* Comments Button Removed for MVP */}

             <button 
                onClick={handleShare}
                className="flex flex-col items-center space-y-0.5 active:scale-90 transition-transform"
            >
                 <Share2 size={24} className="text-stone-400" />
                 <span className="text-[10px]">分享</span>
             </button>
         </div>
      </div>
    </div>
  );
};

export default TravelogueDetail;
