import React, { useState, useRef } from 'react';
import { MapPin, Camera, Mic, Play, MoreHorizontal, X, ScanText, Box, Sparkles, Plus } from 'lucide-react';

// Types for the interaction flow
type InteractionStep = 'idle' | 'mode-select' | 'upload' | 'analyzing' | 'result';
type UploadMode = 'plaque' | 'artifact' | null;

const Guide: React.FC = () => {
  // State
  const [step, setStep] = useState<InteractionStep>('idle');
  const [mode, setMode] = useState<UploadMode>(null);
  const [images, setImages] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<{
    title: string;
    subtitle: string;
    description: string;
    tags: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleCameraClick = () => {
    setStep('mode-select');
  };

  const handleModeSelect = (selectedMode: UploadMode) => {
    setMode(selectedMode);
    setStep('upload');
    // Reset images when starting fresh
    setImages([]);
    // Automatically trigger file selection
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const handleStartAnalysis = () => {
    setStep('analyzing');
    // Simulate AI analysis
    setTimeout(() => {
      setAnalysisResult({
        title: mode === 'plaque' ? '汉谟拉比法典 (译文)' : '萨莫色雷斯的胜利女神',
        subtitle: mode === 'plaque' ? '公元前1754年 · 巴比伦' : '公元前190年 · 希腊化时期',
        description: mode === 'plaque' 
          ? '根据您拍摄的铭牌内容，这是世界上现存最古老、最完整的成文法典之一。铭文详细规定了刑事、民事、贸易、婚姻、继承、审判等制度，反映了古巴比伦社会政治经济情况。AI已为您提取了关键法律条文的现代译文...'
          : '根据视觉识别，这是卢浮宫镇馆之宝之一。雕像描绘了带有羽翼的胜利女神，飘逸的衣裙和展翅欲飞的姿态展现了极高的艺术造诣。结合您所在的德农馆位置信息，这尊雕像通常位于达鲁楼梯的尽头...',
        tags: mode === 'plaque' ? ['楔形文字', '法律历史', '王权神授'] : ['希腊艺术', '大理石雕塑', '海战胜利']
      });
      setStep('result');
    }, 2500);
  };

  const handleClose = () => {
    setStep('idle');
    setMode(null);
    setImages([]);
    setAnalysisResult(null);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 text-stone-800 relative overflow-hidden">
      {/* Background Map Placeholder (Same as before) */}
      <div className="absolute inset-0 bg-stone-200 z-0 flex items-center justify-center">
        <div className="text-stone-400 font-serif text-xl">Map View Placeholder</div>
        <div className="absolute top-1/3 left-1/4 bg-stone-900 text-white p-2 rounded-lg shadow-lg flex items-center transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-xs font-bold">您在这里</span>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-stone-900 rotate-45"></div>
        </div>
      </div>

      {/* Top Bar (Same as before) */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start bg-gradient-to-b from-white/90 to-transparent pt-12">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm flex items-center space-x-2 border border-white/50">
           <MapPin size={16} className="text-stone-600" />
           <span className="text-sm font-medium text-stone-800">卢浮宫 · 德农馆 1F</span>
        </div>
      </div>

      {/* Bottom Controls (Only visible when idle) */}
      {step === 'idle' && (
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10 space-y-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Current Exhibit Card */}
          <div className="bg-white rounded-xl shadow-lg p-4 border border-stone-100 flex items-center space-x-4">
              <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/640px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg" 
                  alt="Mona Lisa" 
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-stone-900 truncate">蒙娜丽莎</h3>
                  <p className="text-xs text-stone-500 truncate">列奥纳多·达·芬奇 · 油画</p>
                  <div className="flex items-center mt-2 space-x-2">
                      <button className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center text-white">
                          <Play size={12} fill="white" />
                      </button>
                      <div className="flex-1 h-1 bg-stone-200 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-stone-900"></div>
                      </div>
                      <span className="text-xs text-stone-400 font-mono">02:15</span>
                  </div>
              </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center px-4 pb-2">
              <button className="flex flex-col items-center space-y-1 text-stone-600">
                  <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-stone-100">
                      <MoreHorizontal size={24} />
                  </div>
                  <span className="text-xs font-medium text-white shadow-black drop-shadow-md">更多</span>
              </button>

              <button 
                onClick={handleCameraClick}
                className="flex flex-col items-center space-y-1 -mt-6 active:scale-95 transition-transform"
              >
                   <div className="w-16 h-16 bg-stone-900 rounded-full shadow-xl flex items-center justify-center border-4 border-white/20">
                      <Camera size={28} className="text-white" />
                  </div>
                   <span className="text-xs font-medium text-white shadow-black drop-shadow-md">拍照识别</span>
              </button>

              <button className="flex flex-col items-center space-y-1 text-stone-600">
                   <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-stone-100">
                      <Mic size={24} />
                  </div>
                  <span className="text-xs font-medium text-white shadow-black drop-shadow-md">语音提问</span>
              </button>
          </div>
        </div>
      )}

      {/* Overlay for Camera Interaction */}
      {step !== 'idle' && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center">
              <h2 className="text-lg font-bold font-serif text-stone-900">
                {step === 'mode-select' && '选择识别模式'}
                {step === 'upload' && '上传图片'}
                {step === 'analyzing' && 'AI 正在思考...'}
                {step === 'result' && 'AI 解说'}
              </h2>
              <button onClick={handleClose} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
                <X size={18} className="text-stone-600" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 min-h-[300px] max-h-[70vh] overflow-y-auto">
              
              {/* Step 1: Mode Selection */}
              {step === 'mode-select' && (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleModeSelect('plaque')}
                    className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-2xl border-2 border-transparent hover:border-amber-500 hover:bg-amber-50 transition-all active:scale-95"
                  >
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                      <ScanText size={32} />
                    </div>
                    <span className="font-bold text-stone-900">拍摄铭牌</span>
                    <span className="text-xs text-stone-500 mt-2 text-center">识别文字说明<br/>获取深度翻译</span>
                  </button>
                  
                  <button 
                    onClick={() => handleModeSelect('artifact')}
                    className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-2xl border-2 border-transparent hover:border-emerald-500 hover:bg-emerald-50 transition-all active:scale-95"
                  >
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                      <Box size={32} />
                    </div>
                    <span className="font-bold text-stone-900">拍摄文物</span>
                    <span className="text-xs text-stone-500 mt-2 text-center">视觉识别外观<br/>匹配馆藏信息</span>
                  </button>
                </div>
              )}

              {/* Step 2: Upload & Preview */}
              {step === 'upload' && (
                <div className="space-y-6">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  
                  {images.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-stone-400">正在调起相机...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {images.map((src, index) => (
                        <div key={index} className="aspect-square rounded-xl overflow-hidden relative shadow-sm">
                          <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 hover:border-stone-500 hover:text-stone-600 transition-colors"
                      >
                        <Plus size={24} />
                        <span className="text-xs mt-1">加一张</span>
                      </button>
                    </div>
                  )}

                  <div className="pt-4">
                    <button 
                      onClick={handleStartAnalysis}
                      disabled={images.length === 0}
                      className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                    >
                      <Sparkles size={18} />
                      <span>开始 AI 解说</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Analyzing */}
              {step === 'analyzing' && (
                <div className="flex flex-col items-center justify-center py-10 space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-stone-100 rounded-full"></div>
                    <div className="w-20 h-20 border-4 border-stone-900 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-stone-900">
                      <Sparkles size={24} className="animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-bold text-stone-900">AI 正在解析视觉信息...</h3>
                    <p className="text-sm text-stone-500">
                      正在结合 <span className="text-amber-600 font-medium">卢浮宫 · 德农馆</span> 的馆藏数据
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Result */}
              {step === 'result' && analysisResult && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-start space-x-4">
                    <div className="w-24 h-24 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                      <img src={images[0]} alt="Result" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-serif text-stone-900 leading-tight mb-1">
                        {analysisResult.title}
                      </h3>
                      <p className="text-sm text-stone-500 mb-3">{analysisResult.subtitle}</p>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.tags.map(tag => (
                          <span key={tag} className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                    <div className="flex items-center space-x-2 mb-3">
                      <Sparkles size={16} className="text-amber-500" />
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">AI 智能解说</span>
                    </div>
                    <p className="text-stone-700 leading-relaxed text-sm">
                      {analysisResult.description}
                    </p>
                  </div>

                  <div className="flex space-x-3">
                     <button className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-medium shadow-md flex items-center justify-center space-x-2">
                        <Play size={18} fill="white" />
                        <span>播放语音</span>
                     </button>
                     <button className="px-4 py-3 bg-white border border-stone-200 text-stone-600 rounded-xl font-medium shadow-sm">
                        <MoreHorizontal size={20} />
                     </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Guide;
