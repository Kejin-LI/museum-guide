import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { APP_NAME, APP_SLOGAN_CN } from '../config';
import DustText from '../components/DustText';
import { loginService, registerService } from '../services/auth'; // Import Service

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const [error, setError] = useState('');
  // Use a classical oil painting style image (e.g., Botticelli's Birth of Venus style or similar Renaissance art)
  // Unsplash ID: photo-1577083552431-6e5fd01aa342 (Classic Art / Renaissance Portrait)
  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&q=80&w=1080');

  const handleImageError = () => {
      // Fallback to another classical art image
      setBgImage('https://images.unsplash.com/photo-1576504677634-06b2130bd1f3?auto=format&fit=crop&q=80&w=1080');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.email || !formData.password) {
        setError('请填写所有必填项');
        setIsLoading(false);
        return;
    }

    // Call Service Layer
    let result;
    if (isLogin) {
        result = await loginService(formData.email, formData.password);
    } else {
        result = await registerService(formData.email, formData.password, formData.name);
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
        setError(result.message || (isLogin ? '登录失败' : '注册失败'));
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col relative overflow-hidden w-full">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 bg-stone-800">
        <img 
          src={bgImage} 
          alt="Museum Background" 
          className="w-full h-full object-cover object-top opacity-50 transition-opacity duration-700"
          onError={handleImageError}
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

        <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-400 ml-1">昵称</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-stone-500" size={18} />
                <input 
                  type="text" 
                  placeholder="您的称呼"
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

          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-400 ml-1">密码</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-stone-500" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
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
          </div>

          {error && (
            <div className="text-red-400 text-xs px-1 animate-in fade-in">
              {error}
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
