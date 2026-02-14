

import React from 'react';
// Corrected PHASES to Phase and imported missing members
import { Phase, TOTAL_CYCLE_SECONDS, ALARM_TIMESTAMPS } from '../types';

interface TimelineProps {
  secondsElapsed: number;
}

const Timeline: React.FC<TimelineProps> = ({ secondsElapsed }) => {
  return (
    <div className="w-full max-w-xl mt-12 px-4">
      <div className="relative h-2 bg-slate-200 rounded-full">
        {/* Progress Bar Overlay */}
        <div 
          className="absolute h-full bg-blue-600 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${(secondsElapsed / TOTAL_CYCLE_SECONDS) * 100}%` }}
        />

        {/* Alarm Markers */}
        {ALARM_TIMESTAMPS.map((ts, idx) => (
          <div 
            key={idx}
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${secondsElapsed >= ts ? 'bg-blue-600' : 'bg-slate-400'}`}
            style={{ left: `${(ts / TOTAL_CYCLE_SECONDS) * 100}%` }}
            title={`${Math.floor(ts / 60)}분 ${ts % 60}초 알람`}
          />
        ))}
      </div>

      <div className="flex justify-between mt-4 text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
        <span>시작</span>
        <span style={{ marginLeft: '6.6%' }}>입실</span>
        <span style={{ marginLeft: '50%' }}>마무리</span>
        <span style={{ marginLeft: '6%' }}>진료종료</span>
        <span className="ml-auto">전체종료</span>
      </div>
    </div>
  );
};

export default Timeline;