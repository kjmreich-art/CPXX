
import React from 'react';
import { PhaseInfo } from '../types';

interface TimerDisplayProps {
  phase: PhaseInfo;
  elapsedInPhase: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ phase, elapsedInPhase }) => {
  const timeLeft = Math.max(0, phase.duration - elapsedInPhase);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const progress = (timeLeft / phase.duration) * 100;

  return (
    <div className="w-full max-w-[340px] bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white/60 p-8 flex flex-col items-center relative overflow-hidden group transition-all duration-500">
      {/* Decorative background element */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${phase.activeColor} opacity-20`} />
      
      <div className={`${phase.color} px-4 py-1.5 rounded-xl font-black text-[10px] tracking-widest uppercase mb-6 transition-colors duration-500`}>
        {phase.label}
      </div>
      
      <div className="mono text-[84px] sm:text-[110px] font-black text-slate-800 leading-none mb-8 flex tabular-nums tracking-tighter">
        <span className="drop-shadow-sm">{minutes.toString().padStart(2, '0')}</span>
        <span className="mx-1 text-slate-100 animate-pulse">:</span>
        <span className="drop-shadow-sm">{seconds.toString().padStart(2, '0')}</span>
      </div>

      <div className="w-full">
        <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden relative shadow-inner">
          <div 
            className={`h-full ${phase.activeColor} rounded-full transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(37,99,235,0.2)]`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-[9px] font-black text-slate-300 tracking-tighter px-0.5 uppercase">
          <span>LIMIT: {Math.floor(phase.duration / 60)}M {phase.duration % 60}S</span>
          <span>REMAINING</span>
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
