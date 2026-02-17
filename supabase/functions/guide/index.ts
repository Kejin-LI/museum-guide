const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

type GuideRequestBody = {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  persona?: 'expert' | 'humorous' | 'kids';
  location?: { lat: number; lng: number; accuracy?: number };
  clientTime?: string;
  locale?: string;
  context?: {
    selectedName?: string;
    area?: string;
    weather?: string;
  };
};

type GuideCitation = {
  title: string;
  url: string;
  source: 'wikipedia' | 'openstreetmap' | 'amap';
};

type GuideCard = {
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  image?: string;
  location?: [number, number];
};

type GuideResponse = {
  reply: string;
  card?: GuideCard;
  citations: GuideCitation[];
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

const openAICompatChatCompletionsUrl = (baseUrlRaw: string) => {
  const baseUrl = String(baseUrlRaw || '').replace(/\/+$/, '');
  return baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;
};

const haversineMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
};

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

const pickLang = (countryCode?: string, locale?: string) => {
  const lc = (locale || '').toLowerCase();
  if (lc.startsWith('zh')) return 'zh';
  if (countryCode === 'cn' || countryCode === 'hk' || countryCode === 'mo' || countryCode === 'tw') return 'zh';
  return 'en';
};

const nominatimReverse = async (lat: number, lng: number) => {
  const cacheKey = `nominatim:reverse:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached as any;
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(
    String(lng)
  )}&zoom=18&addressdetails=1`;
  const data = await fetchJsonWithTimeout<any>(
    url,
    {
      headers: {
        'User-Agent': 'museum-guide (supabase edge function)',
        Accept: 'application/json',
      },
    },
    8000
  );
  await cacheSet(cacheKey, data, 60 * 10);
  return data;
};

const overpassNearby = async (lat: number, lng: number, kind: 'museum' | 'toilets') => {
  const radius = kind === 'toilets' ? 800 : 1500;
  const cacheKey = `overpass:${kind}:${lat.toFixed(5)},${lng.toFixed(5)}:${radius}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached as any[];

  const q =
    kind === 'toilets'
      ? `
[out:json][timeout:12];
(
  node["amenity"="toilets"](around:${radius},${lat},${lng});
  way["amenity"="toilets"](around:${radius},${lat},${lng});
  relation["amenity"="toilets"](around:${radius},${lat},${lng});
);
out center 25;`
      : `
[out:json][timeout:12];
(
  node["tourism"="museum"](around:${radius},${lat},${lng});
  way["tourism"="museum"](around:${radius},${lat},${lng});
  relation["tourism"="museum"](around:${radius},${lat},${lng});
  node["tourism"="gallery"](around:${radius},${lat},${lng});
  way["tourism"="gallery"](around:${radius},${lat},${lng});
  relation["tourism"="gallery"](around:${radius},${lat},${lng});
);
out center 25;`;

  const data = await fetchJsonWithTimeout<any>(
    'https://overpass-api.de/api/interpreter',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(q)}`,
    },
    15000
  );

  const elements = Array.isArray(data?.elements) ? data.elements : [];
  await cacheSet(cacheKey, elements, 60 * 10);
  return elements;
};

const amapKey = () => (Deno.env.get('AMAP_KEY') || Deno.env.get('AMAP_WEB_KEY') || '').trim();

const amapAround = async (lat: number, lng: number, keywords: string) => {
  const key = amapKey();
  if (!key) return [] as any[];
  const cacheKey = `amap:around:${keywords}:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached as any[];

  const params = new URLSearchParams();
  params.set('key', key);
  params.set('location', `${lng},${lat}`);
  params.set('radius', '2000');
  params.set('keywords', keywords);
  params.set('sortrule', 'distance');
  params.set('offset', '20');
  params.set('page', '1');
  params.set('extensions', 'all');
  const url = `https://restapi.amap.com/v3/place/around?${params.toString()}`;
  const data = await fetchJsonWithTimeout<any>(url, { headers: { Accept: 'application/json' } }, 8000);
  const pois = Array.isArray(data?.pois) ? data.pois : [];
  await cacheSet(cacheKey, pois, 60 * 10);
  return pois;
};

