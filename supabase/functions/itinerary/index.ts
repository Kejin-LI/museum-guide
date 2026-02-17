const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

type RequestBody = {
  mode?: 'generate' | 'chat';
  destination: string;
  startDate?: string | null;
  days: number;
  preferences?: string[];
  itinerary?: any;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  message?: string;
};

type ItineraryItem = {
  poiId?: string;
  name: string;
  category?: string;
  estimatedDurationHours?: number;
  tag?: string;
  address?: string;
  location?: { lat: number; lng: number };
  source?: 'amap';
};

type ItinerarySlot = {
  title?: string;
  items: ItineraryItem[];
};

type ItineraryDay = {
  date?: string;
  title?: string;
  morning: ItinerarySlot;
  afternoon: ItinerarySlot;
  night: ItinerarySlot;
};

type FoodMap = {
  hotpot: string[];
  localCuisine: string[];
  snacks: string[];
  streets: string[];
  coffeeDessert?: string[];
};

type ItineraryResponse = {
  title: string;
  destination: string;
  cityIntro: string;
  overview?: string;
  days: ItineraryDay[];
  foodMap: FoodMap;
  tips: string[];
};

type ChatResponse = {
  reply: string;
  itinerary: ItineraryResponse;
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

type PoiCandidate = {
  poiId: string;
  name: string;
  category?: string;
  address?: string;
  location?: { lat: number; lng: number };
  source: 'amap';
};

const addDays = (start: Date, offsetDays: number) => {
  const d = new Date(start);
  d.setDate(d.getDate() + offsetDays);
  return d;
};

const normalizeDays = (days: number) => Math.max(1, Math.min(14, Math.floor(days || 1)));

const parseLngLat = (location: string | undefined): { lat: number; lng: number } | undefined => {
  if (!location) return undefined;
  const [lngStr, latStr] = String(location).split(',');
  const lng = Number(lngStr);
  const lat = Number(latStr);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined;
  return { lat, lng };
};

const fetchJsonWithTimeout = async <T,>(url: string, timeoutMs: number): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('Bad response');
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
};

const openAICompatChatCompletionsUrl = (baseUrlRaw: string) => {
  const baseUrl = String(baseUrlRaw || '').replace(/\/+$/, '');
  return baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;
};

const amapKey = () => (Deno.env.get('AMAP_KEY') || Deno.env.get('AMAP_WEB_KEY') || '').trim();

const amapPlaceText = async (opts: { keywords: string; city?: string; page?: number; offset?: number }) => {
  const key = amapKey();
  if (!key) return [] as any[];
  const params = new URLSearchParams();
  params.set('key', key);
  params.set('keywords', opts.keywords);
  if (opts.city) params.set('city', opts.city);
  params.set('citylimit', 'true');
  params.set('extensions', 'all');
  params.set('offset', String(opts.offset || 20));
  params.set('page', String(opts.page || 1));
  const url = `https://restapi.amap.com/v3/place/text?${params.toString()}`;
  const data = await fetchJsonWithTimeout<any>(url, 8000);
  const pois = Array.isArray(data?.pois) ? data.pois : [];
  return pois;
};

const amapGeocode = async (address: string) => {
  const key = amapKey();
  if (!key) return null;
  const params = new URLSearchParams();
  params.set('key', key);
  params.set('address', address);
  const url = `https://restapi.amap.com/v3/geocode/geo?${params.toString()}`;
  const data = await fetchJsonWithTimeout<any>(url, 8000);
  const geos = Array.isArray(data?.geocodes) ? data.geocodes : [];
  return geos.length > 0 ? geos[0] : null;
};

