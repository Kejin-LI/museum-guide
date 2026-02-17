import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import DustText from '../components/DustText';
import { APP_NAME } from '../config';
import { supabase } from '../lib/supabase';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          params.delete('code');
          params.delete('reset');
          const nextUrl = `${window.location.origin}${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}#/reset-password`;
          window.history.replaceState({}, '', nextUrl);
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setError('链接无效或已过期：请返回登录页重新发送“忘记密码”邮件。');
        }
      } catch {
        setError('链接无效或已过期：请返回登录页重新发送“忘记密码”邮件。');
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, []);

  const variant: 'success' | 'danger' | 'info' = success ? 'success' : (error ? 'danger' : 'info');
  const bannerText = success || error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (password.length < 8 || !hasLower || !hasUpper || !hasNumber) {
      setError('新密码需要更“硬核”一点：至少 8 位，并且同时包含大写字母、小写字母和数字。');
      return;
    }
    if (password !== password2) {
      setError('两次输入的密码不一致：请再检查一下。');
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError('修改失败：链接可能已过期，请返回登录页重新发送重置邮件。');
      return;
    }

    setSuccess('密码已更新：现在你可以用新密码重新登录啦。');
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col relative overflow-hidden w-full">
      <div className="absolute inset-0 z-0 bg-stone-800">
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/70 to-stone-900/30"></div>
      </div>

      <div className="flex-1 flex flex-col justify-end px-8 pb-10 relative z-10 max-w-md mx-auto w-full">
        <div className="mb-8 flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-serif font-bold text-white tracking-wide">重置密码</h1>
          <h2 className="text-lg font-light text-stone-300 mt-3 tracking-widest uppercase font-sans">{APP_NAME}</h2>
          <div className="w-12 h-0.5 bg-amber-500/50 my-6"></div>
          <DustText text="把门票补一张，继续进馆" className="text-stone-400 text-xs font-serif italic tracking-wider" />
        </div>

        {bannerText && (
          <div
            className={[
              'rounded-xl px-3 py-2 border backdrop-blur-sm flex items-start gap-2 animate-in fade-in mb-4',
              variant === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-100'
                : variant === 'info'
                  ? 'bg-amber-500/10 border-amber-500/15 text-amber-100'
                  : 'bg-rose-500/10 border-rose-500/15 text-rose-100',
            ].join(' ')}
            role="status"
            aria-live="polite"
          >
            <AlertCircle
              size={16}
              className={
                variant === 'success'
                  ? 'text-emerald-400 mt-0.5'
                  : variant === 'info'
                    ? 'text-amber-400 mt-0.5'
                    : 'text-rose-400 mt-0.5'
              }
            />
            <div className="text-xs leading-relaxed">{bannerText}</div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-stone-400">
            <Loader2 size={18} className="animate-spin mr-2" />
            <span className="text-sm">正在验证链接…</span>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-400 ml-1">新密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-stone-500" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="至少 8 位，含大小写字母 + 数字"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-800/50 border border-stone-700 rounded-xl py-3 pl-11 pr-12 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all backdrop-blur-sm"
                  disabled={Boolean(error) && error.includes('链接无效')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-400 ml-1">确认新密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-stone-500" size={18} />
                <input
                  type={showPassword2 ? 'text' : 'password'}
                  placeholder="再输入一次，别让自己绊倒"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="w-full bg-stone-800/50 border border-stone-700 rounded-xl py-3 pl-11 pr-12 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all backdrop-blur-sm"
                  disabled={Boolean(error) && error.includes('链接无效')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2(!showPassword2)}
                  className="absolute right-4 top-3.5 text-stone-500 hover:text-stone-300"
                >
                  {showPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || Boolean(error) && error.includes('链接无效')}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-900/20 active:scale-[0.98] transition-all flex items-center justify-center mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : '确认修改'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/auth', { replace: true })}
                className="text-stone-500 text-sm hover:text-stone-300 transition-colors"
              >
                返回登录
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

