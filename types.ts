
export enum Phase {
  PREPARATION = 'SITUATION_READING',
  CONSULTATION = 'CONSULTATION',
  FEEDBACK = 'FEEDBACK_PHASE'
}

export interface PhaseInfo {
  id: Phase;
  label: string;
  subLabel: string;
  duration: number; // in seconds
  color: string;
  activeColor: string;
}

export const DEFAULT_CONSULTATION_SECONDS = 630; // 10m 30s
export const PREPARATION_SECONDS = 60; // 1m
export const TOTAL_STATION_SECONDS = 900; // 15m

// Add TOTAL_CYCLE_SECONDS and ALARM_TIMESTAMPS for Timeline component
export const TOTAL_CYCLE_SECONDS = TOTAL_STATION_SECONDS;
export const ALARM_TIMESTAMPS = [
  0, 
  PREPARATION_SECONDS, 
  PREPARATION_SECONDS + DEFAULT_CONSULTATION_SECONDS - 120,
  PREPARATION_SECONDS + DEFAULT_CONSULTATION_SECONDS
];

export const getPhases = (consultationDuration: number): PhaseInfo[] => {
  const feedbackDuration = TOTAL_STATION_SECONDS - PREPARATION_SECONDS - consultationDuration;
  
  return [
    {
      id: Phase.PREPARATION,
      label: '상황 숙지',
      subLabel: '(1분)',
      duration: PREPARATION_SECONDS,
      color: 'bg-blue-100 text-blue-600',
      activeColor: 'bg-blue-600'
    },
    {
      id: Phase.CONSULTATION,
      label: '진료',
      subLabel: `(${Math.floor(consultationDuration / 60)}분 ${consultationDuration % 60}초)`,
      duration: consultationDuration,
      color: 'bg-emerald-100 text-emerald-600',
      activeColor: 'bg-emerald-500'
    },
    {
      id: Phase.FEEDBACK,
      label: '피드백 및 대기',
      subLabel: `(${Math.floor(feedbackDuration / 60)}분 ${feedbackDuration % 60}초)`,
      duration: feedbackDuration,
      color: 'bg-slate-100 text-slate-500',
      activeColor: 'bg-slate-400'
    }
  ];
};
