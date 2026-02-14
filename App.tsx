
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Phase, getPhases, DEFAULT_CONSULTATION_SECONDS, TOTAL_STATION_SECONDS } from './types';
import { audioService } from './services/audioService';
import TimerDisplay from './components/TimerDisplay';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { Play, Pause, RotateCcw, SkipForward, Clock, Settings2, Repeat, Check, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [isRepeat, setIsRepeat] = useState(false);
  const [consultationDuration, setConsultationDuration] = useState(DEFAULT_CONSULTATION_SECONDS);
  const [secondsElapsedTotal, setSecondsElapsedTotal] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 초기화: 오디오 및 음원 로드
  useEffect(() => {
    // 사용자의 첫 터치 이벤트를 감지하여 오디오 컨텍스트를 활성화합니다.
    audioService.init();
    audioService.preloadAll();
  }, []);

  const phases = useMemo(() => getPhases(consultationDuration), [consultationDuration]);
  const lastAlarmRef = useRef<number | null>(null);

  const { currentPhase, elapsedInPhase, phaseIndex } = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < phases.length; i++) {
      if (secondsElapsedTotal < acc + phases[i].duration) {
        return { 
          currentPhase: phases[i], 
          elapsedInPhase: secondsElapsedTotal - acc,
          phaseIndex: i
        };
      }
      acc += phases[i].duration;
    }
    return { 
      currentPhase: phases[phases.length - 1], 
      elapsedInPhase: phases[phases.length - 1].duration,
      phaseIndex: phases.length - 1
    };
  }, [secondsElapsedTotal, phases]);

  // 알람 트리거 로직
  useEffect(() => {
    if (!isActive) return;

    const entryTime = phases[0].duration;
    const warningTime = phases[0].duration + phases[1].duration - 120;
    const consultEndTime = phases[0].duration + phases[1].duration;

    if (secondsElapsedTotal === 0 && lastAlarmRef.current !== 0) {
      lastAlarmRef.current = 0;
      audioService.playReadingStart();
    } else if (secondsElapsedTotal === entryTime && lastAlarmRef.current !== entryTime) {
      lastAlarmRef.current = entryTime;
      audioService.playRoomEntry();
    } else if (secondsElapsedTotal === warningTime && lastAlarmRef.current !== warningTime) {
      lastAlarmRef.current = warningTime;
      audioService.playTwoMinWarning();
    } else if (secondsElapsedTotal === consultEndTime && lastAlarmRef.current !== consultEndTime) {
      lastAlarmRef.current = consultEndTime;
      audioService.playConsultEnd();
    }

    if (secondsElapsedTotal >= TOTAL_STATION_SECONDS) {
      if (isRepeat) {
        setSecondsElapsedTotal(0);
        lastAlarmRef.current = null;
      } else {
        setIsActive(false);
      }
    }
  }, [secondsElapsedTotal, isActive, phases, isRepeat]);

  useEffect(() => {
    let interval: number | null = null;
    if (isActive) {
      interval = window.setInterval(() => {
        setSecondsElapsedTotal(prev => prev + 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive]);

  const handleToggle = () => {
    // 버튼 클릭 시에도 명시적으로 언락 시도 (전역 리스너가 실패했을 경우 대비)
    audioService.unlock();

    if (!isActive && (secondsElapsedTotal >= TOTAL_STATION_SECONDS || secondsElapsedTotal === 0)) {
      setSecondsElapsedTotal(0);
      lastAlarmRef.current = null;
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setSecondsElapsedTotal(0);
    lastAlarmRef.current = null;
  };

  const handleNext = () => {
    audioService.unlock();
    const nextPhaseStart = phases.slice(0, phaseIndex + 1).reduce((sum, p) => sum + p.duration, 0);
    if (nextPhaseStart < TOTAL_STATION_SECONDS) {
      setSecondsElapsedTotal(nextPhaseStart);
    } else {
      setSecondsElapsedTotal(0);
      lastAlarmRef.current = null;
      setIsActive(true);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-gradient-to-b from-[#F0F4F8] to-[#FFFFFF] flex flex-col items-center p-4 overflow-hidden touch-none relative">
      
      {/* PWA Install Inducer */}
      <PWAInstallPrompt />

      {/* App Title Header */}
      <div className="mt-4 mb-2 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-lg font-black text-slate-800 tracking-tighter flex items-center gap-2">
          <span className="text-blue-600">2026 동국의대</span>
          <span className="opacity-40">|</span>
          <span>CPX TIMER</span>
        </h1>
      </div>

      {/* Main Action Buttons (Positioned lower) */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-4 animate-in fade-in zoom-in-95 duration-700 delay-100">
        <button 
          onClick={() => {
            audioService.unlock();
            setIsRepeat(!isRepeat);
          }}
          className={`flex flex-col items-center justify-center gap-1 p-4 rounded-[24px] transition-all duration-300 border-2 ${
            isRepeat 
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
              : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'
          }`}
        >
          <Repeat className={`w-5 h-5 ${isRepeat ? 'animate-spin-slow' : ''}`} />
          <span className="text-[11px] font-black uppercase tracking-tight">반복: {isRepeat ? 'ON' : 'OFF'}</span>
        </button>

        <button 
          onClick={() => {
            audioService.unlock();
            setShowSettings(true);
          }}
          className="flex flex-col items-center justify-center gap-1 p-4 rounded-[24px] bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-200 transition-all duration-300 shadow-sm"
        >
          <Settings2 className="w-5 h-5" />
          <span className="text-[11px] font-black uppercase tracking-tight">시간 설정</span>
        </button>
      </div>

      {/* Main Timer Display */}
      <div className="w-full flex-grow flex items-center justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
        <TimerDisplay phase={currentPhase} elapsedInPhase={elapsedInPhase} />
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-4 mt-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
        <button
          onClick={handleReset}
          className="group flex items-center justify-center w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 text-slate-300 hover:text-red-500 transition-all shadow-sm active:scale-90"
        >
          <RotateCcw className="w-6 h-6 group-hover:rotate-[-45deg] transition-transform" />
        </button>

        <button
          onClick={handleToggle}
          className={`group flex items-center justify-center gap-3 px-10 py-5 rounded-[32px] font-black text-xl transition-all duration-300 active:scale-95 ${
            isActive 
              ? 'bg-slate-800 text-white shadow-xl shadow-slate-200' 
              : 'bg-blue-600 text-white shadow-xl shadow-blue-200'
          }`}
        >
          {isActive ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6" />}
          <span>{isActive ? '중지' : (secondsElapsedTotal > 0 ? '재시작' : '시작')}</span>
        </button>

        <button
          onClick={handleNext}
          className="group flex items-center justify-center w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 text-slate-300 hover:text-blue-600 transition-all shadow-sm active:scale-90"
        >
          <SkipForward className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Phase Badges */}
      <div className="flex flex-wrap justify-center gap-2 mt-6 mb-2 animate-in fade-in duration-700 delay-400">
        {phases.map((p, i) => (
          <div 
            key={p.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all duration-500 ${
              phaseIndex === i 
                ? `${p.color} ring-2 ring-offset-1 ring-blue-50 scale-105 shadow-sm` 
                : 'bg-white text-slate-300 border border-slate-100 opacity-60'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${phaseIndex === i ? p.activeColor : 'bg-slate-200'}`} />
            {p.label} <span className="opacity-50 font-bold">{p.subLabel}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-2 py-4 text-center opacity-40">
        <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Created by JM</p>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-sm p-8 shadow-2xl border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <Settings2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-800">진료 시간 설정</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {[480, 540, 600, 630, 660, 720].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      audioService.unlock();
                      setConsultationDuration(sec);
                    }}
                    className={`py-4 rounded-2xl font-black text-sm border-2 transition-all duration-300 ${
                      consultationDuration === sec 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : 'bg-slate-50 border-transparent text-slate-400'
                    }`}
                  >
                    {Math.floor(sec / 60)}분 {sec % 60 > 0 ? `${sec % 60}초` : ''}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => {
                  audioService.unlock();
                  setShowSettings(false);
                }}
                className="w-full py-5 bg-slate-800 text-white rounded-[24px] font-black text-base flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
              >
                <Check className="w-5 h-5" /> 설정 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
