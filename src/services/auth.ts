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

const toZhAuthErrorMessage = (rawMessage: string, mode: 'login' | 'register' | 'delete'): string => {
    const msg = (rawMessage || '').trim();
    const lower = msg.toLowerCase();

    if (lower.includes('invalid login credentials')) {
        if (mode === 'login') {
            return '登录失败：该邮箱可能尚未注册，或密码不正确。若你确定邮箱已注册，请检查密码；若未注册，请切换到「立即注册」。';
        }
        return '邮箱或密码不正确，请检查后重试。';
    }

    if (lower.includes('email not confirmed')) {
        return '该邮箱尚未完成验证。请前往邮箱查收验证邮件，完成验证后再登录。';
    }

    if (lower.includes('user already registered') || lower.includes('already registered') || lower.includes('already exists')) {
        if (mode === 'register') {
            return '这个邮箱已经注册过了：请切换到「去登录」直接登录即可。';
        }
        return '该邮箱已注册，请直接登录。';
    }

    if (lower.includes('password') && (lower.includes('at least') || lower.includes('6'))) {
        return '密码不符合要求：请设置至少 6 位密码。';
    }

    if (lower.includes('email') && lower.includes('invalid')) {
        return '邮箱格式不正确：请检查是否输入了正确的邮箱地址。';
    }

    if (lower.includes('rate limit') || lower.includes('too many')) {
        return '操作太频繁了：请稍等片刻再试。';
    }

    if (lower.includes('failed to fetch') || lower.includes('network')) {
        return '网络异常：请检查网络连接后重试。';
    }

    if (mode === 'login') return msg || '登录失败，请稍后重试。';
    if (mode === 'register') return msg || '注册失败，请稍后重试。';
    return msg || '操作失败，请稍后重试。';
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
                return { success: false, message: toZhAuthErrorMessage(error.message, 'login') };
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

export const isEmailRegisteredService = async (email: string): Promise<{ success: boolean; registered?: boolean; message?: string }> => {
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('supabase');

    if (!isSupabaseConfigured) return { success: true, registered: false };

    try {
        const { data, error } = await supabase.rpc('is_email_registered', { p_email: email });
        if (error) {
            if (error.code === 'PGRST202' || error.message.toLowerCase().includes('could not find the function')) {
                return { success: false, message: '后端未启用邮箱校验函数' };
            }
            return { success: false, message: error.message };
        }
        return { success: true, registered: Boolean(data) };
    } catch (e) {
        console.error('Supabase isEmailRegistered Error:', e);
        return { success: false, message: '邮箱校验服务异常' };
    }
};

export const isNicknameTakenService = async (name: string): Promise<{ success: boolean; taken?: boolean; message?: string }> => {
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('supabase');

    if (!isSupabaseConfigured) return { success: true, taken: false };

    try {
        const { data, error } = await supabase.rpc('is_nickname_taken', { p_name: name });
        if (error) {
            if (error.code === 'PGRST202' || error.message.toLowerCase().includes('could not find the function')) {
                return { success: false, message: '后端未启用昵称校验函数' };
            }
            return { success: false, message: error.message };
        }
        return { success: true, taken: Boolean(data) };
    } catch (e) {
        console.error('Supabase isNicknameTaken Error:', e);
        return { success: false, message: '昵称校验服务异常' };
    }
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
                return { success: false, message: toZhAuthErrorMessage(error.message, 'register') };
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

/**
 * 删除用户账号 (注销)
 */
export const deleteAccountService = async (userId: string): Promise<AuthResponse> => {
    void userId;
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('supabase');

    if (isSupabaseConfigured) {
        try {
            // 注意：Supabase Client SDK 默认不允许直接删除用户 (admin only)
            // 通常需要通过 Edge Function 或 RPC 调用
            // 这里我们尝试调用 RPC 函数 'delete_user'，需要在 Supabase 数据库中预先创建此函数
            // 或者，如果启用了允许用户删除自己的 RLS 策略，可以直接操作 users 表（但不推荐）
            
            // 方案 A: 使用 RPC (推荐)
            // CREATE OR REPLACE FUNCTION delete_user()
            // RETURNS void AS $$
            // BEGIN
            //   DELETE FROM auth.users WHERE id = auth.uid();
            // END;
            // $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            const { error } = await supabase.rpc('delete_user');

            if (error) {
                console.error("Supabase Delete Account Error (RPC):", error);
                // 如果 RPC 失败（可能未设置），尝试方案 B：手动清除相关数据并退出
                // 仅供演示，实际生产环境必须确保用户数据被物理删除
                // return { success: false, message: '注销失败：需要服务端支持' };
                
                // Fallback: 仅清除当前会话，模拟注销
                // await supabase.auth.signOut();
                // return { success: true };
                return { success: false, message: toZhAuthErrorMessage(error.message, 'delete') };
            }

            // 成功删除后，Supabase 会自动处理 signOut
            await supabase.auth.signOut();
            return { success: true };

        } catch (e) {
            console.error("Supabase Delete Account Error:", e);
            return { success: false, message: '注销服务异常' };
        }
    }

    // Mock 模式
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true });
        }, 1000);
    });
};
