const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

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

type GeoRequestBody =
  | {
      action: 'search_nearby_museums';
      lat: number;
      lng: number;
      limit?: number;
    }
  | {
      action: 'search_places';
      q: string;
      limit?: number;
      acceptLanguage?: string;
      viewbox?: { west: number; south: number; east: number; north: number };
      bounded?: boolean;
    }
  | {
      action: 'ip_locate';
    };

const fetchJsonWithTimeout = async <T,>(url: string, init: RequestInit, timeoutMs: number): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`Bad response: ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
};

const isInChina = (lat: number, lng: number) => lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135;

const supabaseUrl = () => (Deno.env.get('SUPABASE_URL') || '').replace(/\/+$/, '');
const serviceRoleKey = () => (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();

const cacheGet = async (key: string) => {
  const url = supabaseUrl();
  const token = serviceRoleKey();
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/rest/v1/edge_cache?key=eq.${encodeURIComponent(key)}&select=value,expires_at`, {
      headers: {
        apikey: token,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ value: any; expires_at: string }>;
    if (!rows || rows.length === 0) return null;
    const exp = new Date(rows[0].expires_at).getTime();
    if (Number.isFinite(exp) && exp > Date.now()) return rows[0].value;
    return null;
  } catch {
    return null;
  }
};

const cacheSet = async (key: string, value: any, ttlSeconds: number) => {
  const url = supabaseUrl();
  const token = serviceRoleKey();
  if (!url || !token) return;
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    await fetch(`${url}/rest/v1/edge_cache?on_conflict=key`, {
      method: 'POST',
      headers: {
        apikey: token,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ key, value, expires_at: expiresAt }),
    });
  } catch {
  }
};

const amapKey = () => (Deno.env.get('AMAP_KEY') || Deno.env.get('AMAP_WEB_KEY') || '').trim();

const amapPlaceText = async (keywords: string, limit: number) => {
  const key = amapKey();
  if (!key) return [] as any[];
  const params = new URLSearchParams();
  params.set('key', key);
  params.set('keywords', keywords);
  params.set('citylimit', 'false');
  params.set('extensions', 'all');
  params.set('offset', String(Math.max(1, Math.min(25, limit))));
  params.set('page', '1');
  const url = `https://restapi.amap.com/v3/place/text?${params.toString()}`;
  const data = await fetchJsonWithTimeout<any>(url, { headers: { Accept: 'application/json' } }, 9000);
  return Array.isArray(data?.pois) ? data.pois : [];
};

const amapAround = async (lat: number, lng: number, keywords: string, limit: number) => {
  const key = amapKey();
  if (!key) return [] as any[];
  const params = new URLSearchParams();
  params.set('key', key);
  params.set('location', `${lng},${lat}`);
  params.set('radius', '30000');
  params.set('keywords', keywords);
  params.set('sortrule', 'distance');
  params.set('offset', String(Math.max(1, Math.min(25, limit))));
  params.set('page', '1');
  params.set('extensions', 'all');
  const url = `https://restapi.amap.com/v3/place/around?${params.toString()}`;
  const data = await fetchJsonWithTimeout<any>(url, { headers: { Accept: 'application/json' } }, 9000);
  return Array.isArray(data?.pois) ? data.pois : [];
};

const amapIpLocate = async (ip: string | null) => {
  const key = amapKey();
  if (!key) return null;
  const params = new URLSearchParams();
  params.set('key', key);
  if (ip) params.set('ip', ip);
  const url = `https://restapi.amap.com/v3/ip?${params.toString()}`;
  const data = await fetchJsonWithTimeout<any>(url, { headers: { Accept: 'application/json' } }, 9000);
  const rect = typeof data?.rectangle === 'string' ? String(data.rectangle) : '';
  const parts = rect.split(';').map((s: string) => s.trim()).filter(Boolean);
  const p1 = parts[0]?.split(',') || [];
  const p2 = parts[1]?.split(',') || [];
  const lng1 = Number(p1[0]);
  const lat1 = Number(p1[1]);
  const lng2 = Number(p2[0]);
  const lat2 = Number(p2[1]);
  const center =
    [lng1, lat1, lng2, lat2].every(Number.isFinite)
      ? { lat: (lat1 + lat2) / 2, lng: (lng1 + lng2) / 2 }
      : null;
  return {
    ip: ip || null,
    province: data?.province ? String(data.province) : '',
    city: Array.isArray(data?.city) ? '' : data?.city ? String(data.city) : '',
    adcode: data?.adcode ? String(data.adcode) : '',
    rectangle: rect || '',
    center,
  };
};

