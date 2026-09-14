'use client';

/**
 * Focus timer state machine.
 *
 * States:
 *   idle       → user has not started yet, preset selector visible
 *   running    → countdown ticking
 *   paused     → countdown frozen
 *   break      → short/long break countdown
 *   completed  → session done, completion card shown
 *
 * Transitions:
 *   idle      --[start]-->     running
 *   running   --[pause]-->     paused
 *   running   --[time up]--> break | completed (if break type)
 *   running   --[stop]-->      idle  (saves partial)
 *   paused    --[resume]-->    running
 *   paused    --[stop]-->      idle  (saves partial)
 *   break     --[skip]-->      running  (new focus cycle)
 *   break     --[time up]--> running  (auto-start next cycle)
 *   completed --[dismiss]--> idle
 */

import {
  createContext, useContext, useReducer, useEffect, useRef, useCallback,
} from 'react';
import type { FocusPreset, Category } from '@/types/domain';
import {
  startFocusSession, completeFocusSession, stopFocusSession,
} from '@/app/actions/focus';

// ─── Preset config ────────────────────────────────────────────────────────────

export interface PresetConfig {
  focus:      number;   // minutes
  shortBreak: number;
  longBreak:  number;
  cycles:     number;   // after how many focus sessions to take long break
}

export const PRESET_CONFIGS: Record<FocusPreset, PresetConfig> = {
  '25/5':  { focus: 25, shortBreak: 5,  longBreak: 15, cycles: 4 },
  '50/10': { focus: 50, shortBreak: 10, longBreak: 20, cycles: 3 },
  '60/10': { focus: 60, shortBreak: 10, longBreak: 20, cycles: 2 },
  '90/20': { focus: 90, shortBreak: 20, longBreak: 30, cycles: 2 },
  custom:  { focus: 25, shortBreak: 5,  longBreak: 15, cycles: 4 },
};

// ─── State types ──────────────────────────────────────────────────────────────

export type TimerPhase = 'idle' | 'running' | 'paused' | 'break' | 'completed';
export type BreakType  = 'short_break' | 'long_break';

export interface FocusState {
  phase:         TimerPhase;
  preset:        FocusPreset;
  config:        PresetConfig;
  category:      Category;
  linkedTaskId:  string | undefined;

  // Countdown
  totalSecs:     number;   // total seconds for current phase
  remainingSecs: number;   // seconds left

  // Session tracking
  cyclesCompleted: number;
  sessionId:       string | undefined;   // DB row id for current focus session
  breakSessionId:  string | undefined;   // DB row id for current break session

  // Elapsed actual focus seconds (to store in DB on complete/stop)
  elapsedFocusSecs: number;

  // Completion data
  completedMins:  number;
  xpEarned:       number;

  // Custom preset values
  customConfig: PresetConfig;
}