const collectPoiCandidates = async (destination: string, preferences: string[]) => {
  const key = amapKey();
  if (!key) return [] as PoiCandidate[];

  const geo = await amapGeocode(destination);
  const city = geo?.citycode || geo?.city || undefined;

  const pref = (Array.isArray(preferences) ? preferences : []).map((s) => String(s).trim()).filter(Boolean);
  const baseKeywords = ['博物馆', '美术馆', '展览馆', '纪念馆', '历史文化街区', '步行街', '公园', '古迹', '寺', '夜市', '小吃街', '美食街', '火锅', '咖啡', '甜品'];
  const keywords = Array.from(new Set([...pref, ...baseKeywords])).slice(0, 18);

  const all: PoiCandidate[] = [];
  const seen = new Set<string>();

  for (const kw of keywords) {
    const pois = await amapPlaceText({ keywords: `${destination} ${kw}`.trim(), city, page: 1, offset: 20 });
    for (const p of pois) {
      const poiId = String(p?.id || '').trim();
      const name = String(p?.name || '').trim();
      if (!poiId || !name) continue;
      if (seen.has(poiId)) continue;
      seen.add(poiId);
      all.push({
        poiId,
        name,
        category: p?.type ? String(p.type) : undefined,
        address: p?.address ? String(p.address) : undefined,
        location: parseLngLat(p?.location),
        source: 'amap',
      });
      if (all.length >= 90) break;
    }
    if (all.length >= 90) break;
  }

  return all;
};

const pickFirst = (cands: PoiCandidate[], matcher: (p: PoiCandidate) => boolean, used: Set<string>) => {
  for (const p of cands) {
    if (used.has(p.poiId)) continue;
    if (!matcher(p)) continue;
    used.add(p.poiId);
    return p;
  }
  for (const p of cands) {
    if (used.has(p.poiId)) continue;
    used.add(p.poiId);
    return p;
  }
  return null;
};

const buildPoiBasedItinerary = (input: RequestBody, candidates: PoiCandidate[]): ItineraryResponse => {
  const days = normalizeDays(input.days);
  const start = input.startDate ? new Date(input.startDate) : new Date();
  const destination = (input.destination || '').trim() || '目的地';
  const title = `${destination}${days}日游`;

  const used = new Set<string>();
  const preferMuseum = (p: PoiCandidate) => /博物馆|美术馆|展览馆|纪念馆/.test(p.name) || /博物馆|美术馆|展览馆|纪念馆/.test(p.category || '');
  const preferWalk = (p: PoiCandidate) => /公园|步行街|街区|古城|景区|寺|塔|遗址|古迹/.test(p.name) || /公园|风景|旅游|寺庙|公园/.test(p.category || '');
  const preferFood = (p: PoiCandidate) => /火锅|串串|小吃|夜市|美食|咖啡|甜品|酒吧/.test(p.name) || /餐饮服务/.test(p.category || '');

  const planDays: ItineraryDay[] = Array.from({ length: days }).map((_, i) => {
    const date = isoDate(addDays(start, i));
    const morningPoi = pickFirst(candidates, preferMuseum, used);
    const afternoonPoi = pickFirst(candidates, preferWalk, used);
    const nightPoi = pickFirst(candidates, preferFood, used);
    return {
      date,
      title: `Day ${i + 1}`,
      morning: {
        title: '上午',
        items: morningPoi
          ? [
              {
                poiId: morningPoi.poiId,
                name: morningPoi.name,
                category: morningPoi.category,
                estimatedDurationHours: 3,
                tag: '必看',
                address: morningPoi.address,
                location: morningPoi.location,
                source: 'amap',
              },
            ]
          : [],
      },
      afternoon: {
        title: '下午',
        items: afternoonPoi
          ? [
              {
                poiId: afternoonPoi.poiId,
                name: afternoonPoi.name,
                category: afternoonPoi.category,
                estimatedDurationHours: 2.5,
                tag: '漫步',
                address: afternoonPoi.address,
                location: afternoonPoi.location,
                source: 'amap',
              },
            ]
          : [],
      },
      night: {
        title: '夜晚',
        items: nightPoi
          ? [
              {
                poiId: nightPoi.poiId,
                name: nightPoi.name,
                category: nightPoi.category,
                estimatedDurationHours: 2,
                tag: '美食',
                address: nightPoi.address,
                location: nightPoi.location,
                source: 'amap',
              },
            ]
          : [],
      },
    };
  });

  const foodLike = candidates.filter(preferFood).slice(0, 20).map((p) => p.name);
  const foodMap: FoodMap = {
    hotpot: foodLike.filter((n) => /火锅|串串/.test(n)).slice(0, 6),
    localCuisine: foodLike.filter((n) => /餐厅|饭店|酒家|私房菜|本帮/.test(n)).slice(0, 6),
    snacks: foodLike.filter((n) => /小吃|夜市/.test(n)).slice(0, 6),
    streets: candidates.filter((p) => /街|巷|里|夜市/.test(p.name)).slice(0, 6).map((p) => p.name),
    coffeeDessert: foodLike.filter((n) => /咖啡|甜品|面包|蛋糕/.test(n)).slice(0, 6),
  };

  return {
    title,
    destination,
    cityIntro: `${destination}，我们已基于真实 POI 数据为你整理可执行的行程框架。你可以继续对话，告诉我节奏、亲子、雨天备选等偏好，我会在真实点位范围内调整。`,
    overview: '点位来自地图 POI 搜索结果，建议出行前再核对开放时间与预约规则。',
    days: planDays,
    foodMap,
    tips: ['数据来源：高德地图 POI。', '如遇闭馆/排队较长，可继续对话让我替换为附近同类点位。'],
  };
};

