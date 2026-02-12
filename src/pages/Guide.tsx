import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, Mic, Play, X, Plus, MessageCircle, Send, Map, ChevronDown, Compass, MapPin, Search, Loader2, Globe } from 'lucide-react';
import L from 'leaflet';

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
const LocationIcon = createPulsingDot('bg-amber-500');

const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800', // Modern Art
    'https://images.unsplash.com/photo-1518998053901-5348d3969105?auto=format&fit=crop&q=80&w=800', // Gallery
    'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&q=80&w=800', // Ancient
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=800', // Chinese
    'https://images.unsplash.com/photo-1545063328-c8e3fafa16f9?auto=format&fit=crop&q=80&w=800', // Red Walls
    'https://images.unsplash.com/photo-1499856871940-a09e3f92f49e?auto=format&fit=crop&q=80&w=800', // Greek
    'https://images.unsplash.com/photo-1554907984-15263bf06302?auto=format&fit=crop&q=80&w=800', // Library
    'https://images.unsplash.com/photo-1572953109213-3be62398eb95?auto=format&fit=crop&q=80&w=800', // Sculpture
    'https://images.unsplash.com/photo-1565060169689-5f2b2e143c68?auto=format&fit=crop&q=80&w=800', // Asian Architecture
    'https://images.unsplash.com/photo-1548625361-e87c692a4048?auto=format&fit=crop&q=80&w=800', // Museum Hall
    'https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&q=80&w=800', // Historic Building
    'https://images.unsplash.com/photo-1569407228235-9a744831a150?auto=format&fit=crop&q=80&w=800', // Columns
    'https://images.unsplash.com/photo-1597921366472-35a746564619?auto=format&fit=crop&q=80&w=800', // Louvre style
    'https://images.unsplash.com/photo-1550950346-60882e379475?auto=format&fit=crop&q=80&w=800', // British Museum style
    'https://images.unsplash.com/photo-1524397057410-1e775ed476f3?auto=format&fit=crop&q=80&w=800', // Met style
    'https://images.unsplash.com/photo-1514905552197-0610a4d8fd73?auto=format&fit=crop&q=80&w=800', // Exhibition
];

