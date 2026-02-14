import { API_BASE_URL, USE_REAL_API } from '../config';
import { supabase } from '../lib/supabase';

interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    token?: string;
}

interface AuthResponse {
    success: boolean;
    data?: User;
    message?: string;
}

// 默认头像列表（古希腊神话人物与风景）
export const GUEST_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"; // 默认访客头像 - 更加积极开朗

const DEFAULT_AVATARS = [
    'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&q=80&w=200', // Renaissance Portrait
    'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&q=80&w=200', // Friendly Goddess (Athena?)
    'https://images.unsplash.com/photo-1549289524-1e85c7b6c299?auto=format&fit=crop&q=80&w=200', // Classical Male Statue
    'https://images.unsplash.com/photo-1555992336-fb9d29493b13?auto=format&fit=crop&q=80&w=200', // Acropolis/Parthenon
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=200', // Santorini Blue Dome
    // Removed problematic URL
    'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=200', // Greek Vase/Art
    'https://images.unsplash.com/photo-1599707367072-cd6ad663325d?auto=format&fit=crop&q=80&w=200', // Bust of Homer/Philosopher
    'https://images.unsplash.com/photo-1576504677634-06b2130bd1f3?auto=format&fit=crop&q=80&w=200', // Classical Sculpture
    'https://images.unsplash.com/photo-1525641855721-6f4963066356?auto=format&fit=crop&q=80&w=200', // Greek Landscape/Ruins
];

/**
 * 获取随机默认头像
 */
const getRandomAvatar = (): string => {
    const index = Math.floor(Math.random() * DEFAULT_AVATARS.length);
    return DEFAULT_AVATARS[index];
};

/**
 * 登录服务 (集成 Supabase)
 */
export const loginService = async (email: string, password: string): Promise<AuthResponse> => {
    // 优先尝试使用 Supabase
    // 检查是否配置了 Supabase (简单的检查 URL 是否包含 'supabase')
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('supabase');

    if (isSupabaseConfigured) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, message: error.message };
            }

            if (data.user) {
                return { 
                    success: true, 
                    data: {
                        id: data.user.id,
                        name: data.user.user_metadata.name || email.split('@')[0],
                        email: data.user.email || '',
                        avatar: data.user.user_metadata.avatar_url || getRandomAvatar(), // Random Default
                        token: data.session?.access_token
                    }
                };
            }
        } catch (e) {
            console.error("Supabase Login Error:", e);
            return { success: false, message: '登录服务异常' };
        }
    }

    // 1. 如果配置了使用真实API (自定义后端)
    if (USE_REAL_API && !isSupabaseConfigured) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            
            const result = await response.json();
            if (response.ok) {
                return { success: true, data: result.user };
            } else {
                return { success: false, message: result.message || '登录失败' };
            }
        } catch (error) {
            console.error("Login API Error:", error);
            return { success: false, message: '无法连接到服务器，请检查网络或配置' };
        }
    }

    // 2. 否则使用模拟数据 (Mock)
    return new Promise((resolve) => {
        setTimeout(() => {
            if (password.length < 6) {
                resolve({ success: false, message: '密码长度至少需要6位' });
                return;
            }
            // 模拟成功
            const mockUser: User = {
                id: 'user-' + Date.now(),
                name: email.split('@')[0],
                email: email,
                avatar: getRandomAvatar(),
                token: 'mock-jwt-token-' + Date.now()
            };
            resolve({ success: true, data: mockUser });
        }, 1500);
    });
};

/**
 * 注册服务 (集成 Supabase)
 */
export const registerService = async (email: string, password: string, name: string): Promise<AuthResponse> => {
    // 优先尝试使用 Supabase
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('supabase');

    if (isSupabaseConfigured) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        avatar_url: getRandomAvatar()
                    }
                }
            });

            if (error) {
                return { success: false, message: error.message };
            }

            if (data.user) {
                // 注意：Supabase 默认可能需要邮箱验证，如果开启了邮箱验证，此时可能没有 session
                // 这里我们假设为了体验，您可能关闭了邮箱验证，或者接受“请去邮箱验证”的提示
                if (!data.session) {
                    return { success: false, message: '注册成功！请前往邮箱查收验证邮件以完成登录。' };
                }

                return { 
                    success: true, 
                    data: {
                        id: data.user.id,
                        name: name,
                        email: email,
                        avatar: data.user.user_metadata.avatar_url || getRandomAvatar(), // Random Default
                        token: data.session?.access_token
                    }
                };
            }
        } catch (e) {
            console.error("Supabase Register Error:", e);
            return { success: false, message: '注册服务异常' };
        }
    }

    // 1. 如果配置了使用真实API
    if (USE_REAL_API && !isSupabaseConfigured) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, name }),
            });
            
            const result = await response.json();
            if (response.ok) {
                return { success: true, data: result.user };
            } else {
                return { success: false, message: result.message || '注册失败' };
            }
        } catch (error) {
            console.error("Register API Error:", error);
            return { success: false, message: '无法连接到服务器，请检查网络或配置' };
        }
    }

    // 2. 否则使用模拟数据 (Mock)
    return new Promise((resolve) => {
        setTimeout(() => {
            if (password.length < 6) {
                resolve({ success: false, message: '密码长度至少需要6位' });
                return;
            }
            // 模拟成功
            const mockUser: User = {
                id: 'user-' + Date.now(),
                name: name || '新用户',
                email: email,
                avatar: getRandomAvatar(),
                token: 'mock-jwt-token-' + Date.now()
            };
            resolve({ success: true, data: mockUser });
        }, 1500);
    });
};