const buildFallback = (input: RequestBody): ItineraryResponse => {
  const days = normalizeDays(input.days);
  const start = input.startDate ? new Date(input.startDate) : new Date();
  const destination = (input.destination || '').trim() || '目的地';
  const title = `${destination}${days}日游`;

  const cityIntro = `${destination}，一座适合慢下来感受生活的城市。这里既有经典地标，也有本地人爱去的街巷与美食。`;
  const overview = '方案融合市区深度游与周边自然人文探索，可按兴趣与体力灵活调整。';

  const planDays: ItineraryDay[] = Array.from({ length: days }).map((_, i) => {
    const date = isoDate(addDays(start, i));
    return {
      date,
      title: `Day ${i + 1}`,
      morning: {
        title: '上午',
        items: [{ name: `${destination} 代表性博物馆`, category: '博物馆', estimatedDurationHours: 3, tag: '必去' }],
      },
      afternoon: {
        title: '下午',
        items: [{ name: `${destination} 城市地标/街区漫步`, category: '景点', estimatedDurationHours: 2.5, tag: '经典' }],
      },
      night: {
        title: '夜晚',
        items: [{ name: `${destination} 夜景/美食街区`, category: '美食', estimatedDurationHours: 2, tag: '氛围' }],
      },
    };
  });

  const foodMap: FoodMap = {
    hotpot: [`${destination} 本地火锅/串串（建议选人气老店）`],
    localCuisine: [`${destination} 家常川菜/小馆（推荐点招牌菜）`],
    snacks: [`${destination} 特色小吃（可在商圈/小吃街补齐）`],
    streets: ['建设路/魁星楼街/玉林路（示例，可替换为当地热门街区）'],
    coffeeDessert: ['本地咖啡/甜品店（示例）'],
  };

  return {
    title,
    destination,
    cityIntro,
    overview,
    days: planDays,
    foodMap,
    tips: ['已启用基础规划：可在前端继续对话优化与手动调整。'],
  };
};

const buildPrompt = (input: RequestBody) => {
  const days = normalizeDays(input.days);
  const destination = (input.destination || '').trim();
  const preferences = Array.isArray(input.preferences) ? input.preferences.filter(Boolean).slice(0, 8) : [];
  const startDate = input.startDate ? String(input.startDate) : '';

  return {
    system: [
      '你是一个专业、务实的旅行规划师。',
      '请为用户生成一个清晰、合理、可执行、风格统一的行程规划。',
      '输出必须是严格 JSON，不要包含任何解释性文字，不要用 Markdown。',
      '避免“超人行程”，同一天不超过 3 个主要景点；优先按地理邻近和动线安排。',
      '如果用户输入的是城市/地区名：以该地区为范围，优先推荐博物馆/展览馆/美术馆/经典景点/城市地标/公园。',
      '如果用户输入的是具体景点：围绕该景点在周边安排。',
      '必须按天，并拆成 morning / afternoon / night 三段，每段给 1-2 个点位（总量控制）。',
      '必须输出：cityIntro（城市简介）、foodMap（美食地图）、tips（实用小贴士）。',
      'date 字段：如果缺少 startDate，date 返回空字符串。',
      'language: zh-CN',
    ].join('\n'),
    user: JSON.stringify(
      {
        destination,
        startDate,
        days,
        preferences,
        output_schema: {
          title: 'string',
          destination: 'string',
          cityIntro: 'string',
          overview: 'string',
          days: [
            {
              date: 'YYYY-MM-DD or empty string',
              title: 'string',
              morning: { title: '上午', items: [{ poiId: 'string', name: 'string', category: 'string', estimatedDurationHours: 'number', tag: 'string optional', address: 'string optional', location: '{lat:number,lng:number} optional', source: '"amap"' }] },
              afternoon: { title: '下午', items: [{ poiId: 'string', name: 'string', category: 'string', estimatedDurationHours: 'number', tag: 'string optional', address: 'string optional', location: '{lat:number,lng:number} optional', source: '"amap"' }] },
              night: { title: '夜晚', items: [{ poiId: 'string', name: 'string', category: 'string', estimatedDurationHours: 'number', tag: 'string optional', address: 'string optional', location: '{lat:number,lng:number} optional', source: '"amap"' }] },
            },
          ],
          foodMap: {
            hotpot: ['string'],
            localCuisine: ['string'],
            snacks: ['string'],
            streets: ['string'],
            coffeeDessert: ['string'],
          },
          tips: ['string'],
        },
      },
      null,
      2
    ),
  };
};

