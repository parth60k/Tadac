import type { FocusPreset, Category } from '@/types/domain';

export type TimerPhase = 'idle' | 'running' | 'paused' | 'break' | 'completed';

export interface SyncPayload {
  phase: TimerPhase;
  preset: FocusPreset;
  category: Category;
  linkedTaskId?: string;
  totalSecs: number;
  remainingSecs: number;
  cyclesCompleted: number;
  completedMins: number;
  xpEarned: number;
  
  // HUD-specific augmentations
  targetEndTime: number;
}

export type HudCommandAction = 'PAUSE' | 'RESUME' | 'STOP' | 'SKIP' | 'START';

export type WebToRelayMessage = 
  | { source: 'tadac-web'; type: 'FOCUS_TICK'; payload: SyncPayload };

export type RelayToWebMessage = 
  | { source: 'tadac-extension'; type: 'HUD_CONTROL'; action: HudCommandAction }
  | { source: 'tadac-extension'; type: 'HUD_REQUEST_STATE' };

export type ExtMessageType = 
  | { type: 'TADAC_STATE_SYNC'; payload: SyncPayload }
  | { type: 'TADAC_COMMAND'; action: HudCommandAction }
  | { type: 'TADAC_HUD_COMMAND'; action: HudCommandAction }
  | { type: 'TADAC_STATE_INIT' }
  | { type: 'TADAC_HUD_UPDATE'; payload: SyncPayload | null }
  | { type: 'TADAC_HUD_TOGGLE' }
  | { type: 'REQUEST_STATE_SYNC' }
  | { type: 'TADAC_DISCONNECTED' };