// Helper to get a deterministic mock image based on string hash
const getMockImageForLocation = (id: string, name: string): string => {
    // Simple string hash
    let hash = 0;
    const combined = id + name;
    for (let i = 0; i < combined.length; i++) {
        hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use hash to pick from FALLBACK_IMAGES
    const index = Math.abs(hash) % FALLBACK_IMAGES.length;
    return FALLBACK_IMAGES[index];
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
        coverImage: 'https://image.pollinations.ai/prompt/Louvre%20Museum%20pyramid%20Paris%20sunset%20architecture?width=1080&height=720&nologo=true&seed=101',
        recommendations: ['带我去看蒙娜丽莎', '附近的洗手间', '达芬奇还有哪些画？'],
        coordinates: [48.8606, 2.3376], // Paris
    },
    'gugong': {
        id: 'gugong',
        name: '故宫博物院',
        area: '太和殿广场',
        weather: '多云 20°C',
        coverImage: 'https://image.pollinations.ai/prompt/Forbidden%20City%20Beijing%20ancient%20architecture%20red%20walls%20snow?width=1080&height=720&nologo=true&seed=102',
        recommendations: ['太和殿的历史', '哪里可以买文创？', '延禧宫怎么走'],
        coordinates: [39.9163, 116.3972], // Beijing
    },
    'national_museum': {
        id: 'national_museum',
        name: '中国国家博物馆',
        area: '古代中国展厅',
        weather: '多云 21°C',
        coverImage: 'https://image.pollinations.ai/prompt/National%20Museum%20of%20China%20Beijing%20architecture%20facade?width=1080&height=720&nologo=true&seed=103',
        recommendations: ['后母戊鼎在哪里', '玉龙展示柜', '古代中国基本陈列'],
        coordinates: [39.9040, 116.3974], // Beijing (East of Tiananmen Square)
    },
    'orsay': {
        id: 'orsay',
        name: '奥赛博物馆',
        area: '印象派画廊',
        weather: '晴 25°C',
        coverImage: 'https://image.pollinations.ai/prompt/Musee%20d%27Orsay%20interior%20clock%20Paris?width=1080&height=720&nologo=true&seed=104',
        recommendations: ['梵高的自画像', '莫奈的睡莲', '罗丹的地狱之门'],
        coordinates: [48.8599, 2.3265], // Paris (Near Louvre)
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

interface ChatMessage {
    id: string;
    type: 'text' | 'image' | 'card';
    content: string; 
    cardData?: {
        title: string;
        subtitle: string;
        description: string;
        tags: string[];
        image?: string;
        location?: [number, number]; 
    };
    sender: 'user' | 'agent';
    timestamp: number;
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

const Guide: React.FC = () => {
  // State
  const [step, setStep] = useState<InteractionStep>('locating'); 
  const [currentLocation, setCurrentLocation] = useState<LocationContext | null>(null);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [userRealLocation, setUserRealLocation] = useState<[number, number] | null>(null);
  const [sortedLocations, setSortedLocations] = useState<Array<LocationContext & { distance: number }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<Array<LocationContext & { distance: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  const stepRef = useRef<InteractionStep>(step);
  const isUserInteractingRef = useRef(false);

  // Keep stepRef in sync
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  // Simulate Geolocation on Mount
  useEffect(() => {
      let watchId: number | null = null;

      // 1. Try to get real location
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  const { latitude, longitude } = position.coords;
                  setUserRealLocation([latitude, longitude]);
                  
                  // Sort locations by distance
                  const sorted = Object.values(MOCK_LOCATIONS).map(loc => ({
                      ...loc,
                      distance: getDistanceFromLatLonInKm(latitude, longitude, loc.coordinates[0], loc.coordinates[1])
                  })).sort((a, b) => a.distance - b.distance);
                  
                  setSortedLocations(sorted);
                  setFilteredLocations(sorted);
                  
                  // Auto-select the closest one if very close (< 1km), otherwise default to Louvre
                  if (sorted[0].distance < 1) {
                      setCurrentLocation(sorted[0]);
                  } else {
                      setCurrentLocation(MOCK_LOCATIONS['louvre']);
                  }
                  setStep('agent-chat');
              },
              (error) => {
                  console.error("Geolocation denied or error:", error);
                  // Error handling: Do not guess location. Ask user to select manually.
                  setStep('manual-selection');
                  
                  // Don't show default list on error either, keep clean until location is found or user searches
                  setSortedLocations([]);
                  setFilteredLocations([]);

                  // 2. Start Background Watching (Persistent Attempt)
                  console.log("Starting background location watch...");
                  watchId = navigator.geolocation.watchPosition(
                      (pos) => {
                          console.log("Background location acquired:", pos.coords);
                          const { latitude, longitude } = pos.coords;
                          setUserRealLocation([latitude, longitude]);

                          // Re-sort with new data
                          // Since we are inside the geolocation callback, we can't easily access the latest searchQuery
                          // But we can ensure we don't accidentally auto-select if user is searching.
                          const updatedSorted = Object.values(MOCK_LOCATIONS).map(loc => ({
                              ...loc,
                              distance: getDistanceFromLatLonInKm(latitude, longitude, loc.coordinates[0], loc.coordinates[1])
                          })).sort((a, b) => a.distance - b.distance);
                          
                          setSortedLocations(updatedSorted);
                          
                          // IMPORTANT: NEVER touch filteredLocations in background geolocation updates!
                          // This was causing the search results to disappear because 'setFilteredLocations' was being called with the sorted list,
                          // overriding the API search results while the user was typing.
                          // We only want to update the *default* list (sortedLocations), not the *current view* (filteredLocations) if the user is searching.
                          
                          // Only update filtered if we are NOT searching and NOT interacting
                          if (!isUserInteractingRef.current) {
                              setFilteredLocations(updatedSorted);
                          }
                          
                          // 3. Auto-switch ONLY if still in manual selection mode AND user hasn't started searching/interacting
                          if (stepRef.current === 'manual-selection' && !isUserInteractingRef.current) {
                              const closest = updatedSorted[0];
                              // Only auto-switch if confidence is high (distance < 500m)
                              if (closest.distance < 0.5) {
                                  setCurrentLocation(closest);
                                  setShowMapSelector(false);
                                  setStep('agent-chat');
                                  
                                  setMessages(prev => [...prev, {
                                      id: `sys-loc-${Date.now()}`,
                                      type: 'text',
                                      content: `已成功定位！您似乎在【${closest.name}】附近 (${closest.distance < 1 ? (closest.distance * 1000).toFixed(0) + 'm' : closest.distance.toFixed(1) + 'km'})，已为您自动切换。`,
                                      sender: 'agent',
                                      timestamp: Date.now()
                                  }]);
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
                  timeout: 15000,            // Increased to 15s for better success rate
                  maximumAge: 60000          
              }
          );
      } else {
          // Fallback if no geolocation support
          setStep('manual-selection');
          // Don't show any default list if no location, keep it clean
          setSortedLocations([]);
          setFilteredLocations([]);
      }

      return () => {
          if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Init chat greeting when location changes
  useEffect(() => {
      if (step === 'agent-chat' && currentLocation) {
          setMessages([
              {
                  id: `init-${Date.now()}`,
                  type: 'text',
                  content: `欢迎来到${currentLocation.name}！🎉`,
                  sender: 'agent',
                  timestamp: Date.now()
              },
              {
                  id: `init-2-${Date.now()}`,
                  type: 'text',
                  content: `检测到您目前位于【${currentLocation.area}】。需要我为您介绍这里的镇馆之宝吗？`,
                  sender: 'agent',
                  timestamp: Date.now() + 100
              }
          ]);
      }
  }, [step, currentLocation]);

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

  /**
   * 模拟 AI 对话服务 (RAG)
   */
  const chatWithAgentService = async (query: string): Promise<{ text: string; card?: ChatMessage['cardData'] }> => {
      return new Promise((resolve) => {
        setTimeout(() => {
            if (query.includes('洗手间') || query.includes('厕所')) {
                resolve({ text: '最近的洗手间位于您右后方20米处的楼梯旁，请留意指示牌。' });
            } else if (query.includes('蒙娜丽莎')) {
                resolve({
                    text: '为您找到相关展品信息：',
                    card: {
                        title: '蒙娜丽莎',
                        subtitle: '列奥纳多·达·芬奇 · 油画',
                        description: '《蒙娜丽莎》是达·芬奇的传世名作。她那神秘的微笑使用了“晕涂法”，让轮廓线模糊，产生了朦胧的美感。',
                        tags: ['必看', '油画', '文艺复兴'],
                        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/640px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg'
                    }
                });
            } else {
                resolve({ text: '这是一个非常有趣的问题！根据馆藏数据，这件展品背后的故事是...' });
            }
        }, 1000);
      });
  };

  const handleSendMessage = async (text: string = inputText) => {
      if (!text.trim()) return;
      
      const newUserMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          type: 'text',
          content: text,
          sender: 'user',
          timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, newUserMsg]);
      setInputText('');

      // Call AI Service
      const response = await chatWithAgentService(text);

      const newAgentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          type: response.card ? 'card' : 'text',
          content: response.text,
          cardData: response.card,
          sender: 'agent',
          timestamp: Date.now()
      };
      setMessages(prev => [...prev, newAgentMsg]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const imageUrl = URL.createObjectURL(file);
          
          const userImageMsg: ChatMessage = {
              id: `user-img-${Date.now()}`,
              type: 'image',
              content: imageUrl,
              sender: 'user',
              timestamp: Date.now()
          };
          setMessages(prev => [...prev, userImageMsg]);

          const analyzingMsgId = `agent-analyzing-${Date.now()}`;
          const analyzingMsg: ChatMessage = {
              id: analyzingMsgId,
              type: 'text',
              content: '正在识别文物信息...',
              sender: 'agent',
              timestamp: Date.now() + 100
          };
          setMessages(prev => [...prev, analyzingMsg]);

          const artifactInfo = await identifyArtifactService(imageUrl);

          setMessages(prev => prev.filter(m => m.id !== analyzingMsgId));

          const resultMsg: ChatMessage = {
              id: `agent-result-${Date.now()}`,
              type: 'card',
              content: '识别成功！这件藏品非常珍贵。',
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
      isUserInteractingRef.current = !!query.trim(); // Mark as interacting if there's text

      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      if (!query.trim()) {
          setFilteredLocations(sortedLocations);
          setIsSearching(false);
          return;
      }
      
      // 1. Local Filter (Immediate)
      const lowerQuery = query.toLowerCase();
      const localMatches = sortedLocations.filter(loc => 
          loc.name.toLowerCase().includes(lowerQuery) || 
          loc.area.toLowerCase().includes(lowerQuery)
      );
      setFilteredLocations(localMatches); // Show local results first

      // 2. API Search (Debounced 500ms)
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
          try {
              // HYBRID SEARCH STRATEGY:
              // 1. Detect if query is Chinese characters
              const isChinese = /[\u4e00-\u9fa5]/.test(query);
              
              let apiResults: Array<LocationContext & { distance: number }> = [];

              if (isChinese) {
                  // Strategy A: Use Baidu Place Suggestion API (via CORS proxy or direct if allowed)
                  // Note: Direct client-side Baidu API calls often have CORS issues or require JSONP.
                  // Since we are in a pure frontend demo without a backend proxy, we'll try a clever fallback:
                  // Use a public relay or fallback to OSM with enhanced parameters.
                  
                  // For this demo environment without a real backend/key, we will stick to OSM but with a critical optimization:
                  // We will try to translate/augment the query if possible, or just accept OSM's limitations but filter better.
                  
                  // Actually, let's try a different free source: "Nomatim" is good but "Photon" (based on OSM) sometimes handles fuzzy search better.
                  // But sticking to the user's request for "Baidu-like" quality without a key is hard.
                  // Let's implement a "Mock/Heuristic" translation layer for common landmarks to boost OSM? 
                  // No, that's not scalable.
                  
                  // Let's stick to OSM but use the specific 'amenity' or 'tourism' filters to narrow down to landmarks/museums, reducing noise.
                  const osmQuery = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=zh-CN,en&limit=8&addressdetails=1&featuretype=settlement&layer=address`;
                  
                  const res = await fetch(osmQuery);
                  const data = await res.json();
                  
                  if (Array.isArray(data)) {
                      apiResults = data
                        // Filter out irrelevant types (like administrative boundaries or roads if we want specific POIs)
                        // .filter((item: any) => item.class === 'tourism' || item.class === 'amenity' || item.class === 'place' || item.class === 'leisure')
                        .map((item: any) => {
                          const name = item.name || item.display_name.split(',')[0];
                          return {
                              id: `osm-${item.place_id}`,
                              name: name, 
                              area: item.display_name, 
                              weather: '未知',
                              coverImage: `https://image.pollinations.ai/prompt/cinematic%20photo%20of%20${encodeURIComponent(name)}%20landmark%20architecture%20scenery?width=640&height=480&nologo=true&seed=${item.place_id}`,
                              recommendations: ['探索周边', '寻找展品', '听听讲解'],
                              coordinates: [parseFloat(item.lat), parseFloat(item.lon)],
                              distance: userRealLocation ? getDistanceFromLatLonInKm(userRealLocation[0], userRealLocation[1], parseFloat(item.lat), parseFloat(item.lon)) : 0
                          };
                      });
                  }

              } else {
                  // Strategy B: English/International Query -> Use OSM Standard
                  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=en,zh-CN&limit=5`);
                  const data = await res.json();
                  if (Array.isArray(data)) {
                      apiResults = data.map((item: any) => {
                          const name = item.name || item.display_name.split(',')[0];
                          return {
                              id: `osm-${item.place_id}`,
                              name: name,
                              area: item.display_name,
                              weather: 'Unknown',
                              coverImage: `https://image.pollinations.ai/prompt/cinematic%20photo%20of%20${encodeURIComponent(name)}%20landmark%20architecture%20scenery?width=640&height=480&nologo=true&seed=${item.place_id}`,
                              recommendations: ['Explore', 'Find Exhibits', 'Audio Guide'],
                              coordinates: [parseFloat(item.lat), parseFloat(item.lon)],
                              distance: userRealLocation ? getDistanceFromLatLonInKm(userRealLocation[0], userRealLocation[1], parseFloat(item.lat), parseFloat(item.lon)) : 0
                          };
                      });
                  }
              }

              // Merge and Set
              setFilteredLocations([...localMatches, ...apiResults]);

          } catch (error) {
              console.error("Search API Error:", error);
          } finally {
              setIsSearching(false);
          }
      }, 800);
  };

  const handleCustomLocation = () => {
      if (!searchQuery.trim()) return;
      
      // Create a temporary custom location
      const customLoc: LocationContext = {
          id: `custom-${Date.now()}`,
          name: searchQuery,
          area: '自定义探索区域',
          weather: '未知',
          coverImage: `https://image.pollinations.ai/prompt/cinematic%20photo%20of%20${encodeURIComponent(searchQuery)}%20landmark%20architecture%20scenery?width=640&height=480&nologo=true&seed=${Date.now()}`,
          recommendations: ['自由探索', '记录灵感', '拍摄美景'],
          coordinates: [39.9042, 116.4074], // Default to Beijing if we don't know (or could ask user to pick on map later)
      };
      
      setCurrentLocation(customLoc);
      setShowMapSelector(false);
      setStep('agent-chat');
      setMessages(prev => [...prev, {
          id: `sys-${Date.now()}`,
          type: 'text',
          content: `已为您开启【${searchQuery}】的探索模式。由于该地点暂无详细数据，我将为您提供通用导览服务。`,
          sender: 'agent',
          timestamp: Date.now()
      }]);
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
          setStep('agent-chat');
          
          setMessages(prev => [...prev, {
              id: `sys-${Date.now()}`,
              type: 'text',
              content: `已切换至【${newLocation.name}】。`,
              sender: 'agent',
              timestamp: Date.now()
          }]);
      }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 text-stone-800 relative overflow-hidden">
      
      {/* Locating Overlay */}
      {step === 'locating' && (
          <div className="absolute inset-0 z-[700] bg-stone-900 flex flex-col items-center justify-center text-white space-y-6">
              {/* Back Button */}
              <button 
                  onClick={() => navigate(-1)} 
                  className="absolute top-4 left-4 p-2 text-stone-400 hover:text-white bg-stone-800/50 rounded-full transition-colors z-[710]"
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
                  <h3 className="text-xl font-bold font-serif">正在定位空间...</h3>
                  <p className="text-stone-400 text-sm animate-pulse">解析蓝牙信标与视觉特征</p>
                  <p className="text-stone-600 text-xs mt-4">定位中，预计需要 5-15 秒...</p>
                  
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
                  onClick={() => navigate(-1)} 
                  className="absolute top-4 left-4 p-2 text-stone-400 hover:text-white bg-stone-800/50 rounded-full transition-colors z-[610]"
              >
                  <X size={24} />
              </button>

              <div className="w-full max-w-md space-y-4 animate-in fade-in zoom-in duration-300 flex flex-col h-[80vh]">
                  <div className="text-center space-y-2 flex-shrink-0">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border transition-colors ${
                          userRealLocation ? 'bg-amber-500/20 border-amber-500' : 'bg-stone-800 border-stone-700'
                      }`}>
                          <MapPin size={32} className={userRealLocation ? 'text-amber-500' : 'text-stone-400'} />
                      </div>
                      <h3 className="text-xl font-bold font-serif">
                          {userRealLocation ? '已定位到当前位置' : '无法自动定位'}
                      </h3>
                      <p className="text-stone-400 text-sm">
                          {userRealLocation 
                            ? `系统检测到您在【${sortedLocations[0]?.name}】附近，您也可以手动搜索`
                            : '信号较弱或权限未开启，请选择您所在的博物馆'
                          }
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
                      {!searchQuery && filteredLocations.length > 0 && userRealLocation && (
                          <div className="flex items-center px-1 pt-1 pb-2">
                              <Compass size={12} className="text-amber-500 mr-1.5" />
                              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                                  附近热门博物馆
                              </span>
                          </div>
                      )}

                      {filteredLocations.map((loc) => (
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
                      ))}
                      
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
                  
                  <button onClick={() => setStep('locating')} className="w-full py-3 text-sm text-stone-500 hover:text-white transition-colors flex-shrink-0">
                      重试定位
                  </button>
              </div>
          </div>
      )}

      {/* Background Map (Leaflet) */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-auto">
          {/* Default view to Paris if no location yet, though 'locating' covers it */}
          <MapContainer 
              center={[48.8606, 2.3376]} 
              zoom={16} 
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              attributionControl={false}
          >
              <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {currentLocation && (
                  <>
                    <Marker position={currentLocation.coordinates} icon={UserIcon} />
                    <MapUpdater center={currentLocation.coordinates} zoom={16} />
                  </>
              )}
          </MapContainer>
          
          {/* Overlay gradient to ensure chat is readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-stone-50/80 to-transparent pointer-events-none z-[400]"></div>
      </div>

      {/* Top Context Bar - Only show when in chat mode */}
      {step === 'agent-chat' && currentLocation && (
      <div className="absolute top-0 left-0 right-0 p-4 z-[500] pt-12 pointer-events-none animate-in slide-in-from-top-4 duration-500 flex gap-2">
        {/* Back Button */}
        <button 
           onClick={() => navigate(-1)} 
           className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50 w-12 flex-shrink-0 pointer-events-auto flex items-center justify-center active:scale-[0.98] transition-transform relative z-30"
        >
           <X size={20} className="text-stone-600" />
        </button>

        <button 
           onClick={toggleLocation} 
           className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50 p-3 pointer-events-auto flex items-center justify-between flex-1 min-w-0 text-left active:scale-[0.98] transition-transform relative z-30"
        >
           <div className="flex items-center space-x-3 overflow-hidden">
               <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden border border-stone-200 flex-shrink-0">
                   <ImageWithFallback src={currentLocation?.coverImage} alt="Location" className="w-full h-full object-cover" />
               </div>
               <div className="min-w-0 flex-1">
                   <h2 className="font-bold text-stone-900 text-sm flex items-center truncate">
                       <span className="truncate">{currentLocation?.name}</span>
                       <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">● 营业中</span>
                   </h2>
                   <div className="flex items-center text-xs text-stone-500 mt-0.5">
                       <MapPin size={10} className="mr-1" />
                       <span className="truncate max-w-[180px]">{currentLocation?.area}</span>
                   </div>
               </div>
           </div>
           
           <div className="p-2 bg-stone-100 rounded-full text-stone-400 transition-transform duration-300 ml-2 flex-shrink-0" style={{ transform: showMapSelector ? 'rotate(180deg)' : 'rotate(0deg)' }}>
               <ChevronDown size={16} />
           </div>
        </button>

        {/* Map Selector Dropdown */}
        {showMapSelector && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-200 pointer-events-auto z-20">
                <div className="p-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
                    <h3 className="font-bold text-sm text-stone-900">切换当前位置</h3>
                    <span className="text-xs text-stone-400">点击色块手动定位</span>
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
                </div>
                <div className="bg-stone-50 p-3 text-center border-t border-stone-100">
                    <button className="text-xs text-blue-600 font-medium flex items-center justify-center">
                        <Map size={12} className="mr-1" /> 查看完整楼层地图
                    </button>
                </div>
            </div>
        )}
      </div>
      )}

      {/* Main Chat Interface */}
      {step === 'agent-chat' && (
      <div className="flex flex-col h-full z-[450] pt-32 pb-safe pointer-events-none">
        
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
                            {msg.content}
                        </div>
                    )}
                    
                    {msg.type === 'image' && (
                        <div className="max-w-[60%] rounded-xl overflow-hidden shadow-md border-2 border-white">
                            <img src={msg.content} alt="Upload" className="w-full h-auto" />
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
                <button className="w-10 h-10 rounded-full bg-stone-50 text-stone-500 flex items-center justify-center hover:bg-stone-100 active:scale-95 transition-all">
                    <Mic size={20} />
                </button>

                <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="问点什么，或拍个照..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 text-stone-800 placeholder-stone-400"
                />

                <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*" 
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
    </div>
  );
};

export default Guide;
