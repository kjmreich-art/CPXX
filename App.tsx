
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Phase, getPhases, DEFAULT_CONSULTATION_SECONDS, TOTAL_STATION_SECONDS } from './types';
import { audioService } from './services/audioService';
import TimerDisplay from './components/TimerDisplay';
import { Play, Pause, RotateCcw, SkipForward, Clock, Settings2, Repeat, Check } from 'lucide-react';

const App: React.FC = () => {
  const [isRepeat, setIsRepeat] = useState(false);
  const [consultationDuration, setConsultationDuration] = useState(DEFAULT_CONSULTATION_SECONDS);
  const [secondsElapsedTotal, setSecondsElapsedTotal] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const phases = useMemo(() => getPhases(consultationDuration), [consultationDuration]);
  const lastAlarmRef = useRef<number | null>(null);

  // Derived state
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

  // Alarms Logic
  useEffect(() => {
    if (!isActive) return;

    // Start of cycle (Preparation)
    if (secondsElapsedTotal === 0 && lastAlarmRef.current !== 0) {
      lastAlarmRef.current = 0;
      audioService.playBeep(440, 0.5);
    }

    // Start of Consultation (Entry)
    const entryTime = phases[0].duration;
    if (secondsElapsedTotal === entryTime && lastAlarmRef.current !== entryTime) {
      lastAlarmRef.current = entryTime;
      audioService.playDoubleBeep();
    }

    // 2 min warning (Entry + Consult - 120s)
    const warningTime = phases[0].duration + phases[1].duration - 120;
    if (secondsElapsedTotal === warningTime && lastAlarmRef.current !== warningTime) {
      lastAlarmRef.current = warningTime;
      audioService.playBeep(660, 0.8, 'square');
    }

    // End of Consultation
    const consultEndTime = phases[0].duration + phases[1].duration;
    if (secondsElapsedTotal === consultEndTime && lastAlarmRef.current !== consultEndTime) {
      lastAlarmRef.current = consultEndTime;
      audioService.playTripleBeep();
    }

    // Cycle complete
    if (secondsElapsedTotal >= TOTAL_STATION_SECONDS) {
      if (isRepeat) {
        setSecondsElapsedTotal(0);
        lastAlarmRef.current = null;
      } else {
        setIsActive(false);
        audioService.playBeep(880, 1.2);
      }
    }
  }, [secondsElapsedTotal, isActive, phases, isRepeat]);

  // Timer Tick
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
    if (!isActive && secondsElapsedTotal >= TOTAL_STATION_SECONDS) {
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
    const nextPhaseStart = phases.slice(0, phaseIndex + 1).reduce((sum, p) => sum + p.duration, 0);
    if (nextPhaseStart < TOTAL_STATION_SECONDS) {
      setSecondsElapsedTotal(nextPhaseStart);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col items-center py-12 px-6 overflow-hidden">
      {/* Header */}
      <header className="flex flex-col items-center mb-10 text-center">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="text-blue-600 w-8 h-8" />
          <h1 className="text-3xl font-black text-[#1A202C] tracking-tight">CPX Master Timer</h1>
        </div>
        <p className="text-slate-400 font-bold text-sm">졸업학년 의대생 실전 연습 도구</p>
      </header>

      {/* Top Settings Toggle */}
      <div className="flex gap-3 mb-12">
        <button 
          onClick={() => setIsRepeat(!isRepeat)}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold transition-all border ${
            isRepeat ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-100 text-slate-400'
          }`}
        >
          <Repeat className="w-4 h-4" />
          진료 반복: {isRepeat ? 'ON' : 'OFF'}
        </button>
        <button 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-all"
        >
          <Settings2 className="w-4 h-4" />
          진료 시간 설정
        </button>
      </div>

      {/* Main Timer Display */}
      <TimerDisplay phase={currentPhase} elapsedInPhase={elapsedInPhase} />

      {/* Phase Trackers (Bottom Visualizer) */}
      <div className="w-full max-w-md mt-10">
        <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 px-1">
          <span>START</span>
          <span>입실 (01:00)</span>
          <span>종료 ({Math.floor((60 + consultationDuration)/60)}:{(60 + consultationDuration)%60 === 0 ? '00' : (60 + consultationDuration)%60})</span>
          <span>RESET</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
          {phases.map((p, i) => {
            const width = (p.duration / TOTAL_STATION_SECONDS) * 100;
            const isCompleted = phaseIndex > i;
            const isCurrent = phaseIndex === i;
            return (
              <div 
                key={p.id} 
                className={`h-full transition-all duration-500 ${
                  isCompleted ? p.activeColor : (isCurrent ? `${p.activeColor} opacity-40` : 'bg-transparent')
                }`}
                style={{ width: `${width}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mt-12">
        <button
          onClick={handleToggle}
          className="group relative flex items-center justify-center gap-3 px-12 py-6 bg-blue-600 text-white rounded-[32px] font-black text-xl shadow-[0_15px_35px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 transition-all"
        >
          {isActive ? <Pause className="fill-white" /> : <Play className="fill-white" />}
          <span>{isActive ? '진료 중지' : (secondsElapsedTotal > 0 ? '다시 시작' : '연습 시작')}</span>
        </button>

        <button
          onClick={handleReset}
          className="flex items-center justify-center w-20 h-20 rounded-full bg-white border border-slate-100 text-slate-300 hover:text-red-400 hover:border-red-100 transition-all shadow-sm active:scale-90"
        >
          <RotateCcw className="w-8 h-8" />
        </button>

        <button
          onClick={handleNext}
          className="flex items-center justify-center w-20 h-20 rounded-full bg-white border border-slate-100 text-slate-300 hover:text-blue-500 hover:border-blue-100 transition-all shadow-sm active:scale-90"
        >
          <SkipForward className="w-8 h-8" />
        </button>
      </div>

      {/* Phase Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-16">
        {phases.map((p, i) => (
          <div 
            key={p.id}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              phaseIndex === i ? 'ring-2 ring-offset-2 ring-blue-100 scale-105' : 'opacity-60'
            } ${p.color}`}
          >
            <div className={`w-2 h-2 rounded-full ${p.activeColor}`} />
            {p.label} ({p.id === Phase.CONSULTATION ? `${Math.floor(consultationDuration / 60)}분 ${consultationDuration % 60}초` : `${Math.floor(p.duration / 60)}분`})
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-20 text-[11px] font-black text-slate-300 tracking-[0.2em] uppercase">
        Medical Practice Solution • CPX 15m Cycle
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[40px] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-8">
              <Settings2 className="text-blue-600" />
              <h2 className="text-xl font-black text-slate-800">진료 시간 설정</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">진료 시간 선택</label>
                <div className="grid grid-cols-2 gap-3">
                  {[480, 540, 600, 630, 660, 720].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setConsultationDuration(sec)}
                      className={`py-4 rounded-2xl font-bold text-sm border transition-all ${
                        consultationDuration === sec 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                          : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {Math.floor(sec / 60)}분 {sec % 60 > 0 ? `${sec % 60}초` : ''}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" /> 설정 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
