## 在 Supabase 部署真实行程 Agent（Edge Function）

### 1) 部署 Edge Function

在项目根目录（包含 `supabase/functions`）执行：

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy itinerary --no-verify-jwt
```

说明：
- 本项目的前端通过 `supabase.functions.invoke('itinerary')` 调用该函数
- `--no-verify-jwt` 允许未登录用户也能调用；如果你希望只允许登录用户调用，去掉该参数并在前端带上 session

### 2) 配置大模型密钥（推荐 OpenAI 兼容）

函数支持 OpenAI 兼容接口：`POST {AI_BASE_URL}/v1/chat/completions`。

设置 secrets：

```bash
supabase secrets set AI_API_KEY="..." AI_MODEL="gpt-4o-mini"
supabase secrets set AI_BASE_URL="https://api.openai.com"
```

你也可以替换为其他 OpenAI 兼容供应商的 baseUrl（例如 DeepSeek 等）。

### 2.1) 配置 POI 数据源（必选：真实点位）

本项目支持用地图 POI 作为“候选点位池”，再由 Agent 在候选池内编排（避免编造景点）。
默认接入高德地图 Web Service API：`place/text`、`geocode/geo`。

设置 secrets：

```bash
supabase secrets set AMAP_KEY="你的高德Web服务Key"
```

### 3) 前端环境变量

确保前端 `.env` 里是你的 Supabase 项目信息：

```bash
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="..."
```

### 4) 调用与回退策略

- 正常：基于真实 POI 候选 + 模型编排，返回严格 JSON 行程（含 poiId/address/location/source）
- 无模型密钥：仍会基于真实 POI 生成可执行行程框架（不走假数据）
- 失败：POI 密钥缺失/请求失败 → Edge Function 返回基础模板（用于降级兜底）