const wikiSummary = async (name: string, lang: 'zh' | 'en') => {
  const cacheKey = `wiki:${lang}:summary:${name}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached as any;

  const base = lang === 'zh' ? 'https://zh.wikipedia.org' : 'https://en.wikipedia.org';
  const searchUrl = `${base}/w/rest.php/v1/search/title?q=${encodeURIComponent(name)}&limit=1`;
  const search = await fetchJsonWithTimeout<any>(searchUrl, { headers: { Accept: 'application/json' } }, 8000);
  const title = search?.pages?.[0]?.title;
  if (!title) return null;
  const summaryUrl = `${base}/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const sum = await fetchJsonWithTimeout<any>(summaryUrl, { headers: { Accept: 'application/json' } }, 8000);
  const out = {
    title: String(sum?.title || title),
    extract: String(sum?.extract || ''),
    url: String(sum?.content_urls?.desktop?.page || `${base}/wiki/${encodeURIComponent(title)}`),
    thumbnail: sum?.thumbnail?.source ? String(sum.thumbnail.source) : undefined,
  };
  await cacheSet(cacheKey, out, 60 * 60 * 24);
  return out;
};

const buildReply = (opts: {
  persona: 'expert' | 'humorous' | 'kids';
  placeLabel: string;
  clientTimeLabel: string;
  intent: 'toilets' | 'intro' | 'nearby';
  primary?: { name: string; distanceMeters?: number; address?: string };
  summary?: string;
}) => {
  const { persona, placeLabel, clientTimeLabel, intent, primary, summary } = opts;
  const dist = primary?.distanceMeters ? `${Math.round(primary.distanceMeters)} 米` : '附近';
  const where = placeLabel ? `你现在在「${placeLabel}」` : '我已获取到你的当前位置';
  if (intent === 'toilets') {
    if (!primary) return `我没在附近找到明确标注的洗手间点位（真实 POI）。建议你留意场馆指示牌，或告诉我你在哪个入口/展厅，我再缩小范围。`;
    if (persona === 'kids') return `小朋友～${where}，最近的洗手间在「${primary.name}」，大约 ${dist}。我们慢慢走过去就好啦。`;
    if (persona === 'humorous') return `${where}。憋尿挑战就到此为止！最近的洗手间是「${primary.name}」，大约 ${dist}。`;
    return `${where}。最近的洗手间是「${primary.name}」，距离约 ${dist}。`;
  }
  if (intent === 'intro') {
    const base = `${where}（${clientTimeLabel}）。`;
    if (!primary) return `${base} 我能给你推荐附近的博物馆/美术馆，但当前没有拿到明确的点位名。你可以直接告诉我“带我去最近的博物馆”或输入一个馆名。`;
    const head =
      persona === 'kids'
        ? `${base} 我们来认识一下「${primary.name}」吧！`
        : persona === 'humorous'
          ? `${base} 「${primary.name}」出场！让我给你来段靠谱版“安利”。`
          : `${base} 我先基于可引用资料为你介绍「${primary.name}」。`;
    const body = summary ? summary : '我暂时没找到可引用的百科简介，但我可以基于 POI 信息给你路线与附近推荐。';
    return `${head}\n\n${body}`;
  }
  if (!primary) return `${where}（${clientTimeLabel}）。我可以基于真实 POI 给你推荐附近的博物馆/美术馆/地标，你想看“最近的博物馆”还是“附近必去景点”？`;
  if (persona === 'kids') return `${where}（${clientTimeLabel}）。附近有「${primary.name}」，大约 ${dist}，我们要不要去看看？`;
  if (persona === 'humorous') return `${where}（${clientTimeLabel}）。附近就有「${primary.name}」（约 ${dist}）。要不要我顺便给你规划个“省腿版”路线？`;
  return `${where}（${clientTimeLabel}）。附近推荐「${primary.name}」（约 ${dist}）。`;
};

