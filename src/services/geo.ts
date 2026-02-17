import { supabase } from '../lib/supabase';

type GeoSearchResult = {
  place_id: string;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  boundingbox?: [string, string, string, string];
  class?: string;
  type?: string;
  namedetails?: Record<string, string>;
  extratags?: Record<string, string>;
};

const isSupabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('supabase');

export const geoService = {
  searchNearbyMuseums: async (lat: number, lng: number, limit: number = 20): Promise<GeoSearchResult[]> => {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.functions.invoke('geo', {
        body: { action: 'search_nearby_museums', lat, lng, limit },
      });
      if (error) return [];
      return Array.isArray(data) ? (data as GeoSearchResult[]) : [];
    } catch {
      return [];
    }
  },

  searchPlaces: async (opts: {
    q: string;
    limit?: number;
    acceptLanguage?: string;
    viewbox?: { west: number; south: number; east: number; north: number };
    bounded?: boolean;
  }): Promise<GeoSearchResult[]> => {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.functions.invoke('geo', {
        body: { action: 'search_places', ...opts },
      });
      if (error) return [];
      return Array.isArray(data) ? (data as GeoSearchResult[]) : [];
    } catch {
      return [];
    }
  },
};

