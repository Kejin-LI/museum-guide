import { supabase } from '../lib/supabase';

export interface SavedPlan {
    id: string;
    uid?: string;
    title: string;
    destination: string;
    days: number;
    startDate: string | null;
    image: string;
    status: 'upcoming' | 'draft' | 'completed';
    createdAt?: number;
}

// Check if Supabase is configured
const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('supabase');

export const planService = {
    /**
     * Get all plans for a specific user
     */
    getUserPlans: async (userId: string): Promise<SavedPlan[]> => {
        if (!isSupabaseConfigured) return [];

        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!data) return [];

            return data.map(item => ({
                id: item.id,
                uid: item.user_id,
                title: item.title,
                destination: item.destination,
                days: item.days,
                startDate: item.start_date,
                image: item.image,
                status: item.status,
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error("Failed to load user plans:", error);
            return [];
        }
    },

    /**
     * Save or Update a Plan
     */
    savePlan: async (plan: SavedPlan, userId: string) => {
        if (!isSupabaseConfigured) return;

        try {
            const { error } = await supabase
                .from('plans')
                .upsert({
                    id: plan.id,
                    user_id: userId,
                    title: plan.title,
                    destination: plan.destination,
                    days: plan.days,
                    start_date: plan.startDate,
                    image: plan.image,
                    status: plan.status,
                    updated_at: new Date().toISOString(),
                    // If new, created_at will be set by default or we can force it
                    created_at: plan.createdAt ? new Date(plan.createdAt).toISOString() : new Date().toISOString()
                }, { onConflict: 'id' });

            if (error) throw error;
        } catch (e) {
            console.error("Error saving plan:", e);
        }
    },

    /**
     * Delete a Plan
     */
    deletePlan: async (planId: string) => {
        if (!isSupabaseConfigured) return;

        try {
            const { error } = await supabase
                .from('plans')
                .delete()
                .eq('id', planId);

            if (error) throw error;
        } catch (e) {
            console.error("Error deleting plan:", e);
        }
    }
};