const formatClientTimeLabel = (clientTime?: string) => {
  if (clientTime) {
    const m = String(clientTime).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (m) {
      const month = String(Number(m[2]));
      const day = String(Number(m[3]));
      return `${month}月${day}日 ${m[4]}:${m[5]}`;
    }
  }
  const t = new Date();
  return `${t.getMonth() + 1}月${t.getDate()}日 ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
};

const rewriteWithLLM = async (opts: {
  apiKey: string;
  baseUrl: string;
  model: string;
  persona: 'expert' | 'humorous' | 'kids';
  locale?: string;
  userMessage: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  placeLabel: string;
  clientTimeLabel: string;
  primary?: { name: string; address?: string; distanceMeters?: number; source: 'openstreetmap' | 'amap' };
  places: Array<{
    name: string;
    lat: number;
    lng: number;
    address?: string;
    distanceMeters?: number;
    source: 'openstreetmap' | 'amap';
    id?: string;
    category?: string;
  }>;
  wikiExtract?: string;
  citations: Array<{ title: string; url: string; source: 'wikipedia' | 'openstreetmap' | 'amap' }>;
  context?: { selectedName?: string; area?: string; weather?: string };
}) => {
  const personaStyle =
    opts.persona === 'kids'
      ? [
          '风格：亲子故事。',
          '规则：句子短、词汇简单、带一点点童趣；用“我们/小朋友/你看”来引导；可以偶尔用 0-1 个 emoji，但不要连续堆叠。',
          '结构：先一句吸引注意→再给 2-4 条事实要点→最后抛一个简单问题引导继续。',
        ].join('\n')
      : opts.persona === 'humorous'
        ? [
            '风格：轻松幽默。',
            '规则：像朋友聊天一样自然；可以有轻微玩笑/比喻，但不要油腻、不要夸张编造；不要用“据我所知”之类空话。',
            '结构：先一句轻松开场→给事实要点（用短段落，不要 Markdown 列表）→给 1-2 个可选下一步。',
          ].join('\n')
        : [
            '风格：专业深度。',
            '规则：克制、清晰、结构化；优先给可验证的事实与提示（例如“建议以官网/现场为准”）；不讲虚构细节。',
            '结构：先定位你在哪→简要介绍→补充背景（来自 wiki_extract）→给一个实用建议（比如参观/路线/注意事项）。',
          ].join('\n');

  const system = [
    '你是一名博物馆/城市导览助手，负责把“已检索到的真实资料”讲清楚、讲得好听。',
    '重要：严禁编造任何事实（地址、开放时间、历史细节、展品、路线、距离等）。只能使用用户输入与我提供的 facts。',
    '如果 facts 不足以回答，必须明确说不确定，并建议用户到现场/官网核对。',
    '输出必须是严格 JSON，不要包含任何解释性文字，不要用 Markdown。',
    '输出结构：{ "reply": string, "card_description": string optional }。',
    'reply：面向用户的回答，必须严格匹配 persona 选择的导览风格（expert/humorous/kids）。',
    'card_description：如果提供，用于展品/场馆卡片文案（不超过 180 字，仍需基于 facts）。',
    '语言优先使用 zh-CN；如果 locale 显示非中文且用户用英文提问，再用英文。',
    personaStyle,
  ].join('\n');

  const user = JSON.stringify(
    {
      locale: opts.locale || 'zh-CN',
      persona: opts.persona,
      persona_display: opts.persona === 'kids' ? '亲子故事' : opts.persona === 'humorous' ? '轻松幽默' : '专业深度',
      user_message: opts.userMessage,
      context: opts.context || {},
      location_display: opts.placeLabel,
      client_time: opts.clientTimeLabel,
      primary_place: opts.primary || null,
      nearby_places: (opts.places || []).slice(0, 8).map((p) => ({
        name: p.name,
        address: p.address,
        distanceMeters: p.distanceMeters,
        source: p.source,
        category: p.category,
      })),
      wiki_extract: opts.wikiExtract || '',
      citations: (opts.citations || []).map((c) => ({ title: c.title, url: c.url, source: c.source })),
      constraints: {
        do_not_invent_facts: true,
        keep_reply_under_chars: 800,
      },
    },
    null,
    2
  );

  const history = Array.isArray(opts.history) ? opts.history.slice(-8) : [];

  const res = await fetch(openAICompatChatCompletionsUrl(opts.baseUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        ...history.map((m) => ({ role: m.role, content: String(m.content || '') })),
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') return null;
  try {
    const parsed = JSON.parse(content);
    const reply = typeof parsed?.reply === 'string' ? parsed.reply.trim() : '';
    const cardDescription = typeof parsed?.card_description === 'string' ? parsed.card_description.trim() : '';
    if (!reply) return null;
    return { reply, cardDescription };
  } catch {
    return null;
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as Partial<GuideRequestBody>;
    const message = String(body.message || '').trim();
    const persona: 'expert' | 'humorous' | 'kids' = (body.persona as any) || 'expert';
    const lat = body.location?.lat;
    const lng = body.location?.lng;
    if (!message) {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      const res: GuideResponse = {
        reply: '我需要你的当前位置才能给出“附近的真实点位与讲解”。请允许定位后再试一次。',
        citations: [],
        suggestions: ['打开定位', '我在巴黎卢浮宫', '带我去最近的博物馆'],
      };
      return new Response(JSON.stringify(res), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const clientTimeLabel = formatClientTimeLabel(body.clientTime);

    const reverse = await nominatimReverse(lat as number, lng as number);
    const countryCode = reverse?.address?.country_code ? String(reverse.address.country_code) : undefined;
    const placeLabel = reverse?.display_name ? String(reverse.display_name).split(',').slice(0, 3).join('，') : '';
    const lang = pickLang(countryCode, body.locale);

    const isToilets = /洗手间|厕所|卫生间|toilet|restroom/i.test(message);
    const isIntro = /介绍|讲讲|历史|是什么|谁是|必看|看点|讲解|介绍一下|intro|history/i.test(message);

    const citations: GuideCitation[] = [];
    if (placeLabel) {
      citations.push({
        title: 'OpenStreetMap Nominatim Reverse Geocoding',
        url: 'https://nominatim.openstreetmap.org/',
        source: 'openstreetmap',
      });
    }

    const center = { lat: lat as number, lng: lng as number };
    let places: NonNullable<GuideResponse['places']> = [];

    if (countryCode === 'cn' && amapKey()) {
      const pois = await amapAround(center.lat, center.lng, isToilets ? '洗手间' : '博物馆');
      places = pois
        .map((p: any) => {
          const loc = String(p?.location || '');
          const [lngStr, latStr] = loc.split(',');
          const pLng = Number(lngStr);
          const pLat = Number(latStr);
          if (!Number.isFinite(pLng) || !Number.isFinite(pLat)) return null;
          const distanceMeters = Number.isFinite(Number(p?.distance)) ? Number(p.distance) : haversineMeters(center, { lat: pLat, lng: pLng });
          return {
            id: p?.id ? String(p.id) : undefined,
            name: String(p?.name || '').trim(),
            lat: pLat,
            lng: pLng,
            address: p?.address ? String(p.address) : undefined,
            distanceMeters,
            source: 'amap' as const,
            category: p?.type ? String(p.type) : undefined,
          };
        })
        .filter(Boolean)
        .slice(0, 8) as any;
      citations.push({ title: '高德地图 POI', url: 'https://lbs.amap.com/api/webservice/summary', source: 'amap' });
    } else {
      const elements = await overpassNearby(center.lat, center.lng, isToilets ? 'toilets' : 'museum');
      places = elements
        .map((el: any) => {
          const elLat = Number(el?.lat ?? el?.center?.lat);
          const elLng = Number(el?.lon ?? el?.center?.lon);
          if (!Number.isFinite(elLat) || !Number.isFinite(elLng)) return null;
          const name = el?.tags?.name ? String(el.tags.name).trim() : '';
          if (!name) return null;
          const address =
            el?.tags?.['addr:full'] ||
            el?.tags?.['addr:street'] ||
            el?.tags?.['contact:street'] ||
            el?.tags?.['addr:city']
              ? [el?.tags?.['addr:full'], el?.tags?.['addr:housenumber'], el?.tags?.['addr:street'], el?.tags?.['addr:city']]
                  .filter(Boolean)
                  .map((x: any) => String(x))
                  .join(' ')
              : undefined;
          const distanceMeters = haversineMeters(center, { lat: elLat, lng: elLng });
          return {
            id: el?.id ? String(el.id) : undefined,
            name,
            lat: elLat,
            lng: elLng,
            address,
            distanceMeters,
            source: 'openstreetmap' as const,
            category: el?.tags?.tourism ? String(el.tags.tourism) : el?.tags?.amenity ? String(el.tags.amenity) : undefined,
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => (a.distanceMeters || 0) - (b.distanceMeters || 0))
        .slice(0, 8) as any;
      citations.push({ title: 'OpenStreetMap Overpass API', url: 'https://overpass-api.de/', source: 'openstreetmap' });
    }

    const primary = places[0];
    let card: GuideCard | undefined;
    let summaryText = '';

    if (primary && !isToilets) {
      const wiki = await wikiSummary(primary.name, lang);
      if (wiki?.extract) {
        summaryText = wiki.extract;
        citations.push({ title: wiki.title, url: wiki.url, source: 'wikipedia' });
        card = {
          title: primary.name,
          subtitle: primary.address ? primary.address : primary.category ? primary.category : '附近点位',
          description: wiki.extract,
          tags: ['真实POI', lang === 'zh' ? '百科引用' : 'Wikipedia'],
          image: wiki.thumbnail,
          location: [primary.lat, primary.lng],
        };
      } else {
        card = {
          title: primary.name,
          subtitle: primary.address ? primary.address : primary.category ? primary.category : '附近点位',
          description: '已基于真实 POI 定位到该点位。你可以问我：它的历史背景、看点、以及如何从当前位置前往。',
          tags: ['真实POI'],
          location: [primary.lat, primary.lng],
        };
      }
    }

    const reply = buildReply({
      persona,
      placeLabel,
      clientTimeLabel,
      intent: isToilets ? 'toilets' : isIntro ? 'intro' : 'nearby',
      primary: primary
        ? { name: primary.name, distanceMeters: primary.distanceMeters, address: primary.address }
        : undefined,
      summary: summaryText,
    });

    const suggestions = isToilets
      ? ['带我去最近的出口', '附近有没有咖啡', '推荐一个必看展品']
      : ['附近还有哪些博物馆？', '有什么必看/必拍？', '附近的洗手间', '给我一个省腿路线'];

    let finalReply = reply;
    let finalCard = card;

    const apiKey = (Deno.env.get('AI_API_KEY') || Deno.env.get('OPENAI_API_KEY') || '').trim();
    const baseUrl = (Deno.env.get('AI_BASE_URL') || 'https://api.openai.com').trim();
    const model = (Deno.env.get('AI_MODEL') || 'qwen-turbo').trim();

    if (apiKey) {
      const rewritten = await rewriteWithLLM({
        apiKey,
        baseUrl,
        model,
        persona,
        locale: body.locale,
        userMessage: message,
        history: Array.isArray(body.history) ? body.history : [],
        placeLabel,
        clientTimeLabel,
        primary: primary
          ? {
              name: primary.name,
              address: primary.address,
              distanceMeters: primary.distanceMeters,
              source: primary.source,
            }
          : undefined,
        places: places || [],
        wikiExtract: summaryText,
        citations,
        context: body.context,
      });
      if (rewritten?.reply) finalReply = rewritten.reply;
      if (finalCard && rewritten?.cardDescription) {
        finalCard = { ...finalCard, description: rewritten.cardDescription };
      }
    }

    const res: GuideResponse = {
      reply: finalReply,
      card: finalCard,
      citations: Array.from(
        new Map(citations.map((c) => [`${c.source}:${c.url}`, c])).values()
      ),
      suggestions,
      places,
    };

    return new Response(JSON.stringify(res), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'bad request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

export {};
