
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
    <div className="w-full max-w-md bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 p-10 flex flex-col items-center transition-all duration-500">
      <div className="text-blue-400 font-bold text-sm tracking-wider mb-6 flex items-center gap-2">
        {phase.label} <span className="opacity-50 text-[10px] font-medium">{phase.subLabel}</span>
      </div>
      
      <div className="mono text-[100px] font-black text-[#2D3748] leading-none mb-10 flex tabular-nums">
        <span>{minutes.toString().padStart(2, '0')}</span>
        <span className="mx-1 text-slate-200">:</span>
        <span>{seconds.toString().padStart(2, '0')}</span>
      </div>

      <div className="w-full mb-2">
        <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-[11px] font-bold text-slate-400">
          <span>{Math.floor(phase.duration / 60).toString().padStart(2, '0')}:{(phase.duration % 60).toString().padStart(2, '0')}</span>
          <span>00:00</span>
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