const normalizeItineraryObject = (parsed: any, body: RequestBody): ItineraryResponse => {
  const normalized: ItineraryResponse = {
    title: String(parsed?.title || `${body.destination}${normalizeDays(body.days)}日游`),
    destination: String(parsed?.destination || body.destination),
    cityIntro: String(parsed?.cityIntro || `${body.destination}，一座值得慢慢探索的城市。`),
    overview: parsed?.overview ? String(parsed.overview) : undefined,
    days: Array.isArray(parsed?.days) ? parsed.days : [],
    foodMap:
      parsed?.foodMap && typeof parsed.foodMap === 'object'
        ? {
            hotpot: Array.isArray(parsed.foodMap.hotpot) ? parsed.foodMap.hotpot.map((s: any) => String(s)) : [],
            localCuisine: Array.isArray(parsed.foodMap.localCuisine) ? parsed.foodMap.localCuisine.map((s: any) => String(s)) : [],
            snacks: Array.isArray(parsed.foodMap.snacks) ? parsed.foodMap.snacks.map((s: any) => String(s)) : [],
            streets: Array.isArray(parsed.foodMap.streets) ? parsed.foodMap.streets.map((s: any) => String(s)) : [],
            coffeeDessert: Array.isArray(parsed.foodMap.coffeeDessert) ? parsed.foodMap.coffeeDessert.map((s: any) => String(s)) : [],
          }
        : { hotpot: [], localCuisine: [], snacks: [], streets: [], coffeeDessert: [] },
    tips: Array.isArray(parsed?.tips) ? parsed.tips.map((t: any) => String(t)) : [],
  };

  const days = normalizeDays(body.days);
  const start = body.startDate ? new Date(body.startDate) : null;
  const safeDays: ItineraryDay[] = Array.from({ length: days }).map((_, i) => {
    const day = normalized.days[i] || {};
    const toSafeSlot = (slot: any, fallbackTitle: string): ItinerarySlot => {
      const rawItems = Array.isArray(slot?.items) ? slot.items : [];
      const safeItems = rawItems
        .map((it: any) => ({
          poiId: it?.poiId ? String(it.poiId) : undefined,
          name: String(it?.name || '').trim(),
          category: it?.category ? String(it.category) : undefined,
          estimatedDurationHours: typeof it?.estimatedDurationHours === 'number' ? it.estimatedDurationHours : undefined,
          tag: it?.tag ? String(it.tag) : undefined,
          address: it?.address ? String(it.address) : undefined,
          location:
            it?.location && typeof it.location === 'object' && Number.isFinite(Number(it.location.lat)) && Number.isFinite(Number(it.location.lng))
              ? { lat: Number(it.location.lat), lng: Number(it.location.lng) }
              : undefined,
          source: it?.source === 'amap' ? 'amap' : undefined,
        }))
        .filter((it: any) => it.name);
      return { title: String(slot?.title || fallbackTitle), items: safeItems.slice(0, 3) };
    };

    const date = start ? isoDate(addDays(start, i)) : '';
    return {
      date: String((day as any).date || date || ''),
      title: String((day as any).title || `Day ${i + 1}`),
      morning: toSafeSlot((day as any).morning, '上午'),
      afternoon: toSafeSlot((day as any).afternoon, '下午'),
      night: toSafeSlot((day as any).night, '夜晚'),
    };
  });

  const anyItems = safeDays.some((d) => d.morning.items.length + d.afternoon.items.length + d.night.items.length > 0);
  if (!anyItems) return buildFallback(body);
  return { ...normalized, days: safeDays };
};