const nominatimSearch = async (opts: { q: string; limit: number; acceptLanguage?: string; viewbox?: string; bounded?: boolean }) => {
  const params = new URLSearchParams();
  params.set('format', 'jsonv2');
  params.set('q', opts.q);
  params.set('limit', String(opts.limit));
  params.set('addressdetails', '1');
  params.set('extratags', '1');
  params.set('namedetails', '1');
  if (opts.acceptLanguage) params.set('accept-language', opts.acceptLanguage);
  if (opts.viewbox) params.set('viewbox', opts.viewbox);
  if (opts.bounded) params.set('bounded', '1');
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const data = await fetchJsonWithTimeout<any[]>(
    url,
    {
      headers: {
        'User-Agent': 'museum-guide (supabase edge function)',
        Accept: 'application/json',
      },
    },
    12000
  );
  return Array.isArray(data) ? data : [];
};

const toNominatimLikeFromAmap = (poi: any): GeoSearchResult | null => {
  const loc = String(poi?.location || '');
  const [lngStr, latStr] = loc.split(',');
  const lng = Number(lngStr);
  const lat = Number(latStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const name = String(poi?.name || '').trim();
  if (!name) return null;
  const address = String(poi?.address || '').trim();
  const cityname = String(poi?.cityname || '').trim();
  const adname = String(poi?.adname || '').trim();
  const display_name = [name, address, adname, cityname].filter(Boolean).join(', ');
  const id = poi?.id ? String(poi.id) : `amap-${lat},${lng}`;
  return {
    place_id: `amap-${id}`,
    lat: String(lat),
    lon: String(lng),
    name,
    display_name,
    class: 'amenity',
    type: 'museum',
  };
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as GeoRequestBody;

    if (body.action === 'ip_locate') {
      const headers = req.headers;
      const xf = headers.get('x-forwarded-for') || headers.get('x-real-ip') || '';
      const ip = xf ? xf.split(',')[0].trim() : null;
      const cacheKey = `geo:ip_locate:${ip || 'na'}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const data = await amapIpLocate(ip);
      await cacheSet(cacheKey, data, 60 * 10);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.action === 'search_nearby_museums') {
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      const limit = Math.max(1, Math.min(25, Number(body.limit || 20)));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return new Response(JSON.stringify({ error: 'lat/lng required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const cacheKey = `geo:nearby_museums:${lat.toFixed(5)},${lng.toFixed(5)}:${limit}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      let out: GeoSearchResult[] = [];
      if (isInChina(lat, lng) && amapKey()) {
        const pois = await amapAround(lat, lng, '博物馆|美术馆|展览馆', limit);
        out = pois.map(toNominatimLikeFromAmap).filter(Boolean) as GeoSearchResult[];
      } else {
        const box = `${lng - 0.2},${lat + 0.2},${lng + 0.2},${lat - 0.2}`;
        const data = await nominatimSearch({
          q: 'museum',
          limit,
          acceptLanguage: 'zh-CN,en',
          viewbox: box,
          bounded: true,
        });
        out = data as GeoSearchResult[];
      }

      await cacheSet(cacheKey, out, 60 * 10);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.action === 'search_places') {
      const q = String(body.q || '').trim();
      const limit = Math.max(1, Math.min(25, Number(body.limit || 10)));
      if (!q) {
        return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const viewbox = body.viewbox;
      const viewboxParam =
        viewbox && [viewbox.west, viewbox.south, viewbox.east, viewbox.north].every(Number.isFinite)
          ? `${viewbox.west},${viewbox.north},${viewbox.east},${viewbox.south}`
          : undefined;
      const bounded = Boolean(body.bounded && viewboxParam);

      const cacheKey = `geo:search_places:${q}:${limit}:${body.acceptLanguage || ''}:${viewboxParam || ''}:${bounded ? '1' : '0'}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      let out: GeoSearchResult[] = [];
      const accepts = String(body.acceptLanguage || 'zh-CN,en');
      const useAmap = amapKey() && /[\u4e00-\u9fa5]/.test(q);
      if (useAmap) {
        const pois = await amapPlaceText(q, limit);
        out = pois.map(toNominatimLikeFromAmap).filter(Boolean) as GeoSearchResult[];
      } else {
        const data = await nominatimSearch({
          q,
          limit,
          acceptLanguage: accepts,
          viewbox: viewboxParam,
          bounded,
        });
        out = data as GeoSearchResult[];
      }

      await cacheSet(cacheKey, out, 60 * 30);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'bad request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

export {};
