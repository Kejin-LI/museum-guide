import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { APP_NAME, APP_SLOGAN_CN } from '../config';
import DustText from '../components/DustText';
import { loginService, registerService, isEmailRegisteredService, isNicknameTakenService, sendEmailCodeService, registerWithEmailCodeService, sendPasswordResetEmailService } from '../services/auth'; // Import Service

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (codeCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCodeCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [codeCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const email = formData.email.trim();
    const password = formData.password;
    const name = formData.name.trim();

    const missingFields: string[] = [];
    if (!email) missingFields.push('邮箱');
    if (!password) missingFields.push('密码');
    if (!isLogin && !name) missingFields.push('昵称');

    if (missingFields.length > 0) {
      setError(`请先填写完整：${missingFields.join('、')}`);
      setIsLoading(false);
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      setError('邮箱格式不正确：请检查是否输入了正确的邮箱地址（例如 name@example.com）');
      setIsLoading(false);
      return;
    }

    if (!isLogin) {
      if (name.length < 6) {
        setError('昵称太短啦：至少需要 6 个字符（比如“文博小达人”）。');
        setIsLoading(false);
        return;
      }

      const hasLower = /[a-z]/.test(password);
      const hasUpper = /[A-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      if (password.length < 8 || !hasLower || !hasUpper || !hasNumber) {
        setError('密码需要更“硬核”一点：至少 8 位，并且同时包含大写字母、小写字母和数字。');
        setIsLoading(false);
        return;
      }

      const nicknameCheck = await isNicknameTakenService(name);
      if (!nicknameCheck.success) {
        setError(nicknameCheck.message || '昵称校验失败，请稍后重试');
        setIsLoading(false);
        return;
      }
      if (nicknameCheck.taken) {
        setError('这个昵称已经被别人抢先一步用了。换一个更独特的称呼再来寻迹吧～');
        setIsLoading(false);
        return;
      }

      const code = emailCode.trim();
      if (!/^\d{6}$/.test(code)) {
        setError('请输入 6 位验证码（数字）。如果还没收到，可以先点「发送验证码」。');
        setIsLoading(false);
        return;
      }
    }

    let emailRegistered: boolean | undefined = undefined;
    if (isLogin) {
      const emailCheck = await isEmailRegisteredService(email);
      if (emailCheck.success && emailCheck.registered === false) {
        setIsLogin(false);
        setError('这个邮箱还没注册，我们已经帮你切到「注册」了：给它取个昵称就能继续寻迹～');
        setIsLoading(false);
        return;
      }
      if (emailCheck.success) emailRegistered = emailCheck.registered;
    }

    // Call Service Layer
    let result;
    if (isLogin) {
        result = await loginService(email, password);
    } else {
        result = await registerWithEmailCodeService(email, password, name, emailCode.trim());
        if (!result.success && result.message && result.message.includes('未配置 Supabase')) {
          result = await registerService(email, password, name);
        }
    }

    setIsLoading(false);

    if (result.success && result.data) {
        // Save user to LocalStorage
        localStorage.setItem('museum_user', JSON.stringify(result.data));
        if (result.data.token) {
            localStorage.setItem('museum_token', result.data.token);
        }
        
        navigate('/profile', { replace: true });
    } else {
        if (isLogin && emailRegistered === true) {
          setError('登录失败：这个邮箱已注册，但密码不匹配。请检查邮箱/密码是否输入正确（注意大小写与空格）。');
        } else {
          setError(result.message || (isLogin ? '登录失败' : '注册失败'));
        }
    }
  };

  const errorVariant: 'success' | 'info' | 'danger' =
    error.includes('注册成功') || error.includes('验证邮件')
      ? 'success'
      : (error.includes('验证码已发送') || error.includes('重置邮件已发送') || error.includes('还没注册') || error.includes('切到「注册」') ? 'info' : 'danger');

  const handleSendCode = async () => {
    const email = formData.email.trim();
    setError('');

    if (!email) {
      setError('请先填写邮箱，再发送验证码。');
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      setError('邮箱格式不正确：请先输入正确邮箱后再发送验证码。');
      return;
    }

    if (codeCooldown > 0 || isSendingCode) return;

    setIsSendingCode(true);
    const emailCheck = await isEmailRegisteredService(email);
    if (emailCheck.success && emailCheck.registered === true) {
      setIsLogin(true);
      setIsSendingCode(false);
      setError('这个邮箱已经注册过啦：我们已帮你切到「登录」。如果忘记密码，需要去 Supabase 控制台重置。');
      return;
    }

    const res = await sendEmailCodeService(email);
    setIsSendingCode(false);

    if (res.success) {
      setCodeCooldown(60);
      setError(res.message || '验证码已发送，请查收邮箱。');
      return;
    }

    setError(res.message || '验证码发送失败，请稍后重试。');
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col relative overflow-hidden w-full">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 bg-stone-800">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(900px 520px at 20% 10%, rgba(245,158,11,0.22), transparent 60%), radial-gradient(900px 520px at 80% 20%, rgba(14,116,144,0.18), transparent 60%), linear-gradient(135deg, rgba(15,23,42,1), rgba(17,24,39,1))',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent"></div>
      </div>

      <div className="flex-1 flex flex-col justify-end px-8 pb-10 relative z-10 max-w-md mx-auto w-full">
        <div className="mb-8 flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-center mb-3">
            <h1 className="text-5xl font-serif font-bold text-white tracking-wide">
              寻迹之旅
            </h1>
          </div>
          <h2 className="text-lg font-light text-stone-300 mb-6 tracking-widest uppercase font-sans">
            {APP_NAME}
          </h2>
          <div className="w-12 h-0.5 bg-amber-500/50 mb-6"></div>
          <DustText 
            text={APP_SLOGAN_CN} 
            className="text-stone-400 text-xs font-serif italic tracking-wider" 
          />
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-400 ml-1">昵称</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-stone-500" size={18} />
                <input 
                  type="text" 
                  placeholder="您的称呼（至少 6 个字符）"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-stone-800/50 border border-stone-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all backdrop-blur-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-400 ml-1">邮箱</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-stone-500" size={18} />
              <input 
                type="email" 
                placeholder="name@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-stone-800/50 border border-stone-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all backdrop-blur-sm"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-400 ml-1">验证码</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6 位数字"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                    className="w-full bg-stone-800/50 border border-stone-700 rounded-xl py-3 px-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all backdrop-blur-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode || codeCooldown > 0}
                  className={[
                    'px-4 py-3 rounded-xl text-sm font-medium border transition-all active:scale-[0.98] whitespace-nowrap',
                    isSendingCode || codeCooldown > 0
                      ? 'bg-stone-800/40 text-stone-500 border-stone-700 cursor-not-allowed'
                      : 'bg-stone-800/60 text-amber-200 border-stone-700 hover:border-amber-500/50 hover:text-amber-100',
                  ].join(' ')}
                >
                  {isSendingCode ? '发送中…' : (codeCooldown > 0 ? `${codeCooldown}s` : '发送验证码')}
                </button>
              </div>
              <div className="text-[11px] text-stone-500 px-1">
                注册需要验证码，避免邮箱被“误写”成别人家的。
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-400 ml-1">密码</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-stone-500" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                placeholder={isLogin ? "••••••••" : "至少 8 位，含大小写字母 + 数字"}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-stone-800/50 border border-stone-700 rounded-xl py-3 pl-11 pr-12 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all backdrop-blur-sm"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-stone-500 hover:text-stone-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {isLogin && (
              <div className="flex justify-end px-1 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    const email = formData.email.trim();
                    setError('');
                    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                    if (!email) {
                      setError('请先填写邮箱，我们才能把重置邮件送到你那里。');
                      return;
                    }
                    if (!emailOk) {
                      setError('邮箱格式不正确：请先输入正确邮箱，再发送重置邮件。');
                      return;
                    }
                    const emailCheck = await isEmailRegisteredService(email);
                    if (emailCheck.success && emailCheck.registered === false) {
                      setIsLogin(false);
                      setError('这个邮箱还没注册：我们已帮你切到「注册」。先注册，之后才能使用“忘记密码”哦。');
                      return;
                    }
                    const res = await sendPasswordResetEmailService(email);
                    setError(res.message || (res.success ? '重置邮件已发送，请查收邮箱。' : '重置邮件发送失败，请稍后重试。'));
                  }}
                  className="text-xs text-stone-400 hover:text-amber-300 transition-colors"
                >
                  忘记密码？
                </button>
              </div>
            )}
          </div>

          {error && (
            <div
              className={[
                'rounded-xl px-3 py-2 border backdrop-blur-sm flex items-start gap-2 animate-in fade-in',
                errorVariant === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-100'
                  : errorVariant === 'info'
                    ? 'bg-amber-500/10 border-amber-500/15 text-amber-100'
                    : 'bg-rose-500/10 border-rose-500/15 text-rose-100',
              ].join(' ')}
              role="status"
              aria-live="polite"
            >
              <AlertCircle
                size={16}
                className={
                  errorVariant === 'success'
                    ? 'text-emerald-400 mt-0.5'
                    : errorVariant === 'info'
                      ? 'text-amber-400 mt-0.5'
                      : 'text-rose-400 mt-0.5'
                }
              />
              <div className="text-xs leading-relaxed">
                {error}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-900/20 active:scale-[0.98] transition-all flex items-center justify-center mt-6"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {isLogin ? '登录' : '注册'}
                <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center animate-in fade-in duration-700 delay-300">
          <p className="text-stone-500 text-sm">
            {isLogin ? '还没有账号？' : '已有账号？'}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setEmailCode('');
                setCodeCooldown(0);
              }}
              className="text-amber-500 font-medium ml-2 hover:text-amber-400 transition-colors"
            >
              {isLogin ? '立即注册' : '去登录'}
            </button>
          </p>
        </div>
      </div>

      <div className="p-8 text-center relative z-10 animate-in fade-in duration-700 delay-500 pt-0">
        <button 
          onClick={() => navigate('/')}
          className="text-stone-500 text-sm hover:text-stone-300 transition-colors"
        >
          先逛逛，暂不登录
        </button>
      </div>
    </div>
  );
};

export default Auth;
