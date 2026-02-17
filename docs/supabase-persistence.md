## Supabase 持久化（计划 / 手帐 / 寻迹）

### 背景

如果 Supabase 侧没有创建对应表或未配置 RLS 策略，前端保存会失败（或只落在本地缓存），导致用户下次登录看不到之前的数据。

本项目将以下数据持久化到 Supabase：
- 行程计划：`public.plans`
- AI 手帐：`public.travelogues`
- 寻迹（对话会话与消息）：`public.chat_sessions` / `public.chat_messages`
- 行程优化对话：`public.plan_agent_sessions`

### 1) 初始化数据库表与 RLS

在 Supabase 控制台 → SQL Editor 运行迁移脚本内容：

- 迁移文件：[20260216120000_user_content.sql](file:///Users/bytedance/Desktop/TREA/博物馆智能导览/museum-guide/supabase/migrations/20260216120000_user_content.sql)

运行后确保：
- 4 张表都存在
- RLS 已启用
- policy 已创建（只允许用户读写自己的数据；公开手帐允许匿名读取 `is_public=true`）

### 2) 确保登出正确清理 session

如果只清理 `localStorage.museum_user` 而不执行 `supabase.auth.signOut()`，可能出现“看似登出但 Supabase session 仍在”的状态。

本项目已将登出改为调用 `supabase.auth.signOut()`，确保下次登录状态一致。

### 3) 验证点

1. 登录后创建一条行程，点击保存
2. 在 Supabase 表 `plans` 中应看到新记录（`user_id` 为当前用户）
3. 刷新页面 / 重新登录后，计划仍然可见
