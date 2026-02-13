import { createClient } from '@supabase/supabase-js';

// ⚠️ 请将您的 Supabase 项目 URL 和 Anon Key 填入此处
// 您可以在 Supabase 控制台 -> Settings -> API 中找到这些信息
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
