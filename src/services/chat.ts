import { supabase } from '../lib/supabase';

// Types (Mirrors the ones in Guide.tsx, ideally should be shared)
export interface ChatMessage {
    id: string;
    type: 'text' | 'image' | 'card';
    content: string | string[];
    cardData?: {
        title: string;
        subtitle: string;
        description: string;
        tags: string[];
        image?: string;
        location?: [number, number]; 
    };
    sender: 'user' | 'agent';
    timestamp: number;
    audioUrl?: string;
}

export interface ChatSession {
    id: string;
    userId?: string;
    locationId: string;
    locationName: string;
    startTime: number;
    lastMessageTime: number;
    messages: ChatMessage[];
    persona: 'expert' | 'humorous' | 'kids';
    preview: string;
}

// Check if Supabase is configured
const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('supabase');

export const chatService = {
    /**
     * Load all sessions for a logged-in user
     */
    getUserSessions: async (userId: string): Promise<ChatSession[]> => {
        if (!isSupabaseConfigured) return [];

        try {
            // 1. Fetch Sessions
            const { data: sessionsData, error: sessionsError } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });

            if (sessionsError) {
                if (sessionsError.code === 'PGRST205' || sessionsError.message?.includes("Could not find the table")) {
                    return [];
                }
                throw sessionsError;
            }
            if (!sessionsData) return [];

            // 2. Fetch Messages for these sessions (could be optimized)
            // For simplicity, we might load messages on demand when clicking a session, 
            // but the current Guide.tsx structure loads everything. Let's load all for now or structure differently.
            // Loading ALL messages for ALL sessions might be heavy. 
            // Let's load just the sessions first, and messages later? 
            // Guide.tsx expects `sessions` to contain `messages`.
            
            const sessions: ChatSession[] = [];

            for (const s of sessionsData) {
                const { data: msgsData, error: msgsError } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('session_id', s.id)
                    .order('created_at', { ascending: true });
                
                if (msgsError && !(msgsError.code === 'PGRST205' || msgsError.message?.includes("Could not find the table"))) {
                    console.error("Error fetching messages for session", s.id, msgsError);
                }

                sessions.push({
                    id: s.id,
                    userId: s.user_id,
                    locationId: s.location_id,
                    locationName: s.location_name,
                    startTime: new Date(s.created_at).getTime(),
                    lastMessageTime: new Date(s.updated_at).getTime(),
                    persona: s.persona || 'expert',
                    preview: s.preview || '',
                    messages: (msgsData || []).map(m => ({
                        id: m.id,
                        type: m.type,
                        content: m.is_content_json ? JSON.parse(m.content) : m.content,
                        cardData: m.card_data ? JSON.parse(m.card_data) : undefined,
                        sender: m.sender,
                        timestamp: new Date(m.created_at).getTime(),
                        audioUrl: m.audio_url
                    }))
                });
            }

            return sessions;
        } catch (error) {
            console.error("Failed to load user history:", error);
            return [];
        }
    },

    /**
     * Save or Update a Session
     */
    saveSession: async (session: ChatSession, userId: string) => {
        if (!isSupabaseConfigured) return;

        try {
            const { error } = await supabase
                .from('chat_sessions')
                .upsert({
                    id: session.id,
                    user_id: userId,
                    location_id: session.locationId,
                    location_name: session.locationName,
                    persona: session.persona,
                    preview: session.preview,
                    updated_at: new Date(session.lastMessageTime).toISOString(),
                    // Only set created_at on insert, usually Supabase handles defaults but upsert might need care
                    // created_at: new Date(session.startTime).toISOString() 
                }, { onConflict: 'id' });

            if (error) throw error;
        } catch (e) {
            console.error("Error saving session:", e);
        }
    },

    /**
     * Save a single message
     */
    saveMessage: async (sessionId: string, message: ChatMessage) => {
        if (!isSupabaseConfigured) return;

        try {
            const isContentJson = Array.isArray(message.content);
            
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    id: message.id,
                    session_id: sessionId,
                    sender: message.sender,
                    type: message.type,
                    content: isContentJson ? JSON.stringify(message.content) : message.content,
                    is_content_json: isContentJson,
                    card_data: message.cardData ? JSON.stringify(message.cardData) : null,
                    audio_url: message.audioUrl,
                    created_at: new Date(message.timestamp).toISOString()
                });

            if (error) throw error;
        } catch (e) {
            console.error("Error saving message:", e);
        }
    },

    /**
     * Delete a session
     */
    deleteSession: async (sessionId: string) => {
        if (!isSupabaseConfigured) return;

        try {
            // Delete messages first (if no cascade delete)
            await supabase.from('chat_messages').delete().eq('session_id', sessionId);
            
            // Delete session
            const { error } = await supabase.from('chat_sessions').delete().eq('id', sessionId);
            
            if (error) throw error;
        } catch (e) {
            console.error("Error deleting session:", e);
        }
    }
};
