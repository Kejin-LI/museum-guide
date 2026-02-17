import React, { useEffect, useState } from 'react';
import { ArrowLeft, Heart, Share2, MapPin, Sparkles, Edit3, Save, Trash2, Globe, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ArtisticBackground from '../components/ArtisticBackground';
import { travelogueService, type TravelogueItem } from '../services/travelogue';

const TravelogueDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TravelogueItem | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(0);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<TravelogueItem | null>(null);

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
                  setEditData(JSON.parse(JSON.stringify(item))); // Deep copy for editing
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
          alert("请先登录");
          return;
      }
      if (!data) return;

      const likedPosts = JSON.parse(localStorage.getItem(`liked_posts_${uid}`) || '[]');
      let newLikedPosts;
      let newLikesCount;

      if (isLiked) {
          newLikedPosts = likedPosts.filter((p: string) => p !== id);
          newLikesCount = currentLikes - 1;
      } else {
          newLikedPosts = [...likedPosts, id];
          newLikesCount = currentLikes + 1;
      }

      setIsLiked(!isLiked);
      setCurrentLikes(newLikesCount);
      localStorage.setItem(`liked_posts_${uid}`, JSON.stringify(newLikedPosts));
      
      // We don't update service for likes in this MVP view, but we could.
  };

  const handleShare = () => {
     // ... (keep existing share logic)
     if (navigator.share) {
          navigator.share({
              title: data?.title,
              text: data?.intro,
              url: window.location.href,
          }).catch(console.error);
      } else {
          navigator.clipboard.writeText(window.location.href);
          alert('链接已复制到剪贴板');
      }
  };

  const handleSave = async () => {
      if (!editData) return;
      await travelogueService.update(editData);
      setData(editData);
      setIsEditing(false);
      alert("保存成功");
  };

  const handlePublishToggle = async () => {
      if (!data || !id) return;
      const newStatus = !data.is_public;
      await travelogueService.publish(id, newStatus);
      setData({ ...data, is_public: newStatus });
      setEditData(prev => prev ? ({ ...prev, is_public: newStatus }) : null);
      alert(newStatus ? "已发布到社区" : "已设为私密");
  };

  const handleDeleteItem = (index: number) => {
      if (!editData) return;
      const newTimeline = [...editData.timeline];
      newTimeline.splice(index, 1);
      setEditData({ ...editData, timeline: newTimeline });
  };

  if (!data) {
      return <div className="flex justify-center items-center h-screen bg-transparent">加载中...</div>;
  }

  // Check if current user is author
  // const isAuthor = uid && (data.uid === uid || !data.uid); // For demo, if no uid on item, assume legacy/local item is ownable? 
  // Actually, for "My Travelogues" derived from localstorage without uid, it's fine. 
  // But strict check: uid === data.uid. 
  // Let's allow if data.uid is missing (local) OR matches.
  const canEdit = uid && (data.uid === uid || (!data.uid && true)); 

  return (
    <div className="flex flex-col h-screen w-full mx-auto bg-transparent text-stone-800 relative overflow-hidden shadow-2xl">
      <ArtisticBackground mode="full" opacity={0.34} />
      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        {/* Header Image & Nav */}
      <div className="relative h-64 flex-shrink-0">
        <img 
          src={isEditing ? editData?.cover : data.cover} 
          alt={data.location} 
          className="w-full h-full object-cover rounded-b-[2rem] shadow-md"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent rounded-b-[2rem]"></div>
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-stone-600 shadow-sm active:scale-95 transition-transform"
            >
            <ArrowLeft size={20} />
            </button>

            {canEdit && (
                <div className="flex space-x-2">
                    {isEditing ? (
                        <button 
                            onClick={handleSave}
                            className="px-4 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform font-bold text-sm"
                        >
                            <Save size={16} className="mr-1" /> 保存
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={handlePublishToggle}
                                className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform ${data.is_public ? 'bg-green-500 text-white' : 'bg-white/90 text-stone-600'}`}
                            >
                                {data.is_public ? <Globe size={18} /> : <Lock size={18} />}
                            </button>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-stone-600 shadow-sm active:scale-95 transition-transform"
                            >
                                <Edit3 size={18} />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 px-5 -mt-8 relative z-10 pb-20 max-w-3xl mx-auto w-full">
        
        {/* Title Card */}
        <div className="bg-white p-5 rounded-3xl shadow-lg mb-8 relative border-2 border-orange-50">
           {/* Decorative Tape */}
           <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-orange-200/80 rotate-1 shadow-sm"></div>

           {isEditing ? (
               <input 
                    type="text"
                    value={editData?.title}
                    onChange={(e) => setEditData(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                    className="w-full text-xl font-bold text-stone-800 mb-3 font-serif text-center border-b border-stone-200 focus:border-amber-500 outline-none bg-transparent"
               />
           ) : (
                <h1 className="text-xl font-bold text-stone-800 mb-3 font-serif leading-relaxed text-center mt-2">
                    {data.title}
                </h1>
           )}
           
           <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1 rounded-full">
                <img src={data.avatar} className="w-6 h-6 rounded-full border border-white" alt="Avatar"/>
                <span className="text-xs font-bold text-stone-600">{data.author}</span>
              </div>
              <span className="text-xs text-stone-400">{data.date}</span>
           </div>

           {isEditing ? (
               <textarea 
                    value={editData?.intro}
                    onChange={(e) => setEditData(prev => prev ? ({ ...prev, intro: e.target.value }) : null)}
                    className="w-full text-sm text-stone-600 leading-relaxed text-center border p-2 rounded-lg focus:border-amber-500 outline-none min-h-[80px]"
               />
           ) : (
               <p className="text-sm text-stone-600 leading-relaxed text-center">
                 {data.intro}
               </p>
           )}
        </div>

        {/* Timeline */}
        <div className="relative pl-4 space-y-8">
           {/* Vertical Line */}
           <div className="absolute left-[27px] top-2 bottom-0 w-0.5 bg-orange-200 border-l-2 border-dashed border-orange-300"></div>

           {(isEditing ? editData : data)?.timeline.map((item: any, index: number) => (
               <div key={index} className="relative pl-8 group">
                  <div className="absolute left-0 top-0 w-14 h-14 bg-white border-4 border-orange-100 rounded-full flex items-center justify-center shadow-sm z-10">
                     <span className="text-xs font-bold text-orange-400 font-mono">{item.time}</span>
                  </div>
                  
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 ml-4 relative">
                      {isEditing && (
                          <button 
                            onClick={() => handleDeleteItem(index)}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md z-20"
                          >
                              <Trash2 size={12} />
                          </button>
                      )}

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
                      
                      {isEditing ? (
                          <textarea 
                                value={item.content}
                                onChange={(e) => {
                                    if (!editData) return;
                                    const newTimeline = [...editData.timeline];
                                    newTimeline[index] = { ...newTimeline[index], content: e.target.value };
                                    setEditData({ ...editData, timeline: newTimeline });
                                }}
                                className="w-full text-sm text-stone-700 border p-2 rounded-lg focus:border-amber-500 outline-none"
                          />
                      ) : (
                          <p className="text-sm text-stone-700">
                              {item.content}
                          </p>
                      )}
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