type Action =
  | { type: 'SET_PRESET';    preset: FocusPreset; config?: PresetConfig }
  | { type: 'SET_CATEGORY';  category: Category }
  | { type: 'SET_TASK';      taskId: string | undefined }
  | { type: 'STARTED';       sessionId: string }
  | { type: 'TICK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'FOCUS_COMPLETE'; breakType: BreakType; breakSessionId?: string }
  | { type: 'BREAK_COMPLETE' }
  | { type: 'STOP';          xpEarned: number }
  | { type: 'DISMISS' }
  | { type: 'SET_CUSTOM_CONFIG'; config: PresetConfig };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function buildInitialState(): FocusState {
  const preset  = '25/5';
  const config  = PRESET_CONFIGS[preset];
  return {
    phase:            'idle',
    preset,
    config,
    category:         'Other',
    linkedTaskId:     undefined,
    totalSecs:        config.focus * 60,
    remainingSecs:    config.focus * 60,
    cyclesCompleted:  0,
    sessionId:        undefined,
    breakSessionId:   undefined,
    elapsedFocusSecs: 0,
    completedMins:    0,
    xpEarned:         0,
    customConfig:     { focus: 25, shortBreak: 5, longBreak: 15, cycles: 4 },
  };
}

function focusReducer(state: FocusState, action: Action): FocusState {
  switch (action.type) {
    case 'SET_PRESET': {
      const config = action.config ?? PRESET_CONFIGS[action.preset];
      return {
        ...state,
        preset:          action.preset,
        config,
        totalSecs:       config.focus * 60,
        remainingSecs:   config.focus * 60,
        elapsedFocusSecs: 0,
      };
    }
    case 'SET_CATEGORY':
      return { ...state, category: action.category };
    case 'SET_TASK':
      return { ...state, linkedTaskId: action.taskId };
    case 'STARTED':
      return {
        ...state,
        phase:            'running',
        sessionId:        action.sessionId,
        elapsedFocusSecs: 0,
      };
    case 'TICK': {
      if (state.phase !== 'running' && state.phase !== 'break') return state;
      const remaining = state.remainingSecs - 1;
      return {
        ...state,
        remainingSecs:    remaining,
        elapsedFocusSecs: state.phase === 'running'
          ? state.elapsedFocusSecs + 1
          : state.elapsedFocusSecs,
      };
    }
    case 'PAUSE':
      return { ...state, phase: 'paused' };
    case 'RESUME':
      return { ...state, phase: 'running' };
    case 'FOCUS_COMPLETE': {
      const cycles       = state.cyclesCompleted + 1;
      const breakMins    = action.breakType === 'long_break'
        ? state.config.longBreak
        : state.config.shortBreak;
      return {
        ...state,
        phase:            'break',
        cyclesCompleted:  cycles,
        totalSecs:        breakMins * 60,
        remainingSecs:    breakMins * 60,
        breakSessionId:   action.breakSessionId,
        elapsedFocusSecs: 0,
      };
    }
    case 'BREAK_COMPLETE': {
      const totalSecs = state.config.focus * 60;
      return {
        ...state,
        phase:         'idle',
        totalSecs,
        remainingSecs: totalSecs,
        sessionId:     undefined,
        breakSessionId: undefined,
      };
    }
    case 'STOP': {
      const completedMins = Math.floor(state.elapsedFocusSecs / 60);
      return {
        ...state,
        phase:          'completed',
        completedMins,
        xpEarned:       action.xpEarned,
        totalSecs:      state.config.focus * 60,
        remainingSecs:  state.config.focus * 60,
        sessionId:      undefined,
        breakSessionId: undefined,
        elapsedFocusSecs: 0,
      };
    }
    case 'DISMISS':
      return buildInitialState();
    case 'SET_CUSTOM_CONFIG': {
      return {
        ...state,
        customConfig: action.config,
        ...(state.preset === 'custom' && {
          config:       action.config,
          totalSecs:    action.config.focus * 60,
          remainingSecs: action.config.focus * 60,
        }),
      };
    }
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface FocusContextValue {
  state:       FocusState;
  handleStart: () => Promise<void>;
  handlePause: () => void;
  handleResume: () => void;
  handleStop:  () => Promise<void>;
  handleSkipBreak: () => void;
  handleDismiss: () => void;
  setPreset:   (p: FocusPreset, config?: PresetConfig) => void;
  setCategory: (c: Category) => void;
  setTask:     (id: string | undefined) => void;
  setCustomConfig: (c: PresetConfig) => void;
  progress:    number;   // 0–1
  formattedTime: string; // MM:SS
}

const FocusContext = createContext<FocusContextValue>(null!);

export function FocusProvider({ children, xpPerSession = 30 }: {
  children: React.ReactNode;
  xpPerSession?: number;
}) {
  const [state, dispatch] = useReducer(focusReducer, buildInitialState());
  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef          = useRef(state);

  // Keep stateRef in sync AFTER render (not during render)
  useEffect(() => {
    stateRef.current = state;
  });

  // ── Tick every second ─────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase === 'running' || state.phase === 'break') {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.phase]);

  // ── Focus time-up handler (defined before the effect that calls it) ───────
  const handleFocusTimeUp = useCallback(async () => {
    const s          = stateRef.current;
    const actualMins = Math.max(1, Math.round(s.elapsedFocusSecs / 60));
    const cycles     = s.cyclesCompleted + 1;
    const breakType: BreakType = cycles % s.config.cycles === 0 ? 'long_break' : 'short_break';

    if (s.sessionId) {
      await completeFocusSession({
        sessionId:  s.sessionId,
        actualMins,
        xpAmount:   xpPerSession,
      });
    }

    let breakSessionId: string | undefined;
    const breakMins   = breakType === 'long_break' ? s.config.longBreak : s.config.shortBreak;
    const breakResult = await startFocusSession({
      preset:      s.preset,
      sessionType: breakType,
      category:    s.category,
      plannedMins: breakMins,
    });
    if (breakResult.success) breakSessionId = breakResult.data.id;

    dispatch({ type: 'FOCUS_COMPLETE', breakType, breakSessionId });
  }, [xpPerSession]);

  // ── Handle time-up ────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.remainingSecs > 0) return;
    if (state.phase === 'running') {
      handleFocusTimeUp();
    } else if (state.phase === 'break') {
      dispatch({ type: 'BREAK_COMPLETE' });
    }
  }, [state.remainingSecs, state.phase, handleFocusTimeUp]);

  const handleStart = useCallback(async () => {
    const s = stateRef.current;
    const result = await startFocusSession({
      preset:      s.preset,
      sessionType: 'focus',
      category:    s.category,
      plannedMins: s.config.focus,
      taskId:      s.linkedTaskId,
    });
    if (result.success) {
      dispatch({ type: 'STARTED', sessionId: result.data.id });
    }
  }, []);

  const handlePause = useCallback(() => {
    dispatch({ type: 'PAUSE' });
  }, []);

  const handleResume = useCallback(() => {
    dispatch({ type: 'RESUME' });
  }, []);

  const handleStop = useCallback(async () => {
    const s          = stateRef.current;
    const actualMins = Math.max(0, Math.round(s.elapsedFocusSecs / 60));
    const xpEarned   = s.phase === 'running' && actualMins > 0 ? xpPerSession : 0;

    if (s.sessionId) {
      await stopFocusSession({ sessionId: s.sessionId, actualMins });
    }
    if (s.breakSessionId) {
      await stopFocusSession({ sessionId: s.breakSessionId, actualMins: 0 });
    }

    dispatch({ type: 'STOP', xpEarned });
  }, [xpPerSession]);

  const handleSkipBreak = useCallback(() => {
    dispatch({ type: 'BREAK_COMPLETE' });
  }, []);

  const handleDismiss = useCallback(() => {
    dispatch({ type: 'DISMISS' });
  }, []);

  const setPreset      = useCallback((p: FocusPreset, config?: PresetConfig) => {
    dispatch({ type: 'SET_PRESET', preset: p, config });
  }, []);
  const setCategory    = useCallback((c: Category) => dispatch({ type: 'SET_CATEGORY', category: c }), []);
  const setTask        = useCallback((id: string | undefined) => dispatch({ type: 'SET_TASK', taskId: id }), []);
  const setCustomConfig = useCallback((c: PresetConfig) => dispatch({ type: 'SET_CUSTOM_CONFIG', config: c }), []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const progress      = state.totalSecs > 0
    ? Math.max(0, (state.totalSecs - state.remainingSecs) / state.totalSecs)
    : 0;

  const mins          = Math.floor(state.remainingSecs / 60);
  const secs          = state.remainingSecs % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <FocusContext.Provider value={{
      state, handleStart, handlePause, handleResume,
      handleStop, handleSkipBreak, handleDismiss,
      setPreset, setCategory, setTask, setCustomConfig,
      progress, formattedTime,
    }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  return useContext(FocusContext);
}
