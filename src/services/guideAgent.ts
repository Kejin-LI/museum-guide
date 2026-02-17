import { supabase } from '../lib/supabase';

export type GuideAgentInput = {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  persona?: 'expert' | 'humorous' | 'kids';
  location?: { lat: number; lng: number; accuracy?: number };
  clientTime?: string;
  locale?: string;
  context?: { selectedName?: string; area?: string; weather?: string };
};

export type GuideAgentOutput = {
  reply: string;
  card?: {
    title: string;
    subtitle: string;
    description: string;
    tags: string[];
    image?: string;
    location?: [number, number];
  };
  citations: Array<{ title: string; url: string; source: 'wikipedia' | 'openstreetmap' | 'amap' }>;
  suggestions: string[];
  places?: Array<{
    name: string;
    lat: number;
    lng: number;
    address?: string;
    distanceMeters?: number;
    source: 'openstreetmap' | 'amap';
    id?: string;
    category?: string;
  }>;
};

const isSupabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('supabase');

export const guideAgentService = {
  chat: async (
    input: GuideAgentInput
  ): Promise<{ success: boolean; data?: GuideAgentOutput; message?: string }> => {
    if (!isSupabaseConfigured) return { success: false, message: '未配置 Supabase' };
    try {
      const { data, error } = await supabase.functions.invoke('guide', { body: input });
      if (error) return { success: false, message: error.message || '请求失败' };
      if (!data) return { success: false, message: '请求失败' };
      return { success: true, data };
    } catch {
      return { success: false, message: '请求失败' };
    }
  },
};

