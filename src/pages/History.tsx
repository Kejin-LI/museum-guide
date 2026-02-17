import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Trash2, MessageSquare, ArrowLeft } from 'lucide-react';

interface ChatMessage {
    id: string;
    type: 'text' | 'image' | 'card';
    content: string | string[];
    sender: 'user' | 'agent';
    timestamp: number;
}

interface ChatSession {
    id: string;
    locationId: string;
    locationName: string;
    startTime: number;
    lastMessageTime: number;
    messages: ChatMessage[];
    persona: 'expert' | 'humorous' | 'kids';
    preview: string;
}

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Load Sessions
  useEffect(() => {
      try {
          const saved = localStorage.getItem('museum_guide_sessions');
          if (saved) {
              setSessions(JSON.parse(saved));
          }
      } catch (e) {
          console.error("Failed to load sessions", e);
      }
  }, []);

  const handleSwitchSession = (session: ChatSession) => {
      // Navigate to guide page with the session ID
      navigate('/guide', { state: { sessionId: session.id } });
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      const newSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(newSessions);
      localStorage.setItem('museum_guide_sessions', JSON.stringify(newSessions));
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50 text-stone-800 w-full shadow-xl">
      {/* Header */}
      <header className="px-6 py-4 flex items-center bg-white border-b border-stone-100 sticky top-0 z-10">
          <button 
              onClick={() => navigate('/profile', { replace: true })} 
              className="p-2 -ml-2 text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
          >
              <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold font-serif text-stone-900 ml-2 flex items-center">
              <History size={20} className="mr-2 text-amber-500" />
              历史寻迹
          </h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
          <div className="w-full max-w-3xl flex-1 flex flex-col">
          {sessions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
                  <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mb-4 text-stone-400">
                      <MessageSquare size={32} />
                  </div>
                  <p className="text-sm">暂无历史记录</p>
                  <button 
                      onClick={() => navigate('/guide')}
                      className="mt-6 px-6 py-2 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
                  >
                      去开启一段新旅程
                  </button>
              </div>
          ) : (
              <div className="space-y-3">
              {sessions.map(session => (
                  <div 
                      key={session.id}
                      onClick={() => handleSwitchSession(session)}
                      className="p-4 bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group relative active:scale-[0.98]"
                  >
                      <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-stone-800">{session.locationName}</h4>
                          <span className="text-xs text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">
                              {new Date(session.lastMessageTime).toLocaleDateString()} {new Date(session.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                      </div>
                      
                      <div className="flex items-center text-xs text-stone-500 mb-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] mr-2 ${
                              session.persona === 'humorous' ? 'bg-amber-100 text-amber-700' :
                              session.persona === 'kids' ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                          }`}>
                              {session.persona === 'humorous' ? '幽默风趣' : session.persona === 'kids' ? '亲子模式' : '专业深度'}
                          </span>
                      </div>

                      <p className="text-sm text-stone-600 line-clamp-2 pr-8">
                          {session.preview || '暂无内容'}
                      </p>
                      
                      <button 
                          onClick={(e) => handleDeleteSession(e, session.id)}
                          className="absolute bottom-4 right-4 p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                          <Trash2 size={16} />
                      </button>
                  </div>
              ))}
                </div>
            )}
            </div>
      </div>
    </div>
  );
};

export default HistoryPage;