const callOpenAICompatible = async (body: RequestBody): Promise<ItineraryResponse> => {
  const candidates = await collectPoiCandidates(body.destination, Array.isArray(body.preferences) ? body.preferences : []);
  const poiPlan = candidates.length > 0 ? buildPoiBasedItinerary(body, candidates) : buildFallback(body);

  const apiKey = Deno.env.get('AI_API_KEY') || Deno.env.get('OPENAI_API_KEY') || '';
  const baseUrl = (Deno.env.get('AI_BASE_URL') || 'https://api.openai.com').replace(/\/+$/, '');
  const model = Deno.env.get('AI_MODEL') || 'gpt-4o-mini';

  if (!apiKey) return poiPlan;

  const prompt = buildPrompt({
    ...body,
    preferences: [
      ...(Array.isArray(body.preferences) ? body.preferences : []),
      '必须使用提供的 POI 候选，禁止编造不存在的景点/店铺；poiId 必须来自候选列表。',
    ],
  });
  const poiCandidatesForPrompt = candidates.slice(0, 60).map((p) => ({
    poiId: p.poiId,
    name: p.name,
    category: p.category,
    address: p.address,
    location: p.location,
    source: p.source,
  }));
  const user = JSON.stringify(
    {
      ...JSON.parse(prompt.user),
      poiCandidates: poiCandidatesForPrompt,
      constraints: {
        must_use_candidate_poiId: true,
        max_items_per_slot: 2,
      },
    },
    null,
    2
  );

  const res = await fetch(openAICompatChatCompletionsUrl(baseUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) return poiPlan;

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') return poiPlan;

  try {
    const parsed = JSON.parse(content);
    const normalized = normalizeItineraryObject(parsed, body);
    const allowed = new Map(candidates.map((p) => [p.poiId, p]));
    const repairedDays = normalized.days.map((d) => {
      const repairSlot = (slot: ItinerarySlot): ItinerarySlot => {
        const fixed: ItineraryItem[] = [];
        for (const it of slot.items) {
          if (it.poiId && allowed.has(it.poiId)) {
            const p = allowed.get(it.poiId)!;
            fixed.push({
              ...it,
              name: p.name,
              category: p.category,
              address: p.address,
              location: p.location,
              source: 'amap',
            });
            continue;
          }
          const byName = it.name ? candidates.find((p) => p.name === it.name) : undefined;
          if (byName) {
            fixed.push({
              ...it,
              poiId: byName.poiId,
              name: byName.name,
              category: byName.category,
              address: byName.address,
              location: byName.location,
              source: 'amap',
            });
          }
        }
        return { ...slot, items: fixed.slice(0, 3) };
      };
      return { ...d, morning: repairSlot(d.morning), afternoon: repairSlot(d.afternoon), night: repairSlot(d.night) };
    });
    const anyItems = repairedDays.some((d) => d.morning.items.length + d.afternoon.items.length + d.night.items.length > 0);
    if (!anyItems) return poiPlan;
    return { ...normalized, days: repairedDays, tips: Array.from(new Set([...(normalized.tips || []), '数据来源：高德地图 POI。'])) };
  } catch {
    return poiPlan;
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as Partial<RequestBody>;
    const destination = String(body.destination || '').trim();
    const days = normalizeDays(Number(body.days || 1));
    const preferences = Array.isArray(body.preferences) ? body.preferences.map(String) : [];
    const startDate = body.startDate ? String(body.startDate) : null;
    const mode = body.mode || 'generate';

    if (!destination) {
      return new Response(JSON.stringify({ error: 'destination is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'chat') {
      const candidates = await collectPoiCandidates(destination, preferences);
      const poiPlan = candidates.length > 0 ? buildPoiBasedItinerary({ destination, days, preferences, startDate }, candidates) : buildFallback({ destination, days, preferences, startDate });

      const apiKey = Deno.env.get('AI_API_KEY') || Deno.env.get('OPENAI_API_KEY') || '';
      if (!apiKey) {
        const itinerary = poiPlan;
        const reply = '当前未配置模型密钥，我先基于真实 POI 数据生成行程框架；你可以继续描述偏好，我会在真实点位范围内调整。';
        const result: ChatResponse = { reply, itinerary };
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const baseUrl = (Deno.env.get('AI_BASE_URL') || 'https://api.openai.com').replace(/\/+$/, '');
      const model = Deno.env.get('AI_MODEL') || 'gpt-4o-mini';
      const message = String(body.message || '').trim();
      const current = body.itinerary || poiPlan;
      const history = Array.isArray(body.messages) ? body.messages.slice(-10) : [];

      const system = [
        '你是一个专业、务实的旅行规划师，正在和用户持续对话以优化行程。',
        '你会基于当前 itinerary 与用户的新要求，做最小必要改动，保持结构清晰可读。',
        '必须使用提供的 POI 候选列表（poiCandidates）来调整行程，禁止编造不存在的景点/店铺；poiId 必须来自候选列表。',
        '输出必须是严格 JSON，不要包含任何解释性文字，不要用 Markdown。',
        '返回结构：{ "reply": string, "itinerary": ItineraryResponse }。',
        'reply 用于向用户解释你做了哪些调整（中文，简洁）。',
        'itinerary 必须完整返回（包含 cityIntro/foodMap/tips/days[morning/afternoon/night]）。',
      ].join('\n');

      const poiCandidatesForPrompt = candidates.slice(0, 60).map((p) => ({
        poiId: p.poiId,
        name: p.name,
        category: p.category,
        address: p.address,
        location: p.location,
        source: p.source,
      }));
      const user = JSON.stringify(
        {
          destination,
          startDate,
          days,
          preferences,
          itinerary: current,
          poiCandidates: poiCandidatesForPrompt,
          user_message: message,
        },
        null,
        2
      );

      const res = await fetch(openAICompatChatCompletionsUrl(baseUrl), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: user },
          ],
        }),
      });

      if (!res.ok) {
        const itinerary = poiPlan;
        const result: ChatResponse = { reply: '模型调用失败，我先保留基于真实 POI 的行程框架；你可以稍后重试。', itinerary };
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        const itinerary = poiPlan;
        const result: ChatResponse = { reply: '返回解析失败，我先保留基于真实 POI 的行程框架；你可以稍后重试。', itinerary };
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const parsed = JSON.parse(content);
        const reply = String(parsed.reply || '已按你的要求调整行程。');
        const itinerary0 = normalizeItineraryObject(
          parsed.itinerary && typeof parsed.itinerary === 'object' ? parsed.itinerary : current,
          { destination, days, preferences, startDate }
        );
        const allowed = new Map(candidates.map((p) => [p.poiId, p]));
        const repairedDays = itinerary0.days.map((d) => {
          const repairSlot = (slot: ItinerarySlot): ItinerarySlot => {
            const fixed: ItineraryItem[] = [];
            for (const it of slot.items) {
              if (it.poiId && allowed.has(it.poiId)) {
                const p = allowed.get(it.poiId)!;
                fixed.push({
                  ...it,
                  name: p.name,
                  category: p.category,
                  address: p.address,
                  location: p.location,
                  source: 'amap',
                });
                continue;
              }
              const byName = it.name ? candidates.find((p) => p.name === it.name) : undefined;
              if (byName) {
                fixed.push({
                  ...it,
                  poiId: byName.poiId,
                  name: byName.name,
                  category: byName.category,
                  address: byName.address,
                  location: byName.location,
                  source: 'amap',
                });
              }
            }
            return { ...slot, items: fixed.slice(0, 3) };
          };
          return { ...d, morning: repairSlot(d.morning), afternoon: repairSlot(d.afternoon), night: repairSlot(d.night) };
        });
        const anyItems = repairedDays.some((d) => d.morning.items.length + d.afternoon.items.length + d.night.items.length > 0);
        const itinerary = anyItems ? { ...itinerary0, days: repairedDays, tips: Array.from(new Set([...(itinerary0.tips || []), '数据来源：高德地图 POI。'])) } : poiPlan;
        const result: ChatResponse = { reply, itinerary };
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        const itinerary = poiPlan;
        const result: ChatResponse = { reply: '返回解析失败，我先保留基于真实 POI 的行程框架；你可以稍后重试。', itinerary };
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const result = await callOpenAICompatible({ destination, days, preferences, startDate });
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'bad request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
