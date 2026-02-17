import { supabase } from '../lib/supabase';

export type ItineraryGenerateInput = {
  destination: string;
  startDate?: string | null;
  days: number;
  preferences?: string[];
};

export type ItineraryItem = {
  poiId?: string;
  name: string;
  category?: string;
  estimatedDurationHours?: number;
  tag?: string;
  address?: string;
  location?: { lat: number; lng: number };
  source?: 'amap';
};

export type ItinerarySlot = {
  title?: string;
  items: ItineraryItem[];
};

export type ItineraryDay = {
  date?: string;
  title?: string;
  morning: ItinerarySlot;
  afternoon: ItinerarySlot;
  night: ItinerarySlot;
};

export type ItineraryGenerateOutput = {
  title: string;
  destination: string;
  cityIntro: string;
  overview?: string;
  days: ItineraryDay[];
  foodMap: {
    hotpot: string[];
    localCuisine: string[];
    snacks: string[];
    streets: string[];
    coffeeDessert?: string[];
  };
  tips: string[];
};

export type ItineraryChatInput = ItineraryGenerateInput & {
  itinerary: ItineraryGenerateOutput;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  message: string;
};

export type ItineraryChatOutput = {
  reply: string;
  itinerary: ItineraryGenerateOutput;
};

const isSupabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('supabase');

const dicebear = (seed: string) =>
  `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed || 'odyssey')}`;

export const itineraryService = {
  generate: async (input: ItineraryGenerateInput): Promise<{ success: boolean; data?: ItineraryGenerateOutput; message?: string }> => {
    if (!isSupabaseConfigured) return { success: false, message: '未配置 Supabase' };

    try {
      const { data, error } = await supabase.functions.invoke('itinerary', { body: input });
      if (error) return { success: false, message: error.message || '生成失败' };
      if (!data) return { success: false, message: '生成失败' };
      return { success: true, data };
    } catch {
      return { success: false, message: '生成失败' };
    }
  },

  chat: async (input: ItineraryChatInput): Promise<{ success: boolean; data?: ItineraryChatOutput; message?: string }> => {
    if (!isSupabaseConfigured) return { success: false, message: '未配置 Supabase' };

    try {
      const { data, error } = await supabase.functions.invoke('itinerary', {
        body: {
          mode: 'chat',
          destination: input.destination,
          startDate: input.startDate || null,
          days: input.days,
          preferences: input.preferences || [],
          itinerary: input.itinerary,
          messages: input.messages || [],
          message: input.message,
        },
      });
      if (error) return { success: false, message: error.message || '生成失败' };
      if (!data) return { success: false, message: '生成失败' };
      return { success: true, data };
    } catch {
      return { success: false, message: '生成失败' };
    }
  },

  toPlanItemsBySlot: (itinerary: ItineraryGenerateOutput) => {
    const items: Record<string, Array<{ id: string; name: string; image: string; duration: number; tag?: string }>> = {};
    const slots: Array<{ key: 'morning' | 'afternoon' | 'night'; label: string }> = [
      { key: 'morning', label: '上午' },
      { key: 'afternoon', label: '下午' },
      { key: 'night', label: '夜晚' },
    ];

    itinerary.days.forEach((day, i) => {
      slots.forEach((slot) => {
        const key = `day-${i}-${slot.key}`;
        const daySlot = (day as any)[slot.key] as ItinerarySlot | undefined;
        const list = Array.isArray(daySlot?.items) ? daySlot!.items : [];
        items[key] = list.slice(0, 6).map((it, idx) => ({
          id: `spot-${i}-${slot.key}-${idx}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: it.name,
          image: dicebear(`${it.name}-${i}-${slot.key}-${idx}`),
          duration: typeof it.estimatedDurationHours === 'number' ? it.estimatedDurationHours : 2,
          tag: it.tag ? `${slot.label} · ${it.tag}` : it.category ? `${slot.label} · ${it.category}` : slot.label,
        }));
      });
    });

    return items;
  },
};
