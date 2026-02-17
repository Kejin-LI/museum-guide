import { supabase } from '../lib/supabase';

const isSupabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('supabase');

export type PlanAgentMessage = { role: 'user' | 'assistant'; content: string };

export const planAgentService = {
  getSession: async (planId: string, userId: string): Promise<PlanAgentMessage[]> => {
    if (!isSupabaseConfigured) return [];
    if (!planId || !userId) return [];

    try {
      const { data, error } = await supabase
        .from('plan_agent_sessions')
        .select('messages')
        .eq('plan_id', planId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return [];
      const raw = data.messages;
      const arr = Array.isArray(raw) ? raw : [];
      return arr
        .map((m: any) => ({ role: m?.role, content: m?.content }))
        .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');
    } catch {
      return [];
    }
  },

  saveSession: async (planId: string, userId: string, messages: PlanAgentMessage[]) => {
    if (!isSupabaseConfigured) return;
    if (!planId || !userId) return;

    try {
      await supabase.from('plan_agent_sessions').upsert(
        {
          plan_id: planId,
          user_id: userId,
          messages,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'plan_id,user_id' }
      );
    } catch {
    }
  },
};
