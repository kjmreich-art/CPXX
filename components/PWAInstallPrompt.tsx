
import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Download } from 'lucide-react';

const PWAInstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 이미 독립형 모드로 실행 중인지 확인
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // iOS 여부 확인
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Android/Chrome 'beforeinstallprompt' 이벤트 핸들러
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS의 경우 방문 횟수나 특정 시간 후 노출 (여기서는 2초 후 자동 노출)
    if (isIOSDevice) {
      const timer = setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa_prompt_seen');
        if (!hasSeenPrompt) {
          setIsVisible(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_prompt_seen', 'true');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-slate-900 text-white rounded-[32px] p-6 shadow-2xl shadow-blue-900/20 border border-white/10 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-600/20 rounded-full blur-2xl" />
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/40">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-black text-base leading-tight">홈 화면에 추가하기</h3>
            <p className="text-slate-400 text-xs mt-1 font-medium leading-relaxed">
              앱처럼 설치하여 더 빠르고 편리하게 연습하세요.
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="space-y-3 bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
              <span className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-lg">1</span>
              하단 메뉴에서 <Share className="w-4 h-4 text-blue-400 mx-0.5 inline" /> 버튼을 누르세요.
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
              <span className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-lg">2</span>
              <PlusSquare className="w-4 h-4 text-blue-400 mx-0.5 inline" /> <span className="text-blue-400">'홈 화면에 추가'</span>를 선택하세요.
            </div>
          </div>
        ) : (
          <button 
            onClick={handleInstallClick}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            지금 설치하기
          </button>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
