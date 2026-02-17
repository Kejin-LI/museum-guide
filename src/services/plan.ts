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
    planData?: any;
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
            // Check if table exists by doing a lightweight query first or just handle the error
            // Actually, we can just try to query.
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                // If table not found, it means we haven't set up the DB schema yet.
                // Gracefully fallback to empty array so the UI doesn't break.
                if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
                    console.warn("Supabase 'plans' table not found. Using local storage only.");
                    return [];
                }
                throw error;
            }
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
                createdAt: new Date(item.created_at).getTime(),
                planData: item.plan_data
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
                    plan_data: plan.planData ?? {},
                    updated_at: new Date().toISOString(),
                    // If new, created_at will be set by default or we can force it
                    created_at: plan.createdAt ? new Date(plan.createdAt).toISOString() : new Date().toISOString()
                }, { onConflict: 'id' });

            if (error) throw error;
        } catch (e) {
            console.error("Error saving plan:", e);
        }
    },

    getPlanById: async (planId: string): Promise<SavedPlan | null> => {
        if (!isSupabaseConfigured) return null;

        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (error || !data) return null;

            return {
                id: data.id,
                uid: data.user_id,
                title: data.title,
                destination: data.destination,
                days: data.days,
                startDate: data.start_date,
                image: data.image,
                status: data.status,
                createdAt: new Date(data.created_at).getTime(),
                planData: data.plan_data,
            };
        } catch {
            return null;
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
