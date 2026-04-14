import { create } from 'zustand';

type Phase = 'work' | 'short_break' | 'long_break';

interface PomodoroState {
  // Settings (synced from DB)
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  autoStartBreak: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;

  // Runtime
  phase: Phase;
  round: number; // current round number
  secondsLeft: number;
  isRunning: boolean;
  intervalId: ReturnType<typeof setInterval> | null;

  // Actions
  setSettings: (s: Partial<Omit<PomodoroState, 'phase' | 'round' | 'secondsLeft' | 'isRunning' | 'intervalId' | 'setSettings' | 'start' | 'pause' | 'reset' | 'tick' | 'nextPhase'>>) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  nextPhase: () => void;
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreak: false,
  autoStartWork: false,
  soundEnabled: true,

  phase: 'work',
  round: 1,
  secondsLeft: 25 * 60,
  isRunning: false,
  intervalId: null,

  setSettings: (s) =>
    set((state) => ({
      ...s,
      secondsLeft: s.workMinutes !== undefined && !state.isRunning ? s.workMinutes * 60 : state.secondsLeft,
    })),

  start: () => {
    const { isRunning } = get();
    if (isRunning) return;
    const id = setInterval(() => get().tick(), 1000);
    set({ isRunning: true, intervalId: id });
  },

  pause: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ isRunning: false, intervalId: null });
  },

  reset: () => {
    const { intervalId, workMinutes } = get();
    if (intervalId) clearInterval(intervalId);
    set({ isRunning: false, intervalId: null, phase: 'work', round: 1, secondsLeft: workMinutes * 60 });
  },

  tick: () => {
    const { secondsLeft } = get();
    if (secondsLeft > 0) {
      set({ secondsLeft: secondsLeft - 1 });
    } else {
      get().nextPhase();
    }
  },

  nextPhase: () => {
    const { phase, round, longBreakInterval, workMinutes, shortBreakMinutes, longBreakMinutes, autoStartBreak, autoStartWork, intervalId } = get();
    if (intervalId) clearInterval(intervalId);

    let nextPhase: Phase;
    let nextRound = round;
    let nextSeconds: number;

    if (phase === 'work') {
      if (round % longBreakInterval === 0) {
        nextPhase = 'long_break';
        nextSeconds = longBreakMinutes * 60;
      } else {
        nextPhase = 'short_break';
        nextSeconds = shortBreakMinutes * 60;
      }
    } else {
      nextPhase = 'work';
      nextRound = phase === 'long_break' ? 1 : round + 1;
      nextSeconds = workMinutes * 60;
    }

    const autoStart = nextPhase === 'work' ? autoStartWork : autoStartBreak;
    set({ phase: nextPhase, round: nextRound, secondsLeft: nextSeconds, isRunning: false, intervalId: null });

    if (autoStart) {
      const id = setInterval(() => get().tick(), 1000);
      set({ isRunning: true, intervalId: id });
    }
  },
}));
