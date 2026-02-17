import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, Mic, Play, X, Plus, MessageCircle, Send, Map, ChevronDown, Compass, MapPin, Search, Loader2, Globe, Volume2, StopCircle, Keyboard, History, Trash2, MessageSquarePlus, Lock, BookOpen, MoreHorizontal } from 'lucide-react';
import L from 'leaflet';

import { chatService, type ChatSession, type ChatMessage } from '../services/chat';
import { TravelogueGenerator } from '../components/TravelogueGenerator';
import { travelogueService, type TravelogueItem } from '../services/travelogue';
import { guideAgentService } from '../services/guideAgent';
import { geoService } from '../services/geo';

// Create a custom pulsing dot icon using DivIcon
const createPulsingDot = (color: string) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-4 h-4 ${color} rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8] // Center it
    });
};

const UserIcon = createPulsingDot('bg-blue-500');

const PLACEHOLDER_PALETTES = [
    { bg1: '#0f172a', bg2: '#1f2937', accent: '#d97706' },
    { bg1: '#111827', bg2: '#0f766e', accent: '#f59e0b' },
    { bg1: '#1f2937', bg2: '#312e81', accent: '#f97316' },
    { bg1: '#0b1324', bg2: '#3b1d2a', accent: '#f59e0b' },
];

const hashString = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = input.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
};

const svgToDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const getCoverPlaceholder = (title: string) => {
    const safeTitle = (title || 'Museum').trim();
    const hash = hashString(safeTitle);
    const palette = PLACEHOLDER_PALETTES[Math.abs(hash) % PLACEHOLDER_PALETTES.length];
    const subtitle = 'Odyssey · 寻迹之旅';
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="720" viewBox="0 0 1080 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.bg1}"/>
      <stop offset="1" stop-color="${palette.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="720" fill="url(#g)"/>
  <circle cx="900" cy="160" r="180" fill="${palette.accent}" opacity="0.12"/>
  <circle cx="160" cy="620" r="220" fill="${palette.accent}" opacity="0.10"/>
  <rect x="72" y="520" width="936" height="136" rx="22" fill="#0b1220" opacity="0.55"/>
  <text x="108" y="585" fill="#ffffff" font-size="54" font-family="ui-serif, Georgia, serif" font-weight="700">${safeTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
  <text x="108" y="630" fill="#e5e7eb" font-size="26" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" opacity="0.9">${subtitle}</text>
</svg>`;
    return svgToDataUri(svg);
};

const isInChinaCoord = (lat: number, lng: number) => lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135;

const getTileUrls = (inChina: boolean) => {
    if (inChina) {
        return [
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        ];
    }
    return [
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    ];
};

// Helper to get a deterministic mock image based on string hash
const getMockImageForLocation = (id: string, name: string): string => {
    const combined = `${id}:${name}`;
    return getCoverPlaceholder(combined);
};

// Image helper component with fallback
const ImageWithFallback = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
    // Use a ref to track if we've already fallen back to avoid infinite loops
    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
        setImgSrc(src);
    }, [src]);

    return (
        <img 
            src={imgSrc} 
            alt={alt} 
            className={className} 
            onError={() => {
                // If the primary image (AI generated) fails or times out, fallback to a deterministic nice Unsplash image
                // We use the alt text (name) to ensure consistency (same place always gets same fallback)
                if (imgSrc !== getMockImageForLocation('fallback', alt)) {
                    setImgSrc(getMockImageForLocation('fallback', alt));
                }
            }}
            loading="lazy"
        />
    );
};

// Types
type InteractionStep = 'locating' | 'agent-chat' | 'manual-selection';

interface LocationContext {
    id: string;
    name: string;
    area: string;
    weather: string;
    coverImage: string;
    recommendations: string[];
    // Coordinates for Leaflet
    coordinates: [number, number]; // [lat, lng] - Leaflet uses [lat, lng], Mapbox used [lng, lat]
    floorPlanUrl?: string; 
    floorPlanBounds?: [[number, number], [number, number]];
}

const MOCK_LOCATIONS: Record<string, LocationContext> = {
    'louvre': {
        id: 'louvre',
        name: '卢浮宫',
        area: '德农馆 1F · 意大利绘画厅',
        weather: '晴 24°C',
        coverImage: getMockImageForLocation('louvre', '卢浮宫'),
        recommendations: ['带我去看蒙娜丽莎', '附近的洗手间', '达芬奇还有哪些画？'],
        coordinates: [48.8606, 2.3376], // Paris
    },
    'gugong': {
        id: 'gugong',
        name: '故宫博物院',
        area: '太和殿广场',
        weather: '多云 20°C',
        coverImage: getMockImageForLocation('gugong', '故宫博物院'),
        recommendations: ['太和殿的历史', '哪里可以买文创？', '延禧宫怎么走'],
        coordinates: [39.9163, 116.3972], // Beijing
    },
    'national_museum': {
        id: 'national_museum',
        name: '中国国家博物馆',
        area: '古代中国展厅',
        weather: '多云 21°C',
        coverImage: getMockImageForLocation('national_museum', '中国国家博物馆'),
        recommendations: ['后母戊鼎在哪里', '玉龙展示柜', '古代中国基本陈列'],
        coordinates: [39.9040, 116.3974], // Beijing (East of Tiananmen Square)
    },
    'orsay': {
        id: 'orsay',
        name: '奥赛博物馆',
        area: '印象派画廊',
        weather: '晴 25°C',
        coverImage: getMockImageForLocation('orsay', '奥赛博物馆'),
        recommendations: ['梵高的自画像', '莫奈的睡莲', '罗丹的地狱之门'],
        coordinates: [48.8599, 2.3265], // Paris (Near Louvre)
    },
    'british_museum': {
        id: 'british_museum',
        name: '大英博物馆',
        area: '大中庭',
        weather: '多云 15°C',
        coverImage: getMockImageForLocation('british_museum', '大英博物馆'),
        recommendations: ['罗塞塔石碑在哪里', '看法老木乃伊', '女史箴图展出了吗？'],
        coordinates: [51.5194, -0.1270],
    }
};

// Helper: Generate Context-Aware Recommendations
const generateRecommendations = (name: string, isChinese: boolean = true) => {
    // Clean up name (remove address parts after comma)
    let cleanName = name.split(/[,，]/)[0];
    
    // Truncate if too long (longer for English to avoid cutting "The British Museum" to "The Brit")
    const maxLength = isChinese ? 8 : 15;
    if (cleanName.length > maxLength) {
        cleanName = cleanName.substring(0, maxLength - 1) + '...';
    }

    if (isChinese) {
        return [
            `介绍一下${cleanName}`,
            `${cleanName}有哪些必看？`,
            `附近的洗手间`,
            `${cleanName}的历史故事`
        ];
    } else {
        return [
            `Intro to ${cleanName}`,
            `Must-sees at ${cleanName}`,
            `Restrooms nearby`,
            `History of ${cleanName}`
        ];
    }
};

// Helper: Calculate Distance (Haversine Formula)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2-lat1);
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}



// Map Controller Component to handle programmatic updates
const MapUpdater: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, {
            duration: 1.5
        });
    }, [center, zoom, map]);
    return null;
};

let nominatimDisabledUntil = 0;

const fetchNearbyMuseums = async (lat: number, lon: number) => {
    const now = Date.now();
    if (now < nominatimDisabledUntil) return [];
    try {
        const data = await geoService.searchNearbyMuseums(lat, lon, 20);
        if (Array.isArray(data) && data.length > 0) {
            return data.map((item: any) => {
                const name = item.name || (item.display_name ? String(item.display_name).split(',')[0] : '博物馆');
                const latV = parseFloat(item.lat);
                const lonV = parseFloat(item.lon);
                return {
                    id: `osm-${item.place_id || `${latV},${lonV}`}`,
                    name,
                    area: item.display_name ? String(item.display_name).split(',').slice(1, 3).join(',').trim() || item.display_name : '附近',
                    weather: '实时',
                    coverImage: getMockImageForLocation(`osm-${item.place_id || `${latV},${lonV}`}`, name),
                    recommendations: generateRecommendations(name, /[\u4e00-\u9fa5]/.test(name)),
                    coordinates: [latV, lonV] as [number, number],
                    distance: getDistanceFromLatLonInKm(lat, lon, latV, lonV),
                    floorPlanUrl: undefined
                };
            });
        }
        return [];
    } catch (e) {
        nominatimDisabledUntil = Date.now() + 60 * 1000;
        return [];
    }
};

const Guide: React.FC = () => {
  // State
  const location = useLocation();
  const navigate = useNavigate();
  
  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<InteractionStep>('locating'); 
  const [isLocatingPending, setIsLocatingPending] = useState(true);
  const [locateNonce, setLocateNonce] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<LocationContext | null>(null);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [tileUrlIndex, setTileUrlIndex] = useState(0);
  const [tilesEnabled, setTilesEnabled] = useState(true);
  const tileErrorTsRef = useRef(0);
  const [userRealLocation, setUserRealLocation] = useState<[number, number] | null>(null);
  const [sortedLocations, setSortedLocations] = useState<Array<LocationContext & { distance: number }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<Array<LocationContext & { distance: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  const searchCacheRef = useRef(new window.Map<string, Array<LocationContext & { distance: number }>>());
  const stepRef = useRef<InteractionStep>(step);
  const isUserInteractingRef = useRef(false);
  const realMuseumsRef = useRef<Array<LocationContext & { distance: number }>>([]);
  const inChinaForTiles = Boolean(
      currentLocation?.coordinates && isInChinaCoord(currentLocation.coordinates[0], currentLocation.coordinates[1])
  );
  const tileUrls = getTileUrls(inChinaForTiles);
  const tileSubdomains = inChinaForTiles ? (['1', '2', '3', '4'] as any) : undefined;
  const tileAttribution = inChinaForTiles ? '' : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  useEffect(() => {
      setTileUrlIndex(0);
      setTilesEnabled(true);
  }, [tileUrls.length, tileUrls[0]]);

  const [guidePersona, setGuidePersona] = useState<'expert' | 'humorous' | 'kids'>('expert');
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [isChatHidden, setIsChatHidden] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Auth & Usage State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [guestUsageCount, setGuestUsageCount] = useState(0);

  // Load User & Usage on Mount
  useEffect(() => {
      // 1. User
      const userStr = localStorage.getItem('museum_user');
      if (userStr) {
          try {
              setCurrentUser(JSON.parse(userStr));
          } catch (e) {
              console.error("Failed to parse user", e);
          }
      }

      // 2. Guest Usage
      const usageStr = localStorage.getItem('guest_msg_count');
      if (usageStr) {
          setGuestUsageCount(parseInt(usageStr, 10) || 0);
      }
  }, []);

  // Audio State
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false); // Toggle between text input and voice hold-to-talk
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [cancelRecording, setCancelRecording] = useState(false); // Drag up to cancel state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [ttsVoices, setTtsVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Keep stepRef in sync
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (step === 'locating') {
      setShowPersonaSelector(false);
    }
  }, [step]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const load = () => setTtsVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  
  // --- Session Management ---

  // Load Sessions (Auth Aware)
  useEffect(() => {
      if (currentUser) {
          // Logged In: Fetch from Supabase
          chatService.getUserSessions(currentUser.id || currentUser.uid).then(fetched => {
              if (fetched && fetched.length > 0) {
                  setSessions(fetched);
              }
          });
      } else {
          // Guest: Do not load old sessions (per requirement)
          // Just start fresh or keep whatever is in memory (empty on refresh)
          setSessions([]);
      }
  }, [currentUser]);

  // Save Sessions (Auth Aware - only for logged in users)
  // We handle saving specific sessions in the auto-update effect below
  // This effect is mostly for bulk updates if needed, or we can remove it if we save incrementally.
  // For now, let's just NOT save to localStorage if logged in (since we use DB), 
  // and NOT save to localStorage if guest (per requirement).
  // So we REMOVE the localStorage persistence effect entirely.
  
  /* REMOVED:
  useEffect(() => {
      if (sessions.length > 0) {
          localStorage.setItem('museum_guide_sessions', JSON.stringify(sessions));
      }
  }, [sessions]); 
  */

  // Persist Current Session to Supabase when it updates
  useEffect(() => {
      if (currentUser && currentSessionId && sessions.length > 0) {
          const currentSession = sessions.find(s => s.id === currentSessionId);
          if (currentSession) {
              // Debounce could be good here, but for now direct save is fine for chat messages
              chatService.saveSession(currentSession, currentUser.id || currentUser.uid);
          }
      }
  }, [sessions, currentUser, currentSessionId]);

  // Auto-save current messages to session
  useEffect(() => {
      if (!currentSessionId || messages.length === 0) return;
      
      setSessions(prev => {
          const idx = prev.findIndex(s => s.id === currentSessionId);
          if (idx >= 0) {
              const updatedSession = { 
                  ...prev[idx], 
                  messages, 
                  lastMessageTime: Date.now(),
                  preview: typeof messages[messages.length - 1].content === 'string' 
                      ? (messages[messages.length - 1].content as string).substring(0, 30) 
                      : '[图片]'
              };
              
              const newSessions = [...prev];
              newSessions.splice(idx, 1);
              newSessions.unshift(updatedSession);
              return newSessions;
          } else {
              // Session ID exists but not in list? Create it.
              if (!currentLocation) return prev;
              
              const newSession: ChatSession = {
                  id: currentSessionId,
                  locationId: currentLocation.id,
                  locationName: currentLocation.name,
                  startTime: Date.now(),
                  lastMessageTime: Date.now(),
                  messages: messages,
                  persona: guidePersona,
                  preview: typeof messages[messages.length - 1].content === 'string' 
                      ? (messages[messages.length - 1].content as string).substring(0, 30) 
                      : '[图片]'
              };
              return [newSession, ...prev];
          }
      });
  }, [messages, currentSessionId]); // Trigger when messages or sessionId update

  const handleSwitchSession = (session: ChatSession) => {
      setCurrentSessionId(session.id);
      setMessages(session.messages);
      setGuidePersona(session.persona);
      
      // Restore Location
      let loc = MOCK_LOCATIONS[session.locationId];
      if (!loc) {
          // Try to find in filtered/sorted if available, or reconstruct
          loc = {
              id: session.locationId,
              name: session.locationName,
              area: '历史记录',
              weather: '未知',
              coverImage: getMockImageForLocation(session.locationId, session.locationName),
              recommendations: generateRecommendations(session.locationName, true),
              coordinates: [39.9042, 116.4074] // Fallback
          };
      }
      setCurrentLocation(loc);
      
      setStep('agent-chat');
      setShowHistory(false);
      setShowPersonaSelector(false);
      setIsChatHidden(false);
  };

  const handleNewSession = () => {
      setShowHistory(false);
      setStep('manual-selection'); // Go back to selection
      setCurrentSessionId(null);
      setMessages([]);
      setCurrentLocation(null);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      const newSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(newSessions);
      
      // Delete from DB if logged in
      if (currentUser) {
          chatService.deleteSession(sessionId);
      }
      
      if (currentSessionId === sessionId) {
          handleNewSession();
      }
  };

  // Handle routing from Profile
  useEffect(() => {
      if (location.state?.sessionId && sessions.length > 0) {
           const s = sessions.find(s => s.id === location.state.sessionId);
           if (s) {
               handleSwitchSession(s);
               // Clear state to avoid re-triggering
               navigate(location.pathname, { replace: true, state: {} });
           }
      } else if (location.state?.openHistory) {
          setShowHistory(true);
          navigate(location.pathname, { replace: true, state: {} });
      }
  }, [location.state, sessions]);

  // Audio Helper
  const speakText = (text: string, id: string) => {
    if ('speechSynthesis' in window) {
        if (playingMessageId === id) {
            window.speechSynthesis.cancel();
            setPlayingMessageId(null);
            return;
        }

        const normalizeForTTS = (raw: string) => {
          return String(raw || '')
            .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
            .replace(/\s+/g, ' ')
            .replace(/([，。！？；：])(\S)/g, '$1 $2')
            .trim();
        };

        const splitForTTS = (raw: string) => {
          const t = normalizeForTTS(raw);
          if (!t) return [];
          const out: string[] = [];
          let buf = '';
          for (const ch of t) {
            buf += ch;
            if (ch === '。' || ch === '！' || ch === '？' || ch === '；' || ch === '\n') {
              const s = buf.trim();
              if (s) out.push(s);
              buf = '';
            }
          }
          const tail = buf.trim();
          if (tail) out.push(tail);
          return out;
        };

        const voices = ttsVoices.length > 0 ? ttsVoices : window.speechSynthesis.getVoices();
        const isZhVoice = (v: SpeechSynthesisVoice) => /zh/i.test(v.lang) || /Chinese/i.test(v.lang);
        const scoreVoice = (v: SpeechSynthesisVoice) => {
          let s = 0;
          if (isZhVoice(v)) s += 50;
          if (/Ting-?Ting|Xiaoxiao|Xiaoyi|Mei-?Jia|Sin-?ji|Zhiyu|Google\s*普通话/i.test(v.name)) s += 30;
          if (/Siri|Premium|Enhanced|Neural/i.test(v.name)) s += 10;
          if (/female|woman/i.test(v.name)) s += 3;
          return s;
        };
        const preferredVoice = [...voices]
          .filter(isZhVoice)
          .sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || voices.find(isZhVoice) || voices[0];

        const baseRate = guidePersona === 'humorous' ? 1.06 : guidePersona === 'kids' ? 1.0 : 1.02;
        const basePitch = guidePersona === 'humorous' ? 1.05 : guidePersona === 'kids' ? 1.12 : 1.0;

        const parts = splitForTTS(text);
        if (parts.length === 0) return;

        window.speechSynthesis.cancel();
        setPlayingMessageId(id);

        let idx = 0;
        const speakNext = () => {
          if (idx >= parts.length) {
            setPlayingMessageId(null);
            return;
          }
          const u = new SpeechSynthesisUtterance(parts[idx++]);
          if (preferredVoice) {
            u.voice = preferredVoice;
            u.lang = preferredVoice.lang;
          } else {
            u.lang = 'zh-CN';
          }
          u.volume = 1;
          u.rate = baseRate;
          u.pitch = basePitch;
          u.onend = () => window.setTimeout(speakNext, 140);
          u.onerror = () => setPlayingMessageId(null);
          window.speechSynthesis.speak(u);
        };

        speakNext();
    }
  };

  // --- Voice Input Logic (Hold-to-Talk) ---
  const handleTouchStart = async () => {
    // Prevent default to avoid scrolling/selection issues on mobile
    // e.preventDefault(); // Sometimes this blocks click, handle carefully

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
            setIsRecording(false);
            setCancelRecording(false);
            
            // If canceled, do nothing
            if (cancelRecording) return;

            // Check if recording was too short (< 500ms)
            if (Date.now() - recordingStartTime < 500) {
                // Too short, maybe accidental tap
                return;
            }

            // Mock STT Result
            const mockTranscripts = [
                "请问这幅画是谁画的？",
                "这里的洗手间在哪里？",
                "给我讲讲这个展品的历史吧。",
                "蒙娜丽莎为什么在笑？"
            ];
            const randomText = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
            
            // Direct send
            handleSendMessage(randomText);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordingStartTime(Date.now());
        setCancelRecording(false);
    } catch (err) {
        console.error("Error accessing microphone:", err);
        // alert("无法访问麦克风");
    }
  };

  const handleTouchEnd = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!isRecording) return;
      
      // Calculate drag distance
      const touch = e.touches[0];
      const target = e.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      
      // If dragged up by more than 50px (negative Y relative to button top)
      if (touch.clientY < rect.top - 50) {
          setCancelRecording(true);
      } else {
          setCancelRecording(false);
      }
  };

  // Simulate Geolocation on Mount
  useEffect(() => {
      let watchId: number | null = null;
      let cancelled = false;
      const hotList = Object.values(MOCK_LOCATIONS).map((loc) => ({ ...loc, distance: 0 }));
      const storageKey = 'last_geo_v1';
      let settled = false;
      setIsLocatingPending(true);

      const persistLastLocation = (latitude: number, longitude: number) => {
          try {
              localStorage.setItem(storageKey, JSON.stringify({ lat: latitude, lng: longitude, ts: Date.now() }));
          } catch {}
      };

      const applyLocation = (latitude: number, longitude: number) => {
          setIsLocatingPending(false);
          setUserRealLocation([latitude, longitude]);
          persistLastLocation(latitude, longitude);

          const mockWithDistance = Object.values(MOCK_LOCATIONS).map(loc => ({
              ...loc,
              distance: getDistanceFromLatLonInKm(latitude, longitude, loc.coordinates[0], loc.coordinates[1])
          }));

          const mockNearby = mockWithDistance
              .slice()
              .sort((a, b) => a.distance - b.distance)
              .filter(loc => loc.distance < 50);

          const initialList = mockNearby.length > 0 ? mockNearby : hotList;
          setSortedLocations(initialList);
          if (!isUserInteractingRef.current) {
              setFilteredLocations(initialList);
          }

          if (initialList.length > 0 && initialList[0].distance < 2 && mockNearby.length > 0) {
              setCurrentLocation(initialList[0]);
              setStep('agent-chat');
              setShowPersonaSelector(true);
          } else {
              setStep('manual-selection');
          }

          fetchNearbyMuseums(latitude, longitude)
              .then((realMuseums) => {
                  if (cancelled) return;
                  realMuseumsRef.current = realMuseums;
                  const combinedNearby = [...realMuseums, ...mockWithDistance]
                      .sort((a, b) => a.distance - b.distance)
                      .filter(loc => loc.distance < 50);

                  const hasNearby = combinedNearby.length > 0;
                  const finalList = hasNearby ? combinedNearby : hotList;

                  setSortedLocations(finalList);
                  if (!isUserInteractingRef.current) {
                      setFilteredLocations(finalList);
                  }

                  if (stepRef.current === 'manual-selection' && !isUserInteractingRef.current) {
                      const closest = finalList[0];
                      if (hasNearby && closest && closest.distance < 2) {
                          setCurrentLocation(closest);
                          setShowMapSelector(false);
                          setShowPersonaSelector(true);
                          setStep('agent-chat');
                      }
                  }
              })
              .catch(() => {});
      };

      try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
              const parsed = JSON.parse(cached);
              const lat = Number(parsed?.lat);
              const lng = Number(parsed?.lng);
              const ts = Number(parsed?.ts);
              if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(ts) && Date.now() - ts < 24 * 60 * 60 * 1000) {
                  applyLocation(lat, lng);
              }
          }
      } catch {}

      const fastFallbackTimer = window.setTimeout(() => {
          if (cancelled || settled) return;
          if (stepRef.current === 'locating') {
              setStep('manual-selection');
              setSortedLocations(hotList);
              setFilteredLocations(hotList);
          }
          geoService.ipLocate().then((data) => {
              if (cancelled || settled) return;
              const c = data?.center;
              if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
                  settled = true;
                  applyLocation(c.lat, c.lng);
              }
          });
      }, 1200);

      // 1. Try to get real location
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              async (position) => {
                  settled = true;
                  window.clearTimeout(fastFallbackTimer);
                  const { latitude, longitude } = position.coords;
                  applyLocation(latitude, longitude);
              },
              (error) => {
                  window.clearTimeout(fastFallbackTimer);
                  setIsLocatingPending(false);
                  try {
                      console.warn('Geolocation denied or error:', { code: error?.code, message: error?.message });
                  } catch {
                      console.warn('Geolocation denied or error');
                  }
                  // Error handling: Do not guess location. Ask user to select manually.
                  setStep('manual-selection');
                  
                  setSortedLocations(hotList);
                  setFilteredLocations(hotList);

                  geoService.ipLocate().then((data) => {
                      if (cancelled || settled) return;
                      const c = data?.center;
                      if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
                          settled = true;
                          applyLocation(c.lat, c.lng);
                      }
                  });

                  // 2. Start Background Watching (Persistent Attempt)
                  console.log("Starting background location watch...");
                  watchId = navigator.geolocation.watchPosition(
                      (pos) => {
                          console.log("Background location acquired:", pos.coords);
                          const { latitude, longitude } = pos.coords;
                          setUserRealLocation([latitude, longitude]);

                          // Re-sort with new data
                          // Update distances for both Real (from ref) and Mock locations
                          const updatedReal = realMuseumsRef.current.map(loc => ({
                              ...loc,
                              distance: getDistanceFromLatLonInKm(latitude, longitude, loc.coordinates[0], loc.coordinates[1])
                          }));

                          const updatedMock = Object.values(MOCK_LOCATIONS).map(loc => ({
                              ...loc,
                              distance: getDistanceFromLatLonInKm(latitude, longitude, loc.coordinates[0], loc.coordinates[1])
                          }));
                          
                          const updatedNearby = [...updatedReal, ...updatedMock]
                              .sort((a, b) => a.distance - b.distance)
                              .filter(loc => loc.distance < 50);
                          const nextList = updatedNearby.length > 0 ? updatedNearby : hotList;
                          setSortedLocations(nextList);
                          
                          // IMPORTANT: NEVER touch filteredLocations in background geolocation updates!
                          // This was causing the search results to disappear because 'setFilteredLocations' was being called with the sorted list,
                          // overriding the API search results while the user was typing.
                          // We only want to update the *default* list (sortedLocations), not the *current view* (filteredLocations) if the user is searching.
                          
                          // Only update filtered if we are NOT searching and NOT interacting
                          if (!isUserInteractingRef.current) {
                              setFilteredLocations(nextList);
                          }
                          
                          // 3. Auto-switch ONLY if still in manual selection mode AND user hasn't started searching/interacting
                          if (stepRef.current === 'manual-selection' && !isUserInteractingRef.current) {
                              const closest = updatedNearby[0];
                              // Only auto-switch if confidence is high (distance < 2km)
                              if (closest && closest.distance < 2) {
                                  setCurrentLocation(closest);
                                  setShowMapSelector(false);
                                  setShowPersonaSelector(true); // Show selector on auto-switch too
                                  setStep('agent-chat');
                                  
                                  // We don't send the welcome message yet, wait for persona selection
                              }
                          }
                      },
                      (err) => console.warn("Background watch error:", err),
                      {
                          enableHighAccuracy: true, 
                          timeout: 20000,
                          maximumAge: 0
                      }
                  );
              },
              // Options for faster location (Initial attempt)
              {
                  enableHighAccuracy: false, 
                  timeout: 3500,
                  maximumAge: 10 * 60 * 1000
              }
          );
      } else {
          // Fallback if no geolocation support
          setIsLocatingPending(false);
          setStep('manual-selection');
          setSortedLocations(hotList);
          setFilteredLocations(hotList);
      }

      const giveUpTimer = window.setTimeout(() => {
          if (cancelled) return;
          if (!settled) {
              setIsLocatingPending(false);
          }
      }, 12000);

      return () => {
          cancelled = true;
          window.clearTimeout(fastFallbackTimer);
          window.clearTimeout(giveUpTimer);
          if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      };
  }, [locateNonce]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Init chat greeting when location changes
  useEffect(() => {
      // Only start chat if we are in chat mode AND persona selector is dismissed
      if (step === 'agent-chat' && currentLocation && !showPersonaSelector) {
          // If we already have messages (e.g. switched session), don't reset.
          // But handleSwitchSession sets messages. 
          // handleNewSession clears messages.
          
          // Generate new session ID if missing (i.e. started a new flow)
          if (!currentSessionId) {
             const newId = `session-${Date.now()}`;
             setCurrentSessionId(newId);
          
              let welcomeText = `欢迎来到${currentLocation.name}！🎉`;
              let subText = `检测到您目前位于【${currentLocation.area}】。需要我为您介绍这里的镇馆之宝吗？`;
    
              // Customize based on persona
              if (guidePersona === 'humorous') {
                  welcomeText = `哟！终于等到你啦，这里是${currentLocation.name}！😎`;
                  subText = `咱们现在在【${currentLocation.area}】，这里的宝贝可多了，想听点劲爆的八卦吗？`;
              } else if (guidePersona === 'kids') {
                  welcomeText = `小朋友你好呀！👋 这里是神奇的${currentLocation.name}！`;
                  subText = `我们现在在【${currentLocation.area}】，想不想去寻找传说中的宝藏？`;
              }
    
              setMessages([
                  {
                      id: `init-${Date.now()}`,
                      type: 'text',
                      content: welcomeText,
                      sender: 'agent',
                      timestamp: Date.now()
                  },
                  {
                      id: `init-2-${Date.now()}`,
                      type: 'text',
                      content: subText,
                      sender: 'agent',
                      timestamp: Date.now() + 100
                  }
              ]);
          }
      }
  }, [step, currentLocation, showPersonaSelector]); // Added showPersonaSelector dependency

  // --- Service Layer (Mock vs Real) ---

  /**
   * 模拟 AI 识别服务
   */
  const identifyArtifactService = async (imageUrl: string): Promise<ChatMessage['cardData']> => {
      return new Promise((resolve) => {
          setTimeout(() => {
              resolve({
                  title: '萨莫色雷斯的胜利女神',
                  subtitle: '公元前190年 · 希腊化时期',
                  description: '【来自真实 AI 的识别结果】\n这尊雕像发现于萨莫色雷斯岛。她昂首挺胸，迎风展翅，仿佛正落在战船的船头宣告胜利。虽然头部和手臂已缺失，但那湿润衣褶下若隐若现的肌肤质感，被公认为希腊化时期雕塑艺术的巅峰之作。',
                  tags: ['卢浮宫三宝', '镇馆之宝', '胜利象征'],
                  image: imageUrl 
              });
          }, 2000);
      });
  };

  const handleSendMessage = async (text: string = inputText) => {
      if (!text.trim()) return;
      
      // --- Auth & Limit Check ---
      if (!currentUser) {
          if (guestUsageCount >= 2) {
              // Limit Reached - Show Custom Modal
              setShowLimitModal(true);
              return;
          }
          // Increment Usage
          const newCount = guestUsageCount + 1;
          setGuestUsageCount(newCount);
          localStorage.setItem('guest_msg_count', newCount.toString());
      }
      // ---------------------------

      const newUserMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          type: 'text',
          content: text,
          sender: 'user',
          timestamp: Date.now()
      };

      const typingMsgId = `agent-typing-${Date.now()}`;
      const typingMsg: ChatMessage = {
          id: typingMsgId,
          type: 'text',
          content: '',
          sender: 'agent',
          timestamp: Date.now() + 1,
      };
      
      setMessages(prev => [...prev, newUserMsg, typingMsg]);
      setInputText('');

      // Persist User Message (if logged in)
      if (currentUser && currentSessionId) {
          chatService.saveMessage(currentSessionId, newUserMsg);
      }

      const history = [...messages, newUserMsg]
        .slice(-12)
        .filter((m) => m.type === 'text' || m.type === 'card')
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content:
            m.type === 'card'
              ? `${String(m.content || '')}\n${m.cardData?.title ? `【卡片】${m.cardData.title}` : ''}`.trim()
              : String(m.content || ''),
        }))
        .filter((m) => m.content);

      const loc = userRealLocation ? { lat: userRealLocation[0], lng: userRealLocation[1] } : null;
      let response: any = null;
      try {
        const res = await guideAgentService.chat({
          message: text,
          history,
          persona: guidePersona,
          location: loc || undefined,
          clientTime: new Date().toISOString(),
          locale: navigator.language,
          context: {
            selectedName: currentLocation?.name,
            area: currentLocation?.area,
            weather: currentLocation?.weather,
          },
        });
        response = res.success && res.data ? res.data : null;
      } catch {
        response = null;
      }

      const newAgentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          type: response?.card ? 'card' : 'text',
          content: response?.reply || '我这边刚刚走神了…你再说一遍我立刻认真听！',
          cardData: response?.card,
          sender: 'agent',
          timestamp: Date.now(),
          audioUrl: 'tts-enabled' // Flag to enable TTS button
      };
      setMessages(prev => [...prev.filter(m => m.id !== typingMsgId), newAgentMsg]);

      // Persist Agent Message (if logged in)
      if (currentUser && currentSessionId) {
          chatService.saveMessage(currentSessionId, newAgentMsg);
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          // Convert FileList to Array
          const files = Array.from(e.target.files);
          
          // Create URLs for all images
          const imageUrls = files.map(file => URL.createObjectURL(file));
          
          const userImageMsg: ChatMessage = {
              id: `user-img-${Date.now()}`,
              type: 'image',
              content: imageUrls, // Now storing array
              sender: 'user',
              timestamp: Date.now()
          };
          setMessages(prev => [...prev, userImageMsg]);

          const analyzingMsgId = `agent-analyzing-${Date.now()}`;
          const analyzingMsg: ChatMessage = {
              id: analyzingMsgId,
              type: 'text',
              content: files.length > 1 ? `正在同时识别这 ${files.length} 张图片...` : '正在识别文物信息...',
              sender: 'agent',
              timestamp: Date.now() + 100
          };
          setMessages(prev => [...prev, analyzingMsg]);

          // Mock analyzing all images (just taking the first one for the mock result for now)
          const artifactInfo = await identifyArtifactService(imageUrls[0]);

          setMessages(prev => prev.filter(m => m.id !== analyzingMsgId));

          const resultMsg: ChatMessage = {
              id: `agent-result-${Date.now()}`,
              type: 'card',
              content: files.length > 1 ? '这组藏品似乎都来自同一个时期！' : '识别成功！这件藏品非常珍贵。',
              sender: 'agent',
              timestamp: Date.now(),
              cardData: artifactInfo
          };
          setMessages(prev => [...prev, resultMsg]);
      }
  };

  // Simulate Background Location Updates (Silent)
  useEffect(() => {
      if (step !== 'agent-chat') return;

      // Mock moving around the museum every 30s
      const interval = setInterval(() => {
          if (currentLocation?.id === 'louvre') {
              // Only update area info silently, don't block UI
              console.log('User moved to new area...');
              setCurrentLocation(prev => prev ? ({ ...prev, area: '叙利馆 2F · 古希腊陶器' }) : null);
          }
      }, 30000);

      return () => clearInterval(interval);
  }, [step, currentLocation]);

  const handleSearch = (query: string) => {
      setSearchQuery(query);
      isUserInteractingRef.current = !!query.trim();

      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      if (!query.trim()) {
          setFilteredLocations(sortedLocations);
          setIsSearching(false);
          return;
      }

      const lowerQuery = query.toLowerCase();
      const localMatches = sortedLocations.filter(loc =>
          loc.name.toLowerCase().includes(lowerQuery) ||
          loc.area.toLowerCase().includes(lowerQuery)
      );
      setFilteredLocations(localMatches);

      const buildAreaLabel = (parts: Array<string | undefined>) => {
          const uniq = parts.filter(Boolean).map((s) => (s as string).trim()).filter(Boolean);
          return uniq.slice(0, 3).join(' · ') || '未知区域';
      };

      const dedupeByKey = (items: Array<LocationContext & { distance: number }>) => {
          const seen = new Set<string>();
          const out: Array<LocationContext & { distance: number }> = [];
          for (const it of items) {
              const lat = it.coordinates[0];
              const lon = it.coordinates[1];
              const key = `${it.name}|${lat.toFixed(5)}|${lon.toFixed(5)}`;
              if (seen.has(key)) continue;
              seen.add(key);
              out.push(it);
          }
          return out;
      };

      const scoreItem = (it: any) => {
          const cls = String(it._class || '').toLowerCase();
          const typ = String(it._type || '').toLowerCase();
          let s = 0;
          if (cls === 'tourism' || cls === 'amenity' || cls === 'leisure' || cls === 'historic') s += 50;
          if (typ.includes('museum') || typ.includes('attraction') || typ.includes('gallery') || typ.includes('viewpoint') || typ.includes('park')) s += 20;
          if (typeof it.distance === 'number' && it.distance > 0) s += Math.max(0, 30 - Math.min(30, it.distance));
          return s;
      };

      const normalizeNominatimItem = (item: any, q: string) => {
          const named = item?.namedetails || {};
          const zhName =
              named['name:zh'] ||
              named['name:zh-CN'] ||
              named['name:zh-Hans'] ||
              named['zh'] ||
              undefined;
          const enName = named['name:en'] || named['en'] || undefined;
          const baseName = item?.name || (item?.display_name ? String(item.display_name).split(',')[0] : '') || q;
          const name = (zhName || baseName || enName || q).trim();

          const address = item?.address || {};
          const area = buildAreaLabel([
              address.city || address.town || address.village,
              address.state,
              address.country,
          ]);

          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const distance = userRealLocation ? getDistanceFromLatLonInKm(userRealLocation[0], userRealLocation[1], lat, lon) : 0;

          return {
              id: `osm-${item.place_id || `${lat},${lon}`}`,
              name,
              area,
              weather: '未知',
              coverImage: getMockImageForLocation(`osm-${item.place_id || `${lat},${lon}`}`, name),
              recommendations: generateRecommendations(name, /[\u4e00-\u9fa5]/.test(name)),
              coordinates: [lat, lon] as [number, number],
              distance,
              _class: item.class,
              _type: item.type,
          };
      };

      const searchRemote = async (q: string) => {
          const cacheKey = `${q}|${userRealLocation ? `${userRealLocation[0].toFixed(3)},${userRealLocation[1].toFixed(3)}` : 'na'}`;
          const cached = searchCacheRef.current.get(cacheKey);
          if (cached) return cached;

          const lang = 'zh-CN,en';
          const limit = 8;
          const raw = await geoService.searchPlaces({ q, limit, acceptLanguage: lang });
          const results = Array.isArray(raw) ? raw.map((item: any) => normalizeNominatimItem(item, q)) : [];
          const cleaned = results
              .filter((it: any) => Number.isFinite(it.coordinates?.[0]) && Number.isFinite(it.coordinates?.[1]))
              .sort((a: any, b: any) => (scoreItem(b) - scoreItem(a)) || ((a.distance || 0) - (b.distance || 0)))
              .slice(0, 10)
              .map(({ _class, _type, ...rest }: any) => rest);

          searchCacheRef.current.set(cacheKey, cleaned);
          return cleaned;
      };

      const expandQueries = (q: string) => {
          const trimmed = q.trim();
          if (!/[\u4e00-\u9fa5]/.test(trimmed)) return [trimmed];
          const aliases: Record<string, string> = {
              '西湖': '杭州 西湖',
              '长城': '北京 长城',
              '兵马俑': '西安 兵马俑',
              '外滩': '上海 外滩',
              '天安门': '北京 天安门',
              '故宫': '北京 故宫',
              '颐和园': '北京 颐和园',
          };

          const suffixes = ['博物馆', '展览', '景点', '风景区', '美术馆', '公园', '古迹', '纪念馆'];
          const hasSuffix = suffixes.some((s) => trimmed.includes(s));

          const queries = [trimmed];
          if (aliases[trimmed]) queries.push(aliases[trimmed]);

          if (!hasSuffix && trimmed.length >= 2) {
              queries.push(`${trimmed} 景点`);
              queries.push(`${trimmed} 风景区`);
              queries.push(`${trimmed} 博物馆`);
          }

          return queries.slice(0, 5);
      };

      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
          try {
              const queries = expandQueries(query);
              let apiResults: Array<LocationContext & { distance: number }> = [];
              for (const q of queries) {
                  apiResults = await searchRemote(q);
                  if (apiResults.length > 0) break;
              }
              setFilteredLocations(dedupeByKey([...localMatches, ...apiResults]));
          } finally {
              setIsSearching(false);
          }
      }, 800);
  };

  const handleCustomLocation = () => {
      if (!searchQuery.trim()) return;
      
      const customId = `custom-${Date.now()}`;
      const name = searchQuery.trim();
      const fallback: [number, number] = userRealLocation || [39.9042, 116.4074];
      geoService
          .searchPlaces({ q: name, limit: 1, acceptLanguage: 'zh-CN,en' })
          .then((data) => {
              const first = Array.isArray(data) ? data[0] : null;
              const lat = first?.lat ? parseFloat(first.lat) : NaN;
              const lon = first?.lon ? parseFloat(first.lon) : NaN;
              const coords: [number, number] = Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : fallback;
              const area = first?.display_name ? String(first.display_name).split(',').slice(1, 3).join(' · ').trim() || '自定义探索区域' : '自定义探索区域';
              const customLoc: LocationContext = {
                  id: customId,
                  name,
                  area,
                  weather: '未知',
                  coverImage: getMockImageForLocation(customId, name),
                  recommendations: generateRecommendations(name, /[\u4e00-\u9fa5]/.test(name)),
                  coordinates: coords,
              };

              setCurrentLocation(customLoc);
              setShowMapSelector(false);
              setShowPersonaSelector(true);
              setStep('agent-chat');
          })
          .catch(() => {
              const customLoc: LocationContext = {
                  id: customId,
                  name,
                  area: '自定义探索区域',
                  weather: '未知',
                  coverImage: getMockImageForLocation(customId, name),
                  recommendations: generateRecommendations(name, /[\u4e00-\u9fa5]/.test(name)),
                  coordinates: fallback,
              };

              setCurrentLocation(customLoc);
              setShowMapSelector(false);
              setShowPersonaSelector(true);
              setStep('agent-chat');
          });
  };

  // Mock Location Switch (For Demo - Manual Trigger)
  const toggleLocation = () => {
      setShowMapSelector(!showMapSelector);
  };

  const handleAreaSelect = (areaName: string) => {
      if (!currentLocation) return;
      
      setCurrentLocation({ ...currentLocation, area: areaName });
      setShowMapSelector(false);

      const switchMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          type: 'text',
          content: `已定位至【${areaName}】。`,
          sender: 'agent',
          timestamp: Date.now()
      };
      setMessages(prev => [...prev, switchMsg]);
  };

  const handleMuseumSelect = (museumId: string) => {
      // Check if it's a local mock location or an OSM/Custom location
      const newLocation = MOCK_LOCATIONS[museumId] || filteredLocations.find(l => l.id === museumId);
      
      if (newLocation) {
          setCurrentLocation(newLocation);
          setShowMapSelector(false);
          setShowPersonaSelector(true); // Show selector on manual switch
          setStep('agent-chat');
          
          // Messages will be set after persona selection
      }
  };

  const handleTravelogueGenerated = async (item: TravelogueItem) => {
      await travelogueService.add(item);
      // Navigate to the newly created travelogue
      navigate(`/travelogue/${item.id}`);
  };

  const nearestWithin50km = sortedLocations.find(
      (l) => typeof l.distance === 'number' && l.distance > 0 && l.distance <= 50
  );
  const nearestName = typeof nearestWithin50km?.name === 'string' ? nearestWithin50km.name.trim() : '';
  const hasNearbyWithin50km = Boolean(userRealLocation && nearestName);

  return (
    <div className="flex flex-col h-screen w-full bg-transparent text-stone-800 relative overflow-hidden">
      
      {/* Locating Overlay */}
      {step === 'locating' && (
          <div className="absolute inset-0 z-[700] bg-stone-900 flex flex-col items-center justify-center text-white space-y-6">
              {/* Back Button */}
              <button 
                  onClick={() => navigate('/', { replace: true })} 
                  className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white bg-stone-800/50 rounded-full transition-colors z-[710]"
              >
                  <X size={24} />
              </button>

              <div className="relative">
                  <div className="w-24 h-24 border-2 border-stone-700 rounded-full animate-ping absolute inset-0"></div>
                  <div className="w-24 h-24 border-2 border-amber-500/50 rounded-full animate-pulse absolute inset-0 delay-75"></div>
                  <div className="w-24 h-24 flex items-center justify-center">
                      <Compass size={48} className="text-amber-500 animate-spin-slow" />
                  </div>
              </div>
              <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold font-serif">定位中，请稍后</h3>
                  <p className="text-stone-400 text-sm animate-pulse">正在获取您的当前位置</p>
                  <p className="text-stone-600 text-xs mt-4">如果长时间无响应，可跳过手动搜索</p>
                  
                  <button 
                      onClick={() => setStep('manual-selection')}
                      className="mt-6 px-6 py-2 bg-stone-800 rounded-full text-xs text-stone-400 hover:text-white hover:bg-stone-700 transition-colors border border-stone-700"
                  >
                      跳过，手动选择
                  </button>
              </div>
          </div>
      )}

      {/* Manual Selection Overlay */}
      {step === 'manual-selection' && (
          <div className="absolute inset-0 z-[600] bg-stone-900 flex flex-col items-center justify-center text-white p-6">
              {/* Back Button */}
              <button 
                  onClick={() => navigate('/', { replace: true })} 
                  className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white bg-stone-800/50 rounded-full transition-colors z-[610]"
              >
                  <X size={24} />
              </button>

              <div className="w-full max-w-md space-y-4 animate-in fade-in zoom-in duration-300 flex flex-col h-[80vh]">
                  <div className="text-center space-y-2 flex-shrink-0">
                      {isLocatingPending ? (
                          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border transition-colors bg-amber-500/20 border-amber-500">
                              <Loader2 size={32} className="text-amber-500 animate-spin" />
                          </div>
                      ) : (
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border transition-colors ${
                              userRealLocation ? 'bg-amber-500/20 border-amber-500' : 'bg-stone-800 border-stone-700'
                          }`}>
                              <MapPin size={32} className={userRealLocation ? 'text-amber-500' : 'text-stone-400'} />
                          </div>
                      )}
                      <h3 className="text-xl font-bold font-serif">
                          {isLocatingPending ? '定位中，请稍后' : hasNearbyWithin50km ? '已定位到当前位置' : '定位失败 / 未检测到任何博物馆/地标'}
                      </h3>
                      <p className="text-stone-400 text-sm">
                          {isLocatingPending
                            ? '正在尝试获取您的位置，您也可以手动搜索'
                            : hasNearbyWithin50km
                              ? `系统检测到您在【${nearestName}】附近，您也可以手动搜索`
                              : '您也可以手动搜索'}
                      </p>
                  </div>

                  {/* Search Box */}
                  <div className="relative flex-shrink-0">
                      {isSearching ? (
                          <Loader2 className="absolute left-3 top-3 text-amber-500 animate-spin" size={18} />
                      ) : (
                          <Search className="absolute left-3 top-3 text-stone-500" size={18} />
                      )}
                      <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          placeholder="搜索全球博物馆/地标..." 
                          className="w-full bg-stone-800 border border-stone-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                  </div>

                  <div className="grid grid-cols-1 gap-3 overflow-y-auto flex-1 min-h-0 pr-1 custom-scrollbar">
                      {/* Only show "Nearby" header if we have real location data */}
                      {!isLocatingPending && !searchQuery && filteredLocations.length > 0 && (
                          <div className="flex items-center px-1 pt-1 pb-2">
                              <Compass size={12} className="text-amber-500 mr-1.5" />
                              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                                  {(userRealLocation && filteredLocations.some(l => l.distance > 0 && l.distance <= 50 && Boolean(l.name)))
                                    ? '附近热门博物馆/地标'
                                    : '热门博物馆/地标'}
                              </span>
                          </div>
                      )}

                      {isLocatingPending && !searchQuery ? (
                          <div className="text-center py-10 text-stone-400 text-sm">
                              <div className="flex items-center justify-center mb-3">
                                  <Loader2 size={20} className="text-amber-500 animate-spin" />
                              </div>
                              定位中，请稍后…
                          </div>
                      ) : (
                          filteredLocations.map((loc) => (
                          <button
                              key={loc.id}
                              onClick={() => handleMuseumSelect(loc.id)}
                              className="flex items-center p-3 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl transition-all text-left group active:scale-95 flex-shrink-0"
                          >
                              <div className="w-16 h-12 bg-stone-900 rounded-lg overflow-hidden mr-4 border border-stone-600 relative">
                                  <ImageWithFallback src={loc.coverImage} alt={loc.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                  {loc.id.startsWith('osm-') && (
                                      <div className="absolute top-0 right-0 p-0.5 bg-black/60 rounded-bl-md">
                                          <Globe size={8} className="text-white/80" />
                                      </div>
                                  )}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-baseline">
                                    <h4 className="font-bold text-base text-stone-100 truncate pr-2">{loc.name}</h4>
                                    {loc.distance > 0 && (
                                        <span className="text-[10px] text-stone-500 flex-shrink-0">
                                            {loc.distance < 1 ? `${(loc.distance * 1000).toFixed(0)}m` : `${loc.distance.toFixed(1)}km`}
                                        </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-stone-500 truncate">{loc.area}</p>
                              </div>
                              <ChevronDown className="-rotate-90 text-stone-500 ml-2" size={16} />
                          </button>
                      )))}
                      
                      {/* Always show create option if there is a search query, either as the only option or at the bottom */}
                      {!isSearching && searchQuery && (
                           <div className="pt-2 pb-4 px-1">
                              {filteredLocations.length > 0 && (
                                  <div className="text-xs text-stone-500 mb-2 text-center">或者</div>
                              )}
                              <button 
                                  onClick={handleCustomLocation}
                                  className="w-full py-3 bg-stone-800 border border-stone-600 rounded-xl text-stone-300 hover:bg-stone-700 hover:text-white transition-colors text-sm flex items-center justify-center"
                              >
                                  <Plus size={16} className="mr-2" />
                                  直接创建 "{searchQuery}" 导览
                              </button>
                           </div>
                      )}

                      {filteredLocations.length === 0 && !isSearching && !searchQuery && (
                          <div className="text-center py-12 flex flex-col items-center opacity-50">
                              <Search size={48} className="text-stone-600 mb-4" strokeWidth={1} />
                              <p className="text-stone-400 text-sm">请输入博物馆或地标名称</p>
                          </div>
                      )}
                  </div>
                  
                  <button onClick={() => { setIsLocatingPending(true); setShowPersonaSelector(false); setStep('locating'); setLocateNonce((s) => s + 1); }} className="w-full py-3 text-sm text-stone-500 hover:text-white transition-colors flex-shrink-0">
                      重试定位
                  </button>
              </div>
          </div>
      )}

      {/* Persona Selector Overlay */}
      {showPersonaSelector && step !== 'locating' && (
          <div className="absolute inset-0 z-[800] bg-stone-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
              {/* Close Button */}
              <button 
                  onClick={() => {
                      setShowPersonaSelector(false);
                      setStep('manual-selection');
                  }} 
                  className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white bg-stone-800/50 rounded-full transition-colors z-[810]"
              >
                  <X size={24} />
              </button>

              <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-6 relative">
                  <div className="text-center">
                      <h3 className="text-xl font-bold font-serif text-stone-900 mb-2">选择导览风格</h3>
                      <p className="text-stone-500 text-sm">为您量身定制的 AI 讲解体验</p>
                  </div>
                  
                  <div className="space-y-3">
                      <button 
                          onClick={() => { setGuidePersona('expert'); setShowPersonaSelector(false); }}
                          className="w-full p-4 rounded-xl border-2 border-stone-100 hover:border-amber-500 hover:bg-amber-50 transition-all flex items-center group text-left"
                      >
                          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-2xl group-hover:bg-white group-hover:shadow-sm transition-colors">
                              🎓
                          </div>
                          <div className="ml-4">
                              <h4 className="font-bold text-stone-900">专业深度</h4>
                              <p className="text-xs text-stone-500 mt-0.5">适合历史爱好者，详尽严谨</p>
                          </div>
                      </button>

                      <button 
                          onClick={() => { setGuidePersona('humorous'); setShowPersonaSelector(false); }}
                          className="w-full p-4 rounded-xl border-2 border-stone-100 hover:border-amber-500 hover:bg-amber-50 transition-all flex items-center group text-left"
                      >
                          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-2xl group-hover:bg-white group-hover:shadow-sm transition-colors">
                              😎
                          </div>
                          <div className="ml-4">
                              <h4 className="font-bold text-stone-900">轻松幽默</h4>
                              <p className="text-xs text-stone-500 mt-0.5">像朋友聊天一样，有趣不枯燥</p>
                          </div>
                      </button>

                      <button 
                          onClick={() => { setGuidePersona('kids'); setShowPersonaSelector(false); }}
                          className="w-full p-4 rounded-xl border-2 border-stone-100 hover:border-amber-500 hover:bg-amber-50 transition-all flex items-center group text-left"
                      >
                          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-2xl group-hover:bg-white group-hover:shadow-sm transition-colors">
                              🎈
                          </div>
                          <div className="ml-4">
                              <h4 className="font-bold text-stone-900">亲子故事</h4>
                              <p className="text-xs text-stone-500 mt-0.5">简单易懂，寓教于乐</p>
                          </div>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {step === 'agent-chat' ? (
        <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${isChatHidden ? 'opacity-100' : 'opacity-80'} pointer-events-auto`}>
            {tilesEnabled ? (
              <MapContainer 
                  center={(currentLocation?.coordinates || [48.8606, 2.3376]) as [number, number]} 
                  zoom={16} 
                  style={{ width: '100%', height: '100%' }}
                  zoomControl={false}
                  attributionControl={false}
                  zoomAnimation={false}
                  fadeAnimation={false}
              >
                  <TileLayer
                      url={tileUrls[tileUrlIndex]}
                      attribution={tileAttribution}
                      subdomains={tileSubdomains}
                      updateWhenZooming={false}
                      eventHandlers={{
                        tileerror: () => {
                          const now = Date.now();
                          if (now - tileErrorTsRef.current < 1200) return;
                          tileErrorTsRef.current = now;
                          if (tileUrlIndex < tileUrls.length - 1) {
                            setTileUrlIndex(tileUrlIndex + 1);
                          } else {
                            setTilesEnabled(false);
                          }
                        },
                      }}
                  />
                  {currentLocation && (
                      <>
                        <Marker position={currentLocation.coordinates} icon={UserIcon} />
                        <MapUpdater center={currentLocation.coordinates} zoom={16} />
                      </>
                  )}
              </MapContainer>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/40"></div>
            )}
            
            <div className={`absolute inset-0 bg-gradient-to-t from-stone-50 via-stone-50/80 to-transparent pointer-events-none z-[400] transition-opacity duration-500 ${isChatHidden ? 'opacity-0' : 'opacity-100'}`}></div>
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/40"></div>
      )}

      {/* Map Toggle Button - Floating Action Button */}
      {step === 'agent-chat' && (
          <button 
              onClick={() => setIsChatHidden(!isChatHidden)}
              className="absolute bottom-40 right-4 z-[600] w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-stone-600 hover:text-amber-500 hover:bg-stone-50 transition-all active:scale-95 border border-stone-100"
          >
              {isChatHidden ? <MessageCircle size={24} /> : <Map size={24} />}
          </button>
      )}

      {/* Top Context Bar - Only show when in chat mode */}
      {step === 'agent-chat' && currentLocation && (
      <div className={`absolute top-0 left-0 right-0 w-full max-w-3xl mx-auto px-4 pt-12 pb-4 z-[500] pointer-events-none animate-in slide-in-from-top-4 duration-500 flex gap-2 transition-transform duration-500 ${isChatHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        
        {/* Location Selector (Left Aligned, Full Width) */}
        <button 
           onClick={toggleLocation} 
           className="bg-white/90 backdrop-blur-md rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-white/60 p-1.5 pr-4 pointer-events-auto flex items-center flex-1 min-w-0 text-left active:scale-[0.98] transition-all relative z-30"
        >
           <div className="w-9 h-9 rounded-full bg-stone-100 overflow-hidden border border-stone-200 flex-shrink-0 relative">
               <ImageWithFallback src={currentLocation?.coverImage} alt="Location" className="w-full h-full object-cover" />
           </div>
           
           <div className="min-w-0 flex-1 ml-2.5">
               <h2 className="font-bold text-stone-900 text-sm flex items-center truncate leading-tight">
                   <span className="truncate">{currentLocation?.name}</span>
               </h2>
               <div className="flex items-center text-[10px] text-stone-500 mt-0.5 leading-tight">
                   <MapPin size={10} className="mr-0.5" />
                   <span className="truncate max-w-[120px]">{currentLocation?.area}</span>
               </div>
           </div>
           
           <ChevronDown size={14} className={`text-stone-400 ml-2 transition-transform duration-300 ${showMapSelector ? 'rotate-180' : ''}`} />
        </button>

        {/* Action Buttons Group (Right Aligned) */}
        <div className="flex gap-2 relative">
            {/* Menu Button */}
            <button 
               onClick={() => setShowMenu(!showMenu)}
               className={`w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-white/60 pointer-events-auto flex items-center justify-center active:scale-95 transition-all z-30 ${showMenu ? 'text-amber-600 bg-amber-50' : 'text-stone-600'}`}
            >
               <MoreHorizontal size={20} />
            </button>

            {/* Menu Dropdown */}
            {showMenu && (
                <div className="absolute top-12 right-0 w-48 bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-auto z-40">
                    <div className="p-1.5 space-y-1">
                            <button 
                               onClick={() => { setShowGenerator(true); setShowMenu(false); }}
                               className="w-full flex items-center px-3 py-2.5 rounded-xl hover:bg-stone-50 text-left transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mr-3 group-hover:bg-purple-100 transition-colors">
                                    <BookOpen size={16} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-stone-800">生成AI手帐</div>
                                    <div className="text-[10px] text-stone-400">总结今日游览</div>
                                </div>
                            </button>

                            <button 
                               onClick={() => { handleNewSession(); setShowMenu(false); }}
                               className="w-full flex items-center px-3 py-2.5 rounded-xl hover:bg-stone-50 text-left transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center mr-3 group-hover:bg-green-100 transition-colors">
                                    <MessageSquarePlus size={16} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-stone-800">新对话</div>
                                    <div className="text-[10px] text-stone-400">开始新的话题</div>
                                </div>
                            </button>

                            <button 
                               onClick={() => { setShowHistory(true); setShowMenu(false); }}
                               className="w-full flex items-center px-3 py-2.5 rounded-xl hover:bg-stone-50 text-left transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mr-3 group-hover:bg-amber-100 transition-colors">
                                    <History size={16} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-stone-800">历史寻迹</div>
                                    <div className="text-[10px] text-stone-400">查看过往对话</div>
                                </div>
                            </button>
                        </div>
                    </div>
            )}

            {/* Close/Back Button - Minimal Circle */}
            <button 
               onClick={() => navigate('/', { replace: true })} 
               className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-white/60 pointer-events-auto flex items-center justify-center active:scale-95 transition-all text-stone-600 hover:text-red-500 z-30"
            >
               <X size={18} />
            </button>
        </div>

        {/* Map Selector Dropdown */}
        {showMapSelector && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-200 pointer-events-auto z-20">
                <div className="p-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
                    <h3 className="font-bold text-sm text-stone-900">切换当前位置</h3>
                    {/* Only show hint if we have floor plan data */}
                    {(currentLocation.floorPlanUrl || MOCK_LOCATIONS[currentLocation.id]) && (
                        <span className="text-xs text-stone-400">点击色块手动定位</span>
                    )}
                </div>
                
                <div className="p-4 pb-0">
                    <h4 className="text-xs font-bold text-stone-500 mb-2 uppercase tracking-wider flex justify-between items-center">
                        附近热门
                        <span className="text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded">
                            {userRealLocation ? '基于GPS定位' : '定位模拟中'}
                        </span>
                    </h4>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {sortedLocations.map(loc => (
                            <button
                                key={loc.id}
                                onClick={() => handleMuseumSelect(loc.id)}
                                className={`flex-shrink-0 w-32 p-2 rounded-xl border transition-all text-left ${
                                    currentLocation?.id === loc.id 
                                    ? 'bg-stone-900 border-stone-900 text-white shadow-md' 
                                    : 'bg-white border-stone-200 text-stone-800 hover:border-stone-400'
                                }`}
                            >
                                <div className="h-16 rounded-lg bg-stone-200 mb-2 overflow-hidden relative">
                                    <ImageWithFallback src={loc.coverImage} alt={loc.name} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-1 right-1 bg-black/50 backdrop-blur-sm text-white text-[8px] px-1 rounded">
                                        {loc.distance < 1 
                                            ? `${(loc.distance * 1000).toFixed(0)}m` 
                                            : `${loc.distance.toFixed(1)}km`}
                                    </div>
                                </div>
                                <div className="font-bold text-xs truncate">{loc.name}</div>
                                <div className="text-[10px] opacity-70 truncate">{loc.weather}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 relative pt-2">
                    {/* Only show floor plan if we have floorPlanUrl or it's a known mock location with map data */}
                    {(currentLocation.floorPlanUrl || MOCK_LOCATIONS[currentLocation.id]) ? (
                        <>
                            <h4 className="text-xs font-bold text-stone-500 mb-2 uppercase tracking-wider">当前馆内定位</h4>
                            {/* Simulated Floor Plan */}
                            <div className="aspect-[4/3] bg-stone-100 rounded-xl relative overflow-hidden border border-stone-200">
                                {/* Room A */}
                                <button 
                                    onClick={() => handleAreaSelect('德农馆 1F · 意大利绘画厅')}
                                    className={`absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-lg flex items-center justify-center text-[10px] font-bold border-2 transition-all ${currentLocation?.area.includes('意大利') ? 'bg-amber-100 border-amber-500 text-amber-700 shadow-md scale-105 z-10' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                                >
                                    意大利厅
                                </button>
                                {/* Room B */}
                                <button 
                                    onClick={() => handleAreaSelect('叙利馆 2F · 古希腊陶器')}
                                    className={`absolute bottom-[10%] right-[10%] w-[50%] h-[30%] rounded-lg flex items-center justify-center text-[10px] font-bold border-2 transition-all ${currentLocation?.area.includes('古希腊') ? 'bg-amber-100 border-amber-500 text-amber-700 shadow-md scale-105 z-10' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                                >
                                    古希腊厅
                                </button>
                                {/* Room C */}
                                <button 
                                    onClick={() => handleAreaSelect('黎塞留馆 3F · 弗拉芒画派')}
                                    className={`absolute top-[10%] right-[10%] w-[30%] h-[40%] rounded-lg flex items-center justify-center text-[10px] font-bold border-2 transition-all ${currentLocation?.area.includes('弗拉芒') ? 'bg-amber-100 border-amber-500 text-amber-700 shadow-md scale-105 z-10' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                                >
                                    弗拉芒厅
                                </button>
                                
                                {/* User Dot */}
                                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm transform -translate-x-1/2 -translate-y-1/2 z-20 animate-pulse"></div>
                            </div>
                            <div className="mt-3 text-center">
                                <button className="text-xs text-blue-600 font-medium flex items-center justify-center mx-auto">
                                    <Map size={12} className="mr-1" /> 查看完整楼层地图
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h4 className="text-xs font-bold text-stone-500 mb-2 uppercase tracking-wider">切换地标/博物馆</h4>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-stone-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="搜索其他博物馆..." 
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full bg-stone-100 border border-stone-200 rounded-xl py-2.5 pl-9 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                                />
                            </div>
                            
                            {/* Mini Search Results inside Dropdown */}
                            {searchQuery && (
                                <div className="mt-2 max-h-40 overflow-y-auto custom-scrollbar border border-stone-100 rounded-lg bg-white shadow-sm">
                                    {filteredLocations.length > 0 ? (
                                        filteredLocations.slice(0, 3).map(loc => (
                                            <button
                                                key={loc.id}
                                                onClick={() => handleMuseumSelect(loc.id)}
                                                className="w-full text-left p-2 hover:bg-stone-50 flex items-center border-b border-stone-50 last:border-0"
                                            >
                                                <div className="w-8 h-8 rounded bg-stone-200 mr-2 overflow-hidden flex-shrink-0">
                                                    <ImageWithFallback src={loc.coverImage} alt={loc.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold truncate text-stone-800">{loc.name}</div>
                                                    <div className="text-[10px] text-stone-500 truncate">{loc.area}</div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center">
                                            <button 
                                                onClick={handleCustomLocation}
                                                className="text-xs text-amber-600 font-medium flex items-center justify-center mx-auto"
                                            >
                                                <Plus size={12} className="mr-1" />
                                                创建 "{searchQuery}"
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        )}
      </div>
      )}

      {/* Voice Recording Overlay (Dynamic) */}
      {isRecording && (
        <div className="absolute inset-0 z-[900] bg-black/40 flex flex-col items-center justify-center pointer-events-none">
            {/* Center Cancel Zone Indicator */}
            <div className={`transition-all duration-300 transform ${cancelRecording ? 'scale-110 opacity-100' : 'scale-100 opacity-60'}`}>
                <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 ${cancelRecording ? 'bg-red-500' : 'bg-stone-800/80'}`}>
                    <div className="text-center text-white">
                         {cancelRecording ? (
                            <>
                                <X size={32} className="mx-auto mb-1" />
                                <span className="text-xs font-bold">松手取消</span>
                            </>
                         ) : (
                             <>
                                <div className="flex justify-center space-x-1 mb-2 h-4 items-end">
                                    <div className="w-1 bg-white animate-[music-bar_0.5s_ease-in-out_infinite] h-2"></div>
                                    <div className="w-1 bg-white animate-[music-bar_0.5s_ease-in-out_infinite_0.1s] h-4"></div>
                                    <div className="w-1 bg-white animate-[music-bar_0.5s_ease-in-out_infinite_0.2s] h-3"></div>
                                    <div className="w-1 bg-white animate-[music-bar_0.5s_ease-in-out_infinite_0.1s] h-4"></div>
                                    <div className="w-1 bg-white animate-[music-bar_0.5s_ease-in-out_infinite_0.3s] h-2"></div>
                                </div>
                                <span className="text-xs">正在说话...</span>
                                <div className="text-[10px] text-stone-300 mt-1">上滑取消</div>
                             </>
                         )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Main Chat Interface */}
      {step === 'agent-chat' && (
      <div className={`flex flex-col h-full w-full max-w-3xl mx-auto z-[450] pt-32 pb-safe pointer-events-none transition-all duration-500 ${isChatHidden ? 'opacity-0 translate-y-20' : 'opacity-100 translate-y-0'}`}>
        
        {/* Messages Area - Enable pointer events for scrolling/interaction */}
        <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-4 pointer-events-auto">
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                    {msg.type === 'text' && (
                        <div 
                            className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.sender === 'user' 
                                    ? 'bg-stone-900 text-white rounded-tr-none' 
                                    : 'bg-white/90 backdrop-blur-md text-stone-800 border border-white/50 rounded-tl-none'
                            }`}
                        >
                            {msg.sender === 'agent' && msg.id.startsWith('agent-typing-') ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-stone-500">正在查资料</span>
                                <div className="flex items-end space-x-1">
                                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-duration:900ms]"></span>
                                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-duration:900ms] [animation-delay:150ms]"></span>
                                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-duration:900ms] [animation-delay:300ms]"></span>
                                </div>
                              </div>
                            ) : (
                              (typeof msg.content === 'string' ? msg.content : '')
                            )}
                        </div>
                    )}
                    
                    {msg.sender === 'agent' && msg.type === 'text' && (msg.audioUrl || msg.cardData) && (
                        <button 
                            onClick={() => speakText(typeof msg.content === 'string' ? msg.content : '', msg.id)}
                            className={`mt-1 p-1.5 rounded-full transition-colors flex items-center space-x-1 ${playingMessageId === msg.id ? 'text-amber-500 bg-amber-50' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            {playingMessageId === msg.id ? <StopCircle size={14} /> : <Volume2 size={14} />}
                            <span className="text-[10px] font-medium">{playingMessageId === msg.id ? '停止播放' : '语音播报'}</span>
                        </button>
                    )}
                    
                    {msg.type === 'image' && (
                        <div className="max-w-[70%]">
                            {Array.isArray(msg.content) && msg.content.length > 1 ? (
                                // Grid Layout for multiple images
                                <div className={`grid gap-1 rounded-xl overflow-hidden shadow-md border-2 border-white ${
                                    msg.content.length === 2 ? 'grid-cols-2' : 
                                    msg.content.length === 3 ? 'grid-cols-2' : 
                                    msg.content.length === 4 ? 'grid-cols-2' : 
                                    'grid-cols-3'
                                }`}>
                                    {msg.content.map((url, idx) => (
                                        <div key={idx} className={`relative ${
                                            // Special layout handling for 3 items: first one spans full width? No, simple grid is better for chat bubbles
                                            'aspect-square'
                                        }`}>
                                            <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Single Image
                                <div className="rounded-xl overflow-hidden shadow-md border-2 border-white">
                                    <img src={typeof msg.content === 'string' ? msg.content : msg.content[0]} alt="Upload" className="w-full h-auto" />
                                </div>
                            )}
                        </div>
                    )}

                    {msg.type === 'card' && msg.cardData && (
                        <div className="max-w-[90%] w-full bg-white rounded-2xl overflow-hidden shadow-lg border border-stone-100 mt-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="relative h-40">
                                <img src={msg.cardData.image} alt={msg.cardData.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                                    <h3 className="text-white font-bold text-lg">{msg.cardData.title}</h3>
                                    <p className="text-white/80 text-xs">{msg.cardData.subtitle}</p>
                                </div>
                                <button className="absolute top-3 right-3 w-8 h-8 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                    <Play size={14} fill="white" />
                                </button>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-stone-600 leading-relaxed mb-3 line-clamp-3">
                                    {msg.cardData.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {msg.cardData.tags.map(tag => (
                                        <span key={tag} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-1 rounded-md">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar mask-linear-fade pointer-events-auto">
            {currentLocation?.recommendations.map((text, idx) => (
                <button 
                    key={idx}
                    onClick={() => handleSendMessage(text)}
                    className="whitespace-nowrap px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-stone-200/50 rounded-full text-xs font-medium text-stone-600 shadow-sm hover:bg-white hover:text-amber-600 transition-colors"
                >
                    {text}
                </button>
            ))}
        </div>

        {/* Bottom Input Area */}
        <div className="px-4 py-3 bg-gradient-to-t from-white via-white to-transparent pointer-events-auto">
            <div className="bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-stone-100 p-1.5 flex items-center">
                <button 
                    onClick={() => setIsVoiceMode(!isVoiceMode)}
                    className="w-10 h-10 rounded-full bg-stone-50 text-stone-500 flex items-center justify-center hover:bg-stone-100 active:scale-95 transition-all"
                >
                    {isVoiceMode ? <Keyboard size={20} /> : <Mic size={20} />}
                </button>

                {isVoiceMode ? (
                    <button
                        className="flex-1 mx-2 h-9 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 rounded-full text-sm font-bold text-stone-600 select-none touch-none transition-colors flex items-center justify-center"
                        onMouseDown={handleTouchStart}
                        onMouseUp={handleTouchEnd}
                        onMouseMove={(e) => {
                            // Simulate touch move for mouse
                            if (!isRecording) return;
                            // Very rough approximation for desktop testing
                            if (e.clientY < (e.target as HTMLElement).getBoundingClientRect().top - 50) {
                                setCancelRecording(true);
                            } else {
                                setCancelRecording(false);
                            }
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                    >
                        {isRecording ? (cancelRecording ? '松开手指取消发送' : '松开结束') : '按住说话'}
                    </button>
                ) : (
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="问点什么，或拍个照..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 text-stone-800 placeholder-stone-400"
                    />
                )}

                {/* Image Upload Button (Camera/Gallery Combined) */}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*" 
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-full text-stone-500 flex items-center justify-center hover:bg-stone-100 active:scale-95 transition-all mr-1"
                >
                    <Camera size={20} />
                </button>

                <button 
                    onClick={() => handleSendMessage(inputText)}
                    disabled={!inputText.trim()}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all active:scale-95 ${
                        inputText.trim() ? 'bg-stone-900 scale-100' : 'bg-stone-300 scale-90 opacity-0 w-0 overflow-hidden'
                    }`}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
      </div>
      )}

      {/* Usage Limit Modal */}
      {showLimitModal && (
          <div className="absolute inset-0 z-[1000] bg-stone-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 relative overflow-hidden text-center animate-in zoom-in-95 duration-300 border border-stone-100">
                  {/* Decorative Background Element */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
                  
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                      <Lock size={32} className="text-amber-600" />
                  </div>
                  
                  <h3 className="text-2xl font-serif font-bold text-stone-900 mb-3">开启完整旅程</h3>
                  
                  <p className="text-stone-500 text-sm leading-relaxed mb-8 px-2">
                      您已完成 2 次免费对话体验。<br/>
                      登录后即可解锁更多好玩的能力，<br/>并永久保存您的专属文化记忆。
                  </p>
                  
                  <div className="space-y-3">
                      <button 
                          onClick={() => navigate('/auth')}
                          className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 active:scale-[0.98] transition-all flex items-center justify-center"
                      >
                          立即登录 / 注册
                      </button>
                      <button 
                          onClick={() => setShowLimitModal(false)}
                          className="w-full py-3.5 bg-white text-stone-400 hover:text-stone-600 font-medium rounded-xl transition-colors text-sm"
                      >
                          暂不登录
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* History Drawer */}
      {showHistory && (
          <div className="absolute inset-0 z-[850] bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="absolute top-0 bottom-0 right-0 w-3/4 max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                  <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                      <h3 className="font-bold text-lg text-stone-800 flex items-center">
                          <History size={20} className="mr-2 text-amber-500" />
                          历史寻迹
                      </h3>
                      <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-stone-200 rounded-full">
                          <X size={20} className="text-stone-500" />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                      {sessions.length === 0 ? (
                          <div className="text-center py-10 text-stone-400 text-sm">
                              暂无历史记录
                          </div>
                      ) : (
                          sessions.map(session => (
                              <div 
                                  key={session.id}
                                  onClick={() => handleSwitchSession(session)}
                                  className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                                      currentSessionId === session.id 
                                      ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200' 
                                      : 'bg-white border-stone-100 hover:border-amber-200 hover:shadow-sm'
                                  }`}
                              >
                                  <div className="flex justify-between items-start mb-1">
                                      <h4 className="font-bold text-stone-800 text-sm">{session.locationName}</h4>
                                      <span className="text-[10px] text-stone-400">
                                          {new Date(session.lastMessageTime).toLocaleDateString()}
                                      </span>
                                  </div>
                                  <p className="text-xs text-stone-500 line-clamp-2 pr-6">
                                      {session.preview || '暂无内容'}
                                  </p>
                                  
                                  <button 
                                      onClick={(e) => handleDeleteSession(e, session.id)}
                                      className="absolute bottom-3 right-3 p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                      <Trash2 size={14} />
                                  </button>
                              </div>
                          ))
                      )}
                  </div>
              </div>
              {/* Click outside to close */}
              <div className="absolute inset-0 -z-10" onClick={() => setShowHistory(false)}></div>
          </div>
      )}

      {/* Menu Backdrop */}
      {showMenu && (
          <div className="absolute inset-0 z-[499]" onClick={() => setShowMenu(false)}></div>
      )}

      {/* Travelogue Generator */}
      <TravelogueGenerator 
          isOpen={showGenerator}
          onClose={() => setShowGenerator(false)}
          messages={messages}
          location={currentLocation}
          persona={guidePersona}
          user={currentUser}
          onGenerate={handleTravelogueGenerated}
      />

    </div>
  );
};

export default Guide;
