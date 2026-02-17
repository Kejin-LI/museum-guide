## 微信内打不开/白屏的常见原因

微信内置浏览器对部分海外域名（例如 `github.io`、`openstreetmap.org`、`supabase.co`）在某些网络环境下会出现不可达或请求被中止，表现为页面空白、地图瓦片加载失败、接口请求 `Failed to fetch`。

## 解决策略（推荐顺序）

### 1) 不在前端直连 OpenStreetMap/Nominatim

已将地理搜索迁移到 Supabase Edge Function `geo`，前端只请求你自己的 API（Supabase Functions），避免在微信里直连 `openstreetmap.org`。

### 2) 中国区地图瓦片使用高德

导览页地图在中国范围内不再强制使用第三方“未公开/易被反爬限制”的瓦片源；微信环境里地图经常因为跨域/反爬/网络策略加载失败，因此地图属于可选增强能力，加载失败会自动降级为背景图层。

### 3) 为 Supabase 配置自定义域名（强烈推荐）

如果微信环境下无法访问 `*.supabase.co`，请在 Supabase Dashboard 配置自定义域名（例如 `api.yourdomain.com`），并将前端环境变量改为该域名：

- `VITE_SUPABASE_URL=https://api.yourdomain.com`
- `VITE_SUPABASE_ANON_KEY=...`

部署到 GitHub Pages / Vercel / Netlify 时，需要把环境变量配置到对应的部署平台。
